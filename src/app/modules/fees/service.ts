/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { Fees } from './model';
import { IFees } from './interface';
import { Enrollment } from '../enrollment/model';
import { Student } from '../student/student.model';
import { Payment } from '../payment/model';
import mongoose, { Types } from 'mongoose';
import { feeAdjustmentServices } from '../feeAdjustment/service';
import { FeeAdjustment } from '../feeAdjustment/model';

const payFee = async (
  feeId: string,
  amountPaid: number,
  paymentMethod: IFees['paymentMethod'],
  transactionId?: string,
  receiptNo?: string,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const validation = await feeAdjustmentServices.validateAdjustmentForPayment(
      feeId,
      amountPaid,
    );
    const { fee, remainingDue } = validation;

    const actualRemainingDue = remainingDue - amountPaid;
    let advanceUsed = 0;
    let newStatus: 'paid' | 'partial' | 'unpaid' = fee.status;

    if (actualRemainingDue <= 0) {
      advanceUsed = -actualRemainingDue;
      fee.dueAmount = 0;
      newStatus = 'paid';

      if (advanceUsed > 0) {
        await Student.findByIdAndUpdate(
          fee.student,
          { $inc: { advanceBalance: advanceUsed } },
          { session },
        );
      }
    } else {
      fee.dueAmount = actualRemainingDue;
      newStatus = 'partial';
    }

    fee.paidAmount += amountPaid;
    fee.advanceUsed += advanceUsed;
    fee.status = newStatus;
    fee.paymentMethod = paymentMethod;
    fee.transactionId = transactionId;
    fee.receiptNo = receiptNo;
    fee.paymentDate = new Date();

    await fee.save({ session });

    const paymentData = {
      student: fee.student,
      enrollment: fee.enrollment,
      fee: fee._id,
      amountPaid: amountPaid,
      paymentMethod: paymentMethod,
      paymentDate: new Date(),
      transactionId: transactionId || `TXN-${Date.now()}`,
      receiptNo: receiptNo || `RCP-${Date.now()}`,
      note: `Payment for ${fee.month} after adjustments`,
      collectedBy: 'System',
    };

    const payment = await Payment.create([paymentData], { session });

    // Update student with the new payment
    await Student.findByIdAndUpdate(
      fee.student,
      { $push: { payments: payment[0]._id } },
      { session },
    );

    await session.commitTransaction();

    return {
      fee,
      payment: payment[0],
      adjustmentApplied: fee.discount + fee.waiver,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const generateMonthlyFees = async (
  studentId: string,
  enrollmentId: string,
  studentClass: string,
  yearlyFee: number,
  startYear = new Date().getFullYear(),
) => {
  const monthlyFee = Math.round(yearlyFee / 12);
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const feeRecords = months.map((month) => ({
    student: new Types.ObjectId(studentId),
    enrollment: new Types.ObjectId(enrollmentId),
    class: studentClass,
    month: `${month}-${startYear}`,
    amount: monthlyFee,
    paidAmount: 0,
    advanceUsed: 0,
    dueAmount: monthlyFee,
    discount: 0,
    waiver: 0,
    status: 'unpaid' as const,
    academicYear: startYear.toString(),
    isCurrentMonth: false,
  }));

  const createdFees = await Fees.insertMany(feeRecords);

  for (const fee of createdFees) {
    await feeAdjustmentServices.applyAutoAdjustments(
      fee._id.toString(),
      studentId,
      startYear.toString(),
    );
  }

  await Student.findByIdAndUpdate(studentId, {
    $push: { fees: { $each: createdFees.map((fee) => fee._id) } },
  });

  await Enrollment.findByIdAndUpdate(enrollmentId, {
    $push: { fees: { $each: createdFees.map((fee) => fee._id) } },
  });

  return createdFees;
};

const payFeeWithAdvance = async (
  feeId: string,
  cashPaid: number = 0,
  advanceUsed: number = 0,
  paymentMethod: IFees['paymentMethod'] = 'cash',
  transactionId?: string,
  receiptNo?: string,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const fee = await Fees.findById(feeId).session(session);
    if (!fee) throw new AppError(httpStatus.NOT_FOUND, 'Fee record not found');

    const student = await Student.findById(fee.student).session(session);
    if (!student) throw new AppError(httpStatus.NOT_FOUND, 'Student not found');

    if (
      advanceUsed > 0 &&
      (!student.advanceBalance || student.advanceBalance < advanceUsed)
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Insufficient advance balance',
      );
    }

    const totalPaid = cashPaid + advanceUsed;
    const remainingDue = fee.dueAmount - totalPaid;

    if (remainingDue < 0) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Payment exceeds due amount');
    }

    fee.paidAmount += totalPaid;
    fee.advanceUsed += advanceUsed;
    fee.dueAmount = remainingDue;
    fee.status = remainingDue === 0 ? 'paid' : 'partial';
    fee.paymentMethod = paymentMethod;
    fee.transactionId = transactionId;
    fee.receiptNo = receiptNo;
    fee.paymentDate = new Date();

    if (advanceUsed > 0) {
      student.advanceBalance = (student.advanceBalance || 0) - advanceUsed;
      await student.save({ session });
    }

    await fee.save({ session });
    const paymentData = {
      student: fee.student,
      enrollment: fee.enrollment,
      fee: fee._id,
      amountPaid: totalPaid,
      paymentMethod: paymentMethod,
      paymentDate: new Date(),
      transactionId: transactionId || `TXN-${Date.now()}`,
      receiptNo: receiptNo || `RCP-${Date.now()}`,
      note: `Payment for ${fee.month}`,
      collectedBy: 'System',
    };

    const payment = await Payment.create([paymentData], { session });

    await session.commitTransaction();
    return {
      fee,
      payment: payment[0],
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getStudentDueFees = async (studentId: string, year?: number) => {
  const currentYear = year || new Date().getFullYear();

  const dueFees = await Fees.find({
    student: new Types.ObjectId(studentId),
    dueAmount: { $gt: 0 },
    academicYear: currentYear.toString(),
  }).sort({ month: 1 });
  const totalDue = dueFees.reduce((sum, fee) => sum + fee.dueAmount, 0);
  const paidFees = await Fees.find({
    student: new Types.ObjectId(studentId),
    dueAmount: 0,
    academicYear: currentYear.toString(),
  }).sort({ month: 1 });

  return {
    dueFees,
    paidFees,
    totalDue,
    totalPaid: paidFees.reduce((sum, fee) => sum + fee.paidAmount, 0),
  };
};

const getMonthlyFeeStatus = async (
  studentId: string,
  month: string,
  year: number,
) => {
  const monthYear = `${month}-${year}`;

  const fee = await Fees.findOne({
    student: new Types.ObjectId(studentId),
    month: monthYear,
  });

  if (!fee) {
    return {
      month: monthYear,
      amount: 0,
      paidAmount: 0,
      dueAmount: 0,
      status: 'not-generated',
      paymentDate: null,
    };
  }

  return fee;
};

const generateBulkMonthlyFees = async (
  feeData: Array<{
    studentId: string;
    enrollmentId: string;
    studentClass: string;
    yearlyFee: number;
    startYear?: number;
  }>,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const results = [];

    for (const data of feeData) {
      const fees = await generateMonthlyFees(
        data.studentId,
        data.enrollmentId,
        data.studentClass,
        data.yearlyFee,
        data.startYear,
      );
      results.push(fees);
    }

    await session.commitTransaction();
    return results.flat();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getAllFees = async (query: Record<string, any>) => {
  const queryBuilder = new QueryBuilder(
    Fees.find().populate('enrollment student'),
    query,
  )
    .search(['class', 'month', 'status'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const data = await queryBuilder.modelQuery;

  return { meta, data };
};

const getSingleFee = async (id: string) => {
  const fee = await Fees.findById(id).populate('student enrollment');
  if (!fee) throw new AppError(httpStatus.NOT_FOUND, 'Fee record not found');
  return fee;
};

const updateFee = async (id: string, payload: Partial<IFees>) => {
  const fee = await Fees.findById(id);
  if (!fee) throw new AppError(httpStatus.NOT_FOUND, 'Fee record not found');

  Object.assign(fee, payload);

  return await fee.save();
};

const deleteFee = async (id: string) => {
  const fee = await Fees.findByIdAndDelete(id);
  if (!fee) throw new AppError(httpStatus.NOT_FOUND, 'Fee record not found');
  return fee;
};

export const getAllDueFees = async (query: Record<string, any>) => {
  const { year, class: className } = query;
  const academicYear = (year || new Date().getFullYear()).toString();

  const matchStage: any = {
    academicYear,
  };
  if (className) matchStage.class = className;

  const pipeline: any[] = [
    { $match: matchStage },
    {
      $addFields: {
        computedDue: {
          $subtract: [
            '$amount',
            {
              $add: [
                { $ifNull: ['$paidAmount', 0] },
                { $ifNull: ['$discount', 0] },
                { $ifNull: ['$waiver', 0] },
                { $ifNull: ['$advanceUsed', 0] },
              ],
            },
          ],
        },
      },
    },
    { $match: { computedDue: { $gt: 0.009 } } },

    {
      $lookup: {
        from: 'students',
        localField: 'student',
        foreignField: '_id',
        as: 'studentDoc',
      },
    },
    { $unwind: '$studentDoc' },
    {
      $lookup: {
        from: 'enrollments',
        localField: 'enrollment',
        foreignField: '_id',
        as: 'enrollDoc',
      },
    },
    { $unwind: { path: '$enrollDoc', preserveNullAndEmptyArrays: true } },

    { $sort: { student: 1, month: 1 } },

    {
      $group: {
        _id: '$student',
        student: { $first: '$studentDoc' },
        enrollment: { $first: '$enrollDoc' },
        fees: {
          $push: {
            _id: '$_id',
            month: '$month',
            class: '$class',
            feeType: '$feeType',
            amount: '$amount',
            paidAmount: { $ifNull: ['$paidAmount', 0] },
            discount: { $ifNull: ['$discount', 0] },
            waiver: { $ifNull: ['$waiver', 0] },
            advanceUsed: { $ifNull: ['$advanceUsed', 0] },
            computedDue: '$computedDue',
            status: '$status',
            paymentDate: '$paymentDate',
          },
        },

        totalDue: { $sum: '$computedDue' },
        totalPaid: { $sum: { $ifNull: ['$paidAmount', 0] } },
        totalAmount: { $sum: { $ifNull: ['$amount', 0] } },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        student: {
          _id: '$student._id',
          name: '$student.name',
          studentId: '$student.studentId',
          mobile: '$student.mobile',
        },
        enrollment: {
          _id: '$enrollment._id',
          rollNumber: '$enrollment.rollNumber',
        },
        fees: 1,
        totalDue: { $round: ['$totalDue', 2] },
        totalPaid: 1,
        totalAmount: 1,
        feesCount: '$count',
      },
    },
  ];

  const students = await Fees.aggregate(pipeline).allowDiskUse(true);

  const summary = {
    totalStudents: students.length,
    totalFees: students.reduce(
      (s: number, st: any) => s + (st.feesCount || 0),
      0,
    ),
    totalDueAmount: students.reduce(
      (s: number, st: any) => s + (st.totalDue || 0),
      0,
    ),
    totalPaidAmount: students.reduce(
      (s: number, st: any) => s + (st.totalPaid || 0),
      0,
    ),
    totalAmount: students.reduce(
      (s: number, st: any) => s + (st.totalAmount || 0),
      0,
    ),
    academicYear,
  };

  return { summary, students };
};

const createSingleFee = async (
  studentId: string,
  payload: {
    class: string;
    month: string;
    amount: number;
    feeType?: string;
    academicYear: string;
    discount?: number;
    discountType?: 'flat' | 'percentage';
    waiver?: number;
    waiverType?: 'flat' | 'percentage';
    reason?: string;
    note?: string;
    isMonthly?: boolean;
    isYearly?: boolean;
    isRecurring?: boolean;
  },
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ✅ Check student
    const student = await Student.findById(studentId).session(session);
    if (!student) {
      throw new AppError(httpStatus.NOT_FOUND, 'Student not found');
    }

    // ✅ Calculate discount
    let actualDiscount = payload.discount || 0;
    let actualWaiver = payload.waiver || 0;

    if (payload.discountType === 'percentage') {
      actualDiscount = (payload.amount * actualDiscount) / 100;
    }

    if (payload.waiverType === 'percentage') {
      actualWaiver = (payload.amount * actualWaiver) / 100;
    }

    // Prevent overflow
    actualDiscount = Math.min(actualDiscount, payload.amount);
    actualWaiver = Math.min(actualWaiver, payload.amount - actualDiscount);

    const netAmount = payload.amount - actualDiscount - actualWaiver;

    // ✅ Prevent duplicate fee (same month + class + year)
    const existingFee = await Fees.findOne({
      student: studentId,
      class: payload.class,
      month: payload.month,
      academicYear: payload.academicYear,
      feeType: payload.feeType,
    }).session(session);

    if (existingFee) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Fee already exists for ${payload.month} in class ${payload.class}`,
      );
    }

    // ✅ Create fee
    const feeData = {
      student: new Types.ObjectId(studentId),
      class: payload.class,
      month: payload.month,
      amount: payload.amount,
      paidAmount: 0,
      advanceUsed: 0,
      dueAmount: netAmount,
      discount: actualDiscount,
      waiver: actualWaiver,
      feeType: payload.feeType || 'other',
      status: netAmount > 0 ? 'unpaid' : 'paid',
      academicYear: payload.academicYear,
      isCurrentMonth: false,
    };

    const [newFee] = await Fees.create([feeData], { session });

    // ✅ Push fee into student
    await Student.findByIdAndUpdate(
      studentId,
      { $push: { fees: newFee._id } },
      { session },
    );


    if (actualDiscount > 0) {
      await FeeAdjustment.create(
        [
          {
            student: studentId,
            fee: newFee._id,
            type: 'discount',
            adjustmentType: payload.discountType || 'flat',
            value: actualDiscount,
            reason: payload.reason || 'Manual discount',
            approvedBy: null,
            startMonth: payload.month,
            endMonth: payload.month,
            academicYear: payload.academicYear,
            isActive: true,
            isRecurring: payload.isRecurring || false,
          },
        ],
        { session },
      );
    }

    if (actualWaiver > 0) {
      await FeeAdjustment.create(
        [
          {
            student: studentId,
            fee: newFee._id,
            type: 'waiver',
            adjustmentType: payload.waiverType || 'flat',
            value: actualWaiver,
            reason: payload.reason || 'Manual waiver',
            approvedBy: null,
            startMonth: payload.month,
            endMonth: payload.month,
            academicYear: payload.academicYear,
            isActive: true,
            isRecurring: payload.isRecurring || false,
          },
        ],
        { session },
      );
    }

    await feeAdjustmentServices.applyAutoAdjustments(
      newFee._id.toString(),
      studentId,
      payload.academicYear,
    );

    await session.commitTransaction();

    const updatedFee = await Fees.findById(newFee._id)
      .populate('student')
      .session(session);

    return updatedFee;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const feesServices = {
  generateMonthlyFees,
  generateBulkMonthlyFees,
  payFee,
  payFeeWithAdvance,
  getStudentDueFees,
  getMonthlyFeeStatus,
  getAllFees,
  getSingleFee,
  updateFee,
  deleteFee,
  getAllDueFees,
  createSingleFee,
};
