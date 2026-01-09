/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { Payment } from './model';
import { IPayment } from './interface';
import mongoose from 'mongoose';
import { Fees } from '../fees/model';
import { Student } from '../student/student.model';
import { Receipt } from '../receipt/model';

const createPayment = async (payload: IPayment) => {
  const result = await Payment.create(payload);
  return result;
};

const getAllPayments = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(Payment.find(), query)
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const data = await queryBuilder.modelQuery;

  return { meta, data };
};

const getSinglePayment = async (id: string) => {
  const result = await Payment.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
  }
  return result;
};

const updatePayment = async (id: string, payload: Partial<IPayment>) => {
  const result = await Payment.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Failed to update payment');
  }
  return result;
};

const deletePayment = async (id: string) => {
  const result = await Payment.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Payment not found or already deleted',
    );
  }
  return result;
};

const createBulkPayment = async (payload: {
  studentId: string;
  feeIds: string[];
  amountPaid: number;
  paymentMethod: string;
  transactionId?: string;
  note?: string;
  collectedBy: string;
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if student exists
    const student = await Student.findById(payload.studentId).session(session);
    if (!student) {
      throw new AppError(httpStatus.NOT_FOUND, 'Student not found');
    }

    // Check if fees exist
    const fees = await Fees.find({ _id: { $in: payload.feeIds } }).session(
      session,
    );

    if (fees.length === 0) {
      throw new AppError(httpStatus.BAD_REQUEST, 'No fees selected');
    }

    if (fees.length !== payload.feeIds.length) {
      throw new AppError(httpStatus.NOT_FOUND, 'Some fees not found');
    }

    // Verify all fees belong to the same student
    for (const fee of fees) {
      if (fee.student.toString() !== payload.studentId) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Fee ${fee._id} does not belong to student ${payload.studentId}`,
        );
      }
    }

    // Calculate total due amount
    let totalDue = 0;
    const feeDetails = [];

    for (const fee of fees) {
      const netAmount = fee.amount - (fee.discount || 0) - (fee.waiver || 0);
      const dueAmount = netAmount - (fee.paidAmount || 0);

      if (dueAmount > 0) {
        totalDue += dueAmount;
      }

      feeDetails.push({
        feeId: fee._id,
        feeType: fee.feeType || 'General Fee',
        month: fee.month,
        originalAmount: fee.amount,
        discount: fee.discount || 0,
        waiver: fee.waiver || 0,
        netAmount,
        previousPaid: fee.paidAmount || 0,
        currentDue: Math.max(0, dueAmount),
        status: fee.status,
      });
    }

    // Validate payment amount
    if (payload.amountPaid > totalDue) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Payment amount (${payload.amountPaid}) exceeds total due (${totalDue})`,
      );
    }

    if (payload.amountPaid <= 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Payment amount must be greater than 0',
      );
    }

    // Generate unique receipt number
    const receiptNo = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // ✅ প্রথমে পেমেন্ট রেকর্ড তৈরি করুন
    const paymentData = {
      student: payload.studentId,
      fees: payload.feeIds,
      totalAmount: payload.amountPaid,
      paymentMethod: payload.paymentMethod,
      transactionId: payload.transactionId,
      note: payload.note,
      collectedBy: payload.collectedBy,
      receiptNo: receiptNo,
      receiptType: 'bulk',
      paymentDate: new Date(),
      receiptData: {
        studentName: student.name,
        studentId: student.studentId,
        className: student.className || 'N/A',
        feeDetails,
        paymentDetails: {
          amountPaid: payload.amountPaid,
          paymentMethod: payload.paymentMethod,
          transactionId: payload.transactionId,
          date: new Date(),
        },
      },
    };

    const payment = await Payment.create([paymentData], { session });

    // Update each fee's paidAmount and status
    let remainingAmount = payload.amountPaid;

    for (const fee of fees) {
      const netAmount = fee.amount - (fee.discount || 0) - (fee.waiver || 0);
      const currentDue = netAmount - (fee.paidAmount || 0);

      if (currentDue > 0 && remainingAmount > 0) {
        const amountToPay = Math.min(currentDue, remainingAmount);
        const newPaidAmount = (fee.paidAmount || 0) + amountToPay;
        const newDueAmount = netAmount - newPaidAmount;

        // Determine new status
        let newStatus = 'unpaid';
        if (newPaidAmount >= netAmount) {
          newStatus = 'paid';
        } else if (newPaidAmount > 0) {
          newStatus = 'partial';
        }

        await Fees.findByIdAndUpdate(
          fee._id,
          {
            paidAmount: newPaidAmount,
            dueAmount: newDueAmount,
            status: newStatus,
            paymentDate: new Date(),
            paymentMethod: payload.paymentMethod,
            receiptNo: receiptNo,
            transactionId: payload.transactionId,
          },
          { session, new: true },
        );

        remainingAmount -= amountToPay;
      }
    }

    if (remainingAmount > 0) {
      await Student.findByIdAndUpdate(
        payload.studentId,
        { $inc: { advanceBalance: remainingAmount } },
        { session },
      );
    }

    const receiptDataForReceiptModel = {
      receiptNo: receiptNo,
      student: payload.studentId,
      studentName: student.name,
      studentId: student.studentId,
      className:
        typeof student.className === 'string'
          ? student.className
          : student.className?.[0]?.className || 'N/A',
      paymentId: payment[0]._id,
      totalAmount: payload.amountPaid,
      paymentMethod: payload.paymentMethod,
      paymentDate: new Date(),
      collectedBy: payload.collectedBy,
      transactionId: payload.transactionId,
      note: payload.note,
      fees: feeDetails.map((fee) => ({
        feeType: fee.feeType,
        month: fee.month,
        originalAmount: fee.originalAmount,
        discount: fee.discount || 0,
        waiver: fee.waiver || 0,
        netAmount: fee.netAmount,
        paidAmount: fee.currentDue,
      })),
      summary: {
        totalItems: feeDetails.length,
        subtotal: feeDetails.reduce((sum, fee) => sum + fee.originalAmount, 0),
        totalDiscount: feeDetails.reduce(
          (sum, fee) => sum + (fee.discount || 0),
          0,
        ),
        totalWaiver: feeDetails.reduce(
          (sum, fee) => sum + (fee.waiver || 0),
          0,
        ),
        totalNetAmount: feeDetails.reduce((sum, fee) => sum + fee.netAmount, 0),
        amountPaid: payload.amountPaid,
      },
      institute: {
        name: 'Craft International Institute',
        address: '123 Education Street, Dhaka, Bangladesh',
        phone: '+880 1300-726000',
        mobile: '+880 1830-678383',
        email: 'info@craftinstitute.edu.bd',
        website: 'www.craftinstitute.edu.bd',
      },
      status: 'active',
    };

    // রিসিট ডাটাবেজে সেভ করুন
    const receipt = await Receipt.create([receiptDataForReceiptModel], {
      session,
    });

    // ✅ স্টুডেন্টে পেমেন্ট এবং রিসিট রেফারেন্স যোগ করুন
    await Student.findByIdAndUpdate(
      payload.studentId,
      {
        $push: {
          payments: payment[0]._id,
          receipts: receipt[0]._id, // ✅ রিসিট রেফারেন্স যোগ করুন
        },
      },
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    // Get populated payment data
    const populatedPayment = await Payment.findById(payment[0]._id)
      .populate('student', 'name studentId className email phone')
      .populate({
        path: 'fees',
        select:
          'feeType month amount discount waiver paidAmount dueAmount status paymentDate',
      })
      .lean();

    // রিসিট ডেটাও ফেরত দিন
    const populatedReceipt = await Receipt.findById(receipt[0]._id).lean();

    return {
      success: true,
      message: 'Bulk payment processed successfully',
      data: {
        payment: populatedPayment,
        receipt: populatedReceipt, // ✅ রিসিট ডেটা যোগ করুন
      },
      receiptNo,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    // Handle duplicate key error
    if (error.code === 11000) {
      throw new AppError(
        httpStatus.CONFLICT,
        'Receipt number already exists. Please try again.',
      );
    }

    throw error;
  }
};

// Generate receipt data
const generateReceiptData = async (paymentId: string) => {
  const payment = await Payment.findById(paymentId)
    .populate('student')
    .populate({
      path: 'fees',
      select:
        'feeType month amount discount waiver paidAmount dueAmount status',
    })
    .lean();

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
  }

  const receiptData = {
    receiptNo: payment.receiptNo,
    paymentDate: payment.paymentDate,
    student: {
      name: (payment.student as any).name,
      studentId: (payment.student as any).studentId,
      className: (payment.student as any).className || 'N/A',
    },
    fees: payment.fees.map((fee: any) => ({
      feeType: fee.feeType,
      month: fee.month,
      amount: fee.amount,
      discount: fee.discount || 0,
      waiver: fee.waiver || 0,
      netAmount: fee.amount - (fee.discount || 0) - (fee.waiver || 0),
      paidAmount: fee.paidAmount || 0,
      dueAmount: fee.dueAmount || 0,
      status: fee.status,
    })),
    payment: {
      totalAmount: payment.totalAmount,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      collectedBy: payment.collectedBy,
      note: payment.note,
    },
    summary: {
      totalFees: payment.fees.length,
      totalAmount: payment.fees.reduce(
        (sum: number, fee: any) => sum + fee.amount,
        0,
      ),
      totalAdjustments: payment.fees.reduce(
        (sum: number, fee: any) =>
          sum + (fee.discount || 0) + (fee.waiver || 0),
        0,
      ),
      totalPaid: payment.totalAmount,
    },
  };

  return receiptData;
};

// Get student's receipts from Receipt model
const getStudentReceipts = async (studentId: string) => {
  const receipts = await Receipt.find({ student: studentId })
    .sort({ paymentDate: -1 })
    .select(
      'receiptNo totalAmount paymentMethod paymentDate collectedBy status',
    )
    .lean();

  return receipts;
};

// Get receipt by receipt number
const getReceiptByNumber = async (receiptNo: string) => {
  const receipt = await Receipt.findOne({ receiptNo })
    .populate('student', 'name studentId className')
    .lean();

  if (!receipt) {
    throw new AppError(httpStatus.NOT_FOUND, 'Receipt not found');
  }

  return receipt;
};

export const paymentServices = {
  createBulkPayment,
  generateReceiptData,
  createPayment,
  getAllPayments,
  getSinglePayment,
  updatePayment,
  deletePayment,
  getStudentReceipts,
  getReceiptByNumber,
};
