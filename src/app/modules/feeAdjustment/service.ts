/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { FeeAdjustment } from './model';
import { IFeeAdjustment } from './interface';
import { Fees } from '../fees/model';
import mongoose, { Types } from 'mongoose';

/**
 * নতুন ফি অ্যাডজাস্টমেন্ট তৈরি এবং ফি রেকর্ডে প্রয়োগ
 */
const createFeeAdjustment = async (payload: IFeeAdjustment) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ফি অ্যাডজাস্টমেন্ট তৈরি
    const adjustment = await FeeAdjustment.create([payload], { session });

    // সংশ্লিষ্ট ফি রেকর্ডে অ্যাডজাস্টমেন্ট প্রয়োগ
    await applyAdjustmentToFee(payload.fee.toString(), payload, session);

    await session.commitTransaction();
    return adjustment[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * ফি রেকর্ডে অ্যাডজাস্টমেন্ট প্রয়োগ
 */
const applyAdjustmentToFee = async (
  feeId: string,
  adjustment: IFeeAdjustment,
  session: mongoose.ClientSession,
) => {
  const fee = await Fees.findById(feeId).session(session);
  if (!fee) {
    throw new AppError(httpStatus.NOT_FOUND, 'Fee record not found');
  }

  let adjustmentAmount = 0;

  if (adjustment.adjustmentType === 'percentage') {
    // শতকরা হিসাবে ক্যালকুলেশন
    adjustmentAmount = (fee.amount * adjustment.value) / 100;
  } else {
    // ফ্ল্যাট অ্যামাউন্ট
    adjustmentAmount = adjustment.value;
  }

  // অ্যাডজাস্টমেন্ট টাইপ অনুযায়ী আপডেট
  if (adjustment.type === 'discount') {
    fee.discount = adjustmentAmount;
  } else if (adjustment.type === 'waiver') {
    fee.waiver = adjustmentAmount;
  }

  // Due amount রিক্যালকুলেট
  fee.dueAmount = Math.max(
    0,
    fee.amount - fee.paidAmount - fee.advanceUsed - fee.discount - fee.waiver,
  );

  // স্ট্যাটাস আপডেট
  if (fee.dueAmount === 0) {
    fee.status = 'paid';
  } else if (fee.paidAmount + fee.advanceUsed > 0) {
    fee.status = 'partial';
  } else {
    fee.status = 'unpaid';
  }

  await fee.save({ session });
  return fee;
};

/**
 * স্টুডেন্টের জন্য অ্যাডজাস্টমেন্ট প্রয়োগ (বাল্ক)
 */
const applyAdjustmentToStudentFees = async (
  studentId: string,
  adjustmentData: Partial<IFeeAdjustment>,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // স্টুডেন্টের সকল unpaid/partial ফি খুঁজে বের করুন
    const studentFees = await Fees.find({
      student: new Types.ObjectId(studentId),
      status: { $in: ['unpaid', 'partial'] },
    }).session(session);

    const adjustments = [];

    for (const fee of studentFees) {
      const adjustmentPayload: IFeeAdjustment = {
        ...adjustmentData,
        student: new Types.ObjectId(studentId),
        fee: fee._id as Types.ObjectId,
        enrollment: fee.enrollment as Types.ObjectId,
        academicYear: fee.academicYear,
        startMonth: fee.month,
        endMonth: fee.month,
        type: adjustmentData.type || 'discount',
        adjustmentType: adjustmentData.adjustmentType || 'flat',
        value: adjustmentData.value || 0,
        reason: adjustmentData.reason || '',
        approvedBy: adjustmentData.approvedBy,
        approvedDate: adjustmentData.approvedDate || new Date(),
        isActive:
          adjustmentData.isActive !== undefined
            ? adjustmentData.isActive
            : true,
        isRecurring:
          adjustmentData.isRecurring !== undefined
            ? adjustmentData.isRecurring
            : false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as IFeeAdjustment;

      const adjustment = await FeeAdjustment.create([adjustmentPayload], {
        session,
      });
      await applyAdjustmentToFee(fee._id.toString(), adjustment[0], session);
      adjustments.push(adjustment[0]);
    }

    await session.commitTransaction();
    return adjustments;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const applyAutoAdjustments = async (
  feeId: string,
  studentId: string,
  academicYear: string,
) => {
  const currentMonth =
    new Date().toLocaleString('en', { month: 'long' }) + '-' + academicYear;

  const activeAdjustments = await FeeAdjustment.find({
    student: new Types.ObjectId(studentId),
    academicYear,
    isActive: true,
    $or: [
      { isRecurring: true },
      {
        startMonth: { $lte: currentMonth },
        endMonth: { $gte: currentMonth },
      },
    ],
  });

  for (const adjustment of activeAdjustments) {
    // Create a session-less application for auto adjustments
    const fee = await Fees.findById(feeId);
    if (!fee) continue;

    let adjustmentAmount = 0;

    if (adjustment.adjustmentType === 'percentage') {
      adjustmentAmount = (fee.amount * adjustment.value) / 100;
    } else {
      adjustmentAmount = adjustment.value;
    }

    // Apply adjustment
    if (adjustment.type === 'discount') {
      fee.discount = adjustmentAmount;
    } else if (adjustment.type === 'waiver') {
      fee.waiver = adjustmentAmount;
    }

    // Recalculate due amount
    fee.dueAmount = Math.max(
      0,
      fee.amount - fee.paidAmount - fee.advanceUsed - fee.discount - fee.waiver,
    );

    // Update status
    if (fee.dueAmount === 0) {
      fee.status = 'paid';
    } else if (fee.paidAmount + fee.advanceUsed > 0) {
      fee.status = 'partial';
    } else {
      fee.status = 'unpaid';
    }

    await fee.save();
  }
};

const validateAdjustmentForPayment = async (
  feeId: string,
  paymentAmount: number,
) => {
  const fee = await Fees.findById(feeId);
  if (!fee) {
    throw new AppError(httpStatus.NOT_FOUND, 'Fee record not found');
  }

  const totalAdjustments = fee.discount + fee.waiver;
  const netAmount = fee.amount - totalAdjustments;
  const remainingDue = netAmount - fee.paidAmount - fee.advanceUsed;

  if (paymentAmount > remainingDue) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Payment amount exceeds due amount. Maximum payable: ${remainingDue}`,
    );
  }

  return { fee, netAmount, remainingDue };
};

const updateFeeAdjustment = async (
  id: string,
  payload: Partial<IFeeAdjustment>,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingAdjustment =
      await FeeAdjustment.findById(id).session(session);
    if (!existingAdjustment) {
      throw new AppError(httpStatus.NOT_FOUND, 'FeeAdjustment not found');
    }

    // পুরানো অ্যাডজাস্টমেন্ট রিভার্স করুন
    await reverseAdjustmentFromFee(
      existingAdjustment.fee.toString(),
      existingAdjustment,
      session,
    );

    // নতুন ভ্যালু দিয়ে আপডেট করুন
    Object.assign(existingAdjustment, payload);
    existingAdjustment.updatedAt = new Date();

    const updatedAdjustment = await existingAdjustment.save({ session });

    // নতুন অ্যাডজাস্টমেন্ট প্রয়োগ করুন
    await applyAdjustmentToFee(
      existingAdjustment.fee.toString(),
      updatedAdjustment,
      session,
    );

    await session.commitTransaction();
    return updatedAdjustment;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const reverseAdjustmentFromFee = async (
  feeId: string,
  adjustment: IFeeAdjustment,
  session: mongoose.ClientSession,
) => {
  const fee = await Fees.findById(feeId).session(session);
  if (!fee) return;

  let adjustmentAmount = 0;

  if (adjustment.adjustmentType === 'percentage') {
    adjustmentAmount = (fee.amount * adjustment.value) / 100;
  } else {
    adjustmentAmount = adjustment.value;
  }

  // অ্যাডজাস্টমেন্ট রিভার্স
  if (adjustment.type === 'discount') {
    fee.discount = Math.max(0, fee.discount - adjustmentAmount);
  } else if (adjustment.type === 'waiver') {
    fee.waiver = Math.max(0, fee.waiver - adjustmentAmount);
  }

  // Due amount রিক্যালকুলেট
  fee.dueAmount = Math.max(
    0,
    fee.amount - fee.paidAmount - fee.advanceUsed - fee.discount - fee.waiver,
  );

  // স্ট্যাটাস আপডেট
  if (fee.dueAmount === 0) {
    fee.status = 'paid';
  } else if (fee.paidAmount + fee.advanceUsed > 0) {
    fee.status = 'partial';
  } else {
    fee.status = 'unpaid';
  }

  await fee.save({ session });
};

const deleteFeeAdjustment = async (id: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const adjustment = await FeeAdjustment.findById(id).session(session);
    if (!adjustment) {
      throw new AppError(httpStatus.NOT_FOUND, 'FeeAdjustment not found');
    }

    // ফি থেকে অ্যাডজাস্টমেন্ট রিমুভ করুন
    await reverseAdjustmentFromFee(
      adjustment.fee.toString(),
      adjustment,
      session,
    );

    // অ্যাডজাস্টমেন্ট ডিলিট করুন
    const result = await FeeAdjustment.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getStudentActiveAdjustments = async (
  studentId: string,
  academicYear?: string,
) => {
  const query: any = {
    student: new Types.ObjectId(studentId),
    isActive: true,
  };

  if (academicYear) {
    query.academicYear = academicYear;
  }

  const adjustments = await FeeAdjustment.find(query)
    .populate('student')
    .populate('fee')
    .populate('enrollment')
    .sort({ createdAt: -1 });

  return adjustments;
};

const getFeeReportWithAdjustments = async (
  studentId: string,
  academicYear: string,
) => {
  const fees = await Fees.find({
    student: new Types.ObjectId(studentId),
    academicYear,
  }).populate('student enrollment');

  const adjustments = await FeeAdjustment.find({
    student: new Types.ObjectId(studentId),
    academicYear,
  }).populate('fee');

  const report = {
    student: fees[0]?.student,
    enrollment: fees[0]?.enrollment,
    fees: fees.map((fee) => {
      const feeAdjustments = adjustments.filter(
        (adj) => adj.fee.toString() === fee._id.toString(),
      );

      const totalAdjustments = feeAdjustments.reduce((sum, adj) => {
        let amount = adj.value;
        if (adj.adjustmentType === 'percentage') {
          amount = (fee.amount * adj.value) / 100;
        }
        return sum + amount;
      }, 0);

      return {
        _id: fee._id,
        month: fee.month,
        class: fee.class,
        originalAmount: fee.amount,
        adjustments: totalAdjustments,
        netAmount: fee.amount - totalAdjustments,
        paidAmount: fee.paidAmount,
        advanceUsed: fee.advanceUsed,
        dueAmount: fee.dueAmount,
        status: fee.status,
        adjustmentsDetail: feeAdjustments,
      };
    }),
    summary: {
      totalOriginalAmount: fees.reduce((sum, fee) => sum + fee.amount, 0),
      totalAdjustments: fees.reduce(
        (sum, fee) => sum + fee.discount + fee.waiver,
        0,
      ),
      totalPaid: fees.reduce((sum, fee) => sum + fee.paidAmount, 0),
      totalDue: fees.reduce((sum, fee) => sum + fee.dueAmount, 0),
    },
  };

  return report;
};

// আগের ফাংশনগুলো
const getAllFeeAdjustments = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(
    FeeAdjustment.find()
      .populate('student')
      .populate('fee')
      .populate('enrollment')
      .populate('approvedBy'),
    query,
  )
    .search(['reason'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const data = await queryBuilder.modelQuery;

  return { meta, data };
};

const getSingleFeeAdjustment = async (id: string) => {
  const result = await FeeAdjustment.findById(id)
    .populate('student')
    .populate('fee')
    .populate('enrollment')
    .populate('approvedBy');

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'FeeAdjustment not found');
  }
  return result;
};

export const feeAdjustmentServices = {
  createFeeAdjustment,
  getAllFeeAdjustments,
  getSingleFeeAdjustment,
  updateFeeAdjustment,
  deleteFeeAdjustment,
  applyAdjustmentToStudentFees,
  applyAutoAdjustments,
  validateAdjustmentForPayment,
  getStudentActiveAdjustments,
  getFeeReportWithAdjustments,
};
