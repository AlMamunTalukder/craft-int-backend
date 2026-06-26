/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { FeeAdjustment } from './model';
import { IFeeAdjustment } from './interface';
import { Fees } from '../fees/model';
import mongoose, { Types } from 'mongoose';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];


const monthToIndex = (monthStr: string): number => {
  const [month, year] = monthStr.split('-');
  const monthIdx = MONTHS.indexOf(month);
  if (monthIdx === -1 || !year) return -1;
  return parseInt(year) * 12 + monthIdx;
};


const isMonthInRange = (
  feeMonth: string,
  startMonth: string,
  endMonth: string,
): boolean => {
  const feeIdx = monthToIndex(feeMonth);
  const startIdx = monthToIndex(startMonth);
  const endIdx = monthToIndex(endMonth);
  if (feeIdx === -1 || startIdx === -1 || endIdx === -1) return false;
  return feeIdx >= startIdx && feeIdx <= endIdx;
};


const applyAdjustmentToFee = async (
  feeId: string,
  adjustmentData: IFeeAdjustment,
  session: mongoose.ClientSession,
) => {
  const fee = await Fees.findById(feeId).session(session);
  if (!fee) throw new AppError(httpStatus.NOT_FOUND, 'Fee record not found');

  let adjustmentAmount = 0;
  if (adjustmentData.adjustmentType === 'percentage') {
    adjustmentAmount = (fee.amount * adjustmentData.value) / 100;
  } else {
    adjustmentAmount = adjustmentData.value;
  }

  if (adjustmentData.type === 'discount') {
    fee.discount = (fee.discount || 0) + adjustmentAmount;
  } else if (adjustmentData.type === 'waiver') {
    fee.waiver = (fee.waiver || 0) + adjustmentAmount;
  }


  const totalAdjustments = (fee.discount || 0) + (fee.waiver || 0);
  if (totalAdjustments > fee.amount) {
    const ratio = fee.amount / totalAdjustments;
    fee.discount = Math.round((fee.discount || 0) * ratio * 100) / 100;
    fee.waiver = Math.round((fee.waiver || 0) * ratio * 100) / 100;
  }

  fee.dueAmount = Math.max(
    0,
    fee.amount - fee.paidAmount - fee.advanceUsed - (fee.discount || 0) - (fee.waiver || 0),
  );

  if (fee.dueAmount === 0) fee.status = 'paid';
  else if (fee.paidAmount + fee.advanceUsed > 0) fee.status = 'partial';
  else fee.status = 'unpaid';

  await fee.save({ session });
  return { fee, adjustmentAmount };
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

  if (adjustment.type === 'discount') {
    fee.discount = Math.max(0, (fee.discount || 0) - adjustmentAmount);
  } else if (adjustment.type === 'waiver') {
    fee.waiver = Math.max(0, (fee.waiver || 0) - adjustmentAmount);
  }

  fee.dueAmount = Math.max(
    0,
    fee.amount - fee.paidAmount - fee.advanceUsed - (fee.discount || 0) - (fee.waiver || 0),
  );

  if (fee.dueAmount === 0) fee.status = 'paid';
  else if (fee.paidAmount + fee.advanceUsed > 0) fee.status = 'partial';
  else fee.status = 'unpaid';

  await fee.save({ session });
  return { fee, adjustmentAmount };
};

const createFeeAdjustment = async (payload: IFeeAdjustment) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!payload.student) throw new AppError(httpStatus.BAD_REQUEST, 'Student ID is required');
    if (!payload.fee) throw new AppError(httpStatus.BAD_REQUEST, 'Fee ID is required');
    if (!payload.value || payload.value <= 0)
      throw new AppError(httpStatus.BAD_REQUEST, 'Valid adjustment value is required');

    const feeExists = await Fees.findById(payload.fee);
    if (!feeExists) throw new AppError(httpStatus.NOT_FOUND, 'Fee not found');

    const adjustmentData: any = {
      ...payload,
      type: payload.type || 'discount',
      adjustmentType: payload.adjustmentType || 'flat',
      reason: payload.reason || '',
      isActive: payload.isActive !== undefined ? payload.isActive : true,
      isRecurring: payload.isRecurring !== undefined ? payload.isRecurring : false,
      academicYear: payload.academicYear || new Date().getFullYear().toString(),
      startMonth: payload.startMonth || feeExists.month,
      endMonth: payload.endMonth || payload.startMonth || feeExists.month,
    };

    const [adjustment] = await FeeAdjustment.create([adjustmentData], { session });

    if (adjustmentData.isRecurring && adjustmentData.startMonth && adjustmentData.endMonth) {
      await applyRecurringAdjustmentToRange(
        payload.student.toString(),
        adjustment,
        adjustmentData.startMonth,
        adjustmentData.endMonth,
        adjustmentData.academicYear,
        session,
      );
    } else {
      await applyAdjustmentToFee(payload.fee.toString(), adjustment, session);
    }

    await session.commitTransaction();

    const populatedAdjustment = await FeeAdjustment.findById(adjustment._id)
      .populate('student').populate('fee').populate('enrollment').populate('approvedBy');

    return populatedAdjustment;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};



const applyRecurringAdjustmentToRange = async (
  studentId: string,
  adjustment: IFeeAdjustment,
  startMonth: string,
  endMonth: string,
  academicYear: string,
  session: mongoose.ClientSession,
) => {

  const feesInYear = await Fees.find({
    student: new Types.ObjectId(studentId),
    academicYear,
  }).session(session);

  const feesInRange = feesInYear.filter((fee) =>
    fee.month ? isMonthInRange(fee.month, startMonth, endMonth) : false,
  );

  let appliedCount = 0;
  for (const fee of feesInRange) {
    const perFeeAdjustment = {
      ...adjustment.toObject(),
      fee: fee._id,
    } as IFeeAdjustment;

    await applyAdjustmentToFee(fee._id.toString(), perFeeAdjustment, session);
    appliedCount++;
  }

  return appliedCount;
};
// ─── Bulk adjustment (all unpaid fees for student) ───────────────────────────

const applyAdjustmentToStudentFees = async (
  studentId: string,
  adjustmentData: Partial<IFeeAdjustment>,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!studentId) throw new AppError(httpStatus.BAD_REQUEST, 'Student ID is required');

    const studentFees = await Fees.find({
      student: new Types.ObjectId(studentId),
      status: { $in: ['unpaid', 'partial'] },
    }).session(session);

    if (studentFees.length === 0)
      throw new AppError(httpStatus.NOT_FOUND, 'No fees found for this student');

    const adjustments = [];

    for (const fee of studentFees) {
      let effectiveValue = adjustmentData.value || 0;

      if (adjustmentData.adjustmentType === 'flat') {
        effectiveValue = Math.min(effectiveValue, fee.dueAmount || 0);
      }
      if (effectiveValue <= 0) continue;

      const adjustmentPayload: IFeeAdjustment = {
        student: new Types.ObjectId(studentId),
        fee: fee._id as Types.ObjectId,
        type: adjustmentData.type || 'discount',
        adjustmentType: adjustmentData.adjustmentType || 'flat',
        value: effectiveValue,
        reason: adjustmentData.reason || 'Bulk adjustment',
        approvedBy: adjustmentData.approvedBy,
        approvedDate: adjustmentData.approvedDate || new Date(),
        startMonth: fee.month,
        endMonth: fee.month,
        academicYear: fee.academicYear,
        isActive: adjustmentData.isActive !== undefined ? adjustmentData.isActive : true,
        isRecurring: false, // bulk is never recurring
      } as IFeeAdjustment;

      const [adjustment] = await FeeAdjustment.create([adjustmentPayload], { session });
      await applyAdjustmentToFee(fee._id.toString(), adjustment, session);
      adjustments.push(adjustment);
    }

    await session.commitTransaction();

    return await FeeAdjustment.find({ _id: { $in: adjustments.map((a) => a._id) } })
      .populate('student').populate('fee').populate('enrollment').populate('approvedBy');
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ─── Auto-apply recurring adjustments when a NEW fee record is created ───────
/**
 * Called from generateMonthlyFees / createSingleFee after each fee is created.
 * Finds all active recurring adjustments whose range covers this fee's month
 * and applies them automatically.
 */
const applyAutoAdjustments = async (
  feeId: string,
  studentId: string,
  academicYear: string,
) => {
  const fee = await Fees.findById(feeId);
  if (!fee || !fee.month) return;

  // Find ALL active recurring adjustments for this student/year
  const activeAdjustments = await FeeAdjustment.find({
    student: new Types.ObjectId(studentId),
    academicYear,
    isActive: true,
    isRecurring: true,
  });

  if (activeAdjustments.length === 0) return;

  // Filter: only those whose [startMonth, endMonth] range covers this fee's month
  const applicable = activeAdjustments.filter((adj) =>
    adj.startMonth && adj.endMonth
      ? isMonthInRange(fee.month!, adj.startMonth, adj.endMonth)
      : false,
  );

  if (applicable.length === 0) return;

  // Reset then re-apply all applicable adjustments cleanly
  fee.discount = 0;
  fee.waiver = 0;

  for (const adjustment of applicable) {
    let amount = 0;
    if (adjustment.adjustmentType === 'percentage') {
      amount = (fee.amount * adjustment.value) / 100;
    } else {
      amount = adjustment.value;
    }

    if (adjustment.type === 'discount') fee.discount = (fee.discount || 0) + amount;
    else if (adjustment.type === 'waiver') fee.waiver = (fee.waiver || 0) + amount;
  }

  // Cap
  const total = (fee.discount || 0) + (fee.waiver || 0);
  if (total > fee.amount) {
    const ratio = fee.amount / total;
    fee.discount = Math.round((fee.discount || 0) * ratio * 100) / 100;
    fee.waiver = Math.round((fee.waiver || 0) * ratio * 100) / 100;
  }

  fee.dueAmount = Math.max(
    0,
    fee.amount - fee.paidAmount - fee.advanceUsed - (fee.discount || 0) - (fee.waiver || 0),
  );

  if (fee.dueAmount === 0) fee.status = 'paid';
  else if (fee.paidAmount + fee.advanceUsed > 0) fee.status = 'partial';
  else fee.status = 'unpaid';

  await fee.save();
};

// ─── Validate before payment ──────────────────────────────────────────────────

const validateAdjustmentForPayment = async (feeId: string, paymentAmount: number) => {
  const fee = await Fees.findById(feeId);
  if (!fee) throw new AppError(httpStatus.NOT_FOUND, 'Fee record not found');

  const totalAdjustments = (fee.discount || 0) + (fee.waiver || 0);
  const netAmount = fee.amount - totalAdjustments;
  const remainingDue = Math.max(0, netAmount - fee.paidAmount - fee.advanceUsed);

  if (paymentAmount > remainingDue) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Payment amount (${paymentAmount}) exceeds due amount (${remainingDue})`,
    );
  }

  return { fee, netAmount, remainingDue };
};

// ─── CRUD ────────────────────────────────────────────────────────────────────

const updateFeeAdjustment = async (id: string, payload: Partial<IFeeAdjustment>) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const existing = await FeeAdjustment.findById(id).session(session);
    if (!existing) throw new AppError(httpStatus.NOT_FOUND, 'FeeAdjustment not found');

    await reverseAdjustmentFromFee(existing.fee.toString(), existing, session);
    Object.assign(existing, payload);
    existing.updatedAt = new Date();
    const updated = await existing.save({ session });
    await applyAdjustmentToFee(existing.fee.toString(), updated, session);

    await session.commitTransaction();
    return await FeeAdjustment.findById(id)
      .populate('student').populate('fee').populate('enrollment').populate('approvedBy');
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const deleteFeeAdjustment = async (id: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const adjustment = await FeeAdjustment.findById(id).session(session);
    if (!adjustment) throw new AppError(httpStatus.NOT_FOUND, 'FeeAdjustment not found');

    await reverseAdjustmentFromFee(adjustment.fee.toString(), adjustment, session);
    await FeeAdjustment.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    return adjustment;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getStudentActiveAdjustments = async (studentId: string, academicYear?: string) => {
  const query: any = { student: new Types.ObjectId(studentId), isActive: true };
  if (academicYear) query.academicYear = academicYear;
  return FeeAdjustment.find(query)
    .populate('student').populate('fee').populate('enrollment').sort({ createdAt: -1 });
};

const getFeeReportWithAdjustments = async (studentId: string, academicYear: string) => {
  const fees = await Fees.find({ student: new Types.ObjectId(studentId), academicYear })
    .populate('student').populate('enrollment').sort({ month: 1 });

  const adjustments = await FeeAdjustment.find({ student: new Types.ObjectId(studentId), academicYear })
    .populate('fee').sort({ createdAt: -1 });

  const report = {
    student: fees[0]?.student || null,
    fees: fees.map((fee) => {
      const feeAdjustments = adjustments.filter(
        (adj) => adj.fee && adj.fee._id.toString() === fee._id.toString(),
      );
      const totalAdjustments = feeAdjustments.reduce((sum, adj) => {
        let amount = adj.value;
        if (adj.adjustmentType === 'percentage') amount = (fee.amount * adj.value) / 100;
        return sum + amount;
      }, 0);
      return {
        _id: fee._id, month: fee.month, class: fee.class,
        originalAmount: fee.amount, adjustments: totalAdjustments,
        netAmount: fee.amount - totalAdjustments, paidAmount: fee.paidAmount,
        advanceUsed: fee.advanceUsed, dueAmount: fee.dueAmount,
        status: fee.status, adjustmentsDetail: feeAdjustments,
      };
    }),
    summary: {
      totalFees: fees.length,
      totalOriginalAmount: fees.reduce((s, f) => s + f.amount, 0),
      totalAdjustments: fees.reduce((s, f) => s + (f.discount || 0) + (f.waiver || 0), 0),
      totalPaid: fees.reduce((s, f) => s + (f.paidAmount || 0), 0),
      totalAdvanceUsed: fees.reduce((s, f) => s + (f.advanceUsed || 0), 0),
      totalDue: fees.reduce((s, f) => s + (f.dueAmount || 0), 0),
    },
  };
  return report;
};

const getAllFeeAdjustments = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(
    FeeAdjustment.find()
      .populate('student').populate('fee').populate('enrollment').populate('approvedBy'),
    query,
  ).search(['reason', 'type']).filter().sort().paginate().fields();

  const meta = await queryBuilder.countTotal();
  const data = await queryBuilder.modelQuery;
  return { meta, data };
};

const getSingleFeeAdjustment = async (id: string) => {
  const result = await FeeAdjustment.findById(id)
    .populate('student').populate('fee').populate('enrollment').populate('approvedBy');
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'FeeAdjustment not found');
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
  applyAdjustmentToFee,
  reverseAdjustmentFromFee,
  applyRecurringAdjustmentToRange,
};