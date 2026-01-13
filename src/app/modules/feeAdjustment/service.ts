/* eslint-disable @typescript-eslint/no-explicit-any */
// feeAdjustment/service.ts
import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { FeeAdjustment } from './model';
import { IFeeAdjustment } from './interface';
import { Fees } from '../fees/model';
import mongoose, { Types } from 'mongoose';

// Helper function to apply adjustment to a fee
const applyAdjustmentToFee = async (
  feeId: string,
  adjustmentData: IFeeAdjustment,
  session: mongoose.ClientSession,
) => {
  const fee = await Fees.findById(feeId).session(session);
  if (!fee) {
    throw new AppError(httpStatus.NOT_FOUND, 'Fee record not found');
  }

  let adjustmentAmount = 0;

  // Calculate adjustment amount based on type
  if (adjustmentData.adjustmentType === 'percentage') {
    adjustmentAmount = (fee.amount * adjustmentData.value) / 100;
  } else {
    adjustmentAmount = adjustmentData.value;
  }

  // Apply adjustment based on type
  if (adjustmentData.type === 'discount') {
    fee.discount = (fee.discount || 0) + adjustmentAmount;
  } else if (adjustmentData.type === 'waiver') {
    fee.waiver = (fee.waiver || 0) + adjustmentAmount;
  }

  // Ensure adjustments don't exceed fee amount
  const totalAdjustments = (fee.discount || 0) + (fee.waiver || 0);
  if (totalAdjustments > fee.amount) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Total adjustments cannot exceed fee amount',
    );
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

  await fee.save({ session });
  return { fee, adjustmentAmount };
};

// Reverse adjustment from fee
const reverseAdjustmentFromFee = async (
  feeId: string,
  adjustment: IFeeAdjustment,
  session: mongoose.ClientSession,
) => {
  const fee = await Fees.findById(feeId).session(session);
  if (!fee) return;

  let adjustmentAmount = 0;

  // Calculate adjustment amount
  if (adjustment.adjustmentType === 'percentage') {
    adjustmentAmount = (fee.amount * adjustment.value) / 100;
  } else {
    adjustmentAmount = adjustment.value;
  }

  // Reverse adjustment
  if (adjustment.type === 'discount') {
    fee.discount = Math.max(0, (fee.discount || 0) - adjustmentAmount);
  } else if (adjustment.type === 'waiver') {
    fee.waiver = Math.max(0, (fee.waiver || 0) - adjustmentAmount);
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

  await fee.save({ session });
  return { fee, adjustmentAmount };
};

// Create fee adjustment
const createFeeAdjustment = async (payload: IFeeAdjustment) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate required fields
    if (!payload.student) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Student ID is required');
    }
    if (!payload.fee) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Fee ID is required');
    }
    if (!payload.value || payload.value <= 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Valid adjustment value is required',
      );
    }

    // Check if fee exists
    const feeExists = await Fees.findById(payload.fee);
    if (!feeExists) {
      throw new AppError(httpStatus.NOT_FOUND, 'Fee not found');
    }

    // Set default values
    const adjustmentData: any = {
      ...payload,
      type: payload.type || 'discount',
      adjustmentType: payload.adjustmentType || 'flat',
      reason: payload.reason || '',
      isActive: payload.isActive !== undefined ? payload.isActive : true,
      isRecurring:
        payload.isRecurring !== undefined ? payload.isRecurring : false,
      academicYear: payload.academicYear || new Date().getFullYear().toString(),
      startMonth: payload.startMonth || feeExists.month,
      endMonth: payload.endMonth || payload.startMonth || feeExists.month,
    };

    // Create adjustment record
    const [adjustment] = await FeeAdjustment.create([adjustmentData], {
      session,
    });

    // Apply adjustment to fee
    await applyAdjustmentToFee(payload.fee.toString(), adjustment, session);

    await session.commitTransaction();

    // Populate and return
    const populatedAdjustment = await FeeAdjustment.findById(adjustment._id)
      .populate('student')
      .populate('fee')
      .populate('enrollment')
      .populate('approvedBy');

    return populatedAdjustment;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Apply adjustments to all student fees
const applyAdjustmentToStudentFees = async (
  studentId: string,
  adjustmentData: Partial<IFeeAdjustment>,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!studentId) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Student ID is required');
    }

    // Get all unpaid/partial fees for the student
    const studentFees = await Fees.find({
      student: new Types.ObjectId(studentId),
      status: { $in: ['unpaid', 'partial'] },
    }).session(session);

    if (studentFees.length === 0) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'No fees found for this student',
      );
    }

    const adjustments = [];

    for (const fee of studentFees) {
      const adjustmentPayload: IFeeAdjustment = {
        student: new Types.ObjectId(studentId),
        fee: fee._id as Types.ObjectId,
        enrollment: fee.enrollment as Types.ObjectId,
        type: adjustmentData.type || 'discount',
        adjustmentType: adjustmentData.adjustmentType || 'flat',
        value: adjustmentData.value || 0,
        reason: adjustmentData.reason || 'Bulk adjustment',
        approvedBy: adjustmentData.approvedBy,
        approvedDate: adjustmentData.approvedDate || new Date(),
        startMonth: fee.month,
        endMonth: fee.month,
        academicYear: fee.academicYear,
        isActive:
          adjustmentData.isActive !== undefined
            ? adjustmentData.isActive
            : true,
        isRecurring:
          adjustmentData.isRecurring !== undefined
            ? adjustmentData.isRecurring
            : false,
      } as IFeeAdjustment;

      const [adjustment] = await FeeAdjustment.create([adjustmentPayload], {
        session,
      });

      await applyAdjustmentToFee(fee._id.toString(), adjustment, session);
      adjustments.push(adjustment);
    }

    await session.commitTransaction();

    // Populate all adjustments
    const populatedAdjustments = await FeeAdjustment.find({
      _id: { $in: adjustments.map((adj) => adj._id) },
    })
      .populate('student')
      .populate('fee')
      .populate('enrollment')
      .populate('approvedBy');

    return populatedAdjustments;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Apply auto adjustments
const applyAutoAdjustments = async (
  feeId: string,
  studentId: string,
  academicYear: string,
) => {
  const currentMonth = `${new Date().toLocaleString('en', { month: 'long' })}-${academicYear}`;

  // Find active adjustments for the student
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

  if (activeAdjustments.length === 0) return;

  const fee = await Fees.findById(feeId);
  if (!fee) return;

  // Reset existing adjustments from auto adjustments
  fee.discount = 0;
  fee.waiver = 0;

  // Apply all active adjustments
  for (const adjustment of activeAdjustments) {
    let adjustmentAmount = 0;

    if (adjustment.adjustmentType === 'percentage') {
      adjustmentAmount = (fee.amount * adjustment.value) / 100;
    } else {
      adjustmentAmount = adjustment.value;
    }

    // Apply adjustment
    if (adjustment.type === 'discount') {
      fee.discount = (fee.discount || 0) + adjustmentAmount;
    } else if (adjustment.type === 'waiver') {
      fee.waiver = (fee.waiver || 0) + adjustmentAmount;
    }
  }

  // Ensure adjustments don't exceed amount
  const totalAdjustments = (fee.discount || 0) + (fee.waiver || 0);
  if (totalAdjustments > fee.amount) {
    fee.discount = fee.amount * (fee.discount / totalAdjustments);
    fee.waiver = fee.amount * (fee.waiver / totalAdjustments);
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
};

// Validate adjustment for payment
const validateAdjustmentForPayment = async (
  feeId: string,
  paymentAmount: number,
) => {
  const fee = await Fees.findById(feeId);
  if (!fee) {
    throw new AppError(httpStatus.NOT_FOUND, 'Fee record not found');
  }

  const totalAdjustments = (fee.discount || 0) + (fee.waiver || 0);
  const netAmount = fee.amount - totalAdjustments;
  const remainingDue = Math.max(
    0,
    netAmount - fee.paidAmount - fee.advanceUsed,
  );

  if (paymentAmount > remainingDue) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Payment amount (${paymentAmount}) exceeds due amount (${remainingDue})`,
    );
  }

  return { fee, netAmount, remainingDue };
};

// Update fee adjustment
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

    // Reverse old adjustment
    await reverseAdjustmentFromFee(
      existingAdjustment.fee.toString(),
      existingAdjustment,
      session,
    );

    // Update adjustment
    Object.assign(existingAdjustment, payload);
    existingAdjustment.updatedAt = new Date();

    const updatedAdjustment = await existingAdjustment.save({ session });

    // Apply new adjustment
    await applyAdjustmentToFee(
      existingAdjustment.fee.toString(),
      updatedAdjustment,
      session,
    );

    await session.commitTransaction();

    // Populate and return
    const populatedAdjustment = await FeeAdjustment.findById(id)
      .populate('student')
      .populate('fee')
      .populate('enrollment')
      .populate('approvedBy');

    return populatedAdjustment;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Delete fee adjustment
const deleteFeeAdjustment = async (id: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const adjustment = await FeeAdjustment.findById(id).session(session);
    if (!adjustment) {
      throw new AppError(httpStatus.NOT_FOUND, 'FeeAdjustment not found');
    }

    // Remove adjustment from fee
    await reverseAdjustmentFromFee(
      adjustment.fee.toString(),
      adjustment,
      session,
    );

    // Delete adjustment
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

// Get student active adjustments
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

// Get fee report with adjustments
const getFeeReportWithAdjustments = async (
  studentId: string,
  academicYear: string,
) => {
  const fees = await Fees.find({
    student: new Types.ObjectId(studentId),
    academicYear,
  })
    .populate('student')
    .populate('enrollment')
    .sort({ month: 1 });

  const adjustments = await FeeAdjustment.find({
    student: new Types.ObjectId(studentId),
    academicYear,
  })
    .populate('fee')
    .sort({ createdAt: -1 });

  const report = {
    student: fees[0]?.student || null,
    enrollment: fees[0]?.enrollment || null,
    fees: fees.map((fee) => {
      const feeAdjustments = adjustments.filter(
        (adj) => adj.fee && adj.fee._id.toString() === fee._id.toString(),
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
      totalFees: fees.length,
      totalOriginalAmount: fees.reduce((sum, fee) => sum + fee.amount, 0),
      totalAdjustments: fees.reduce(
        (sum, fee) => sum + (fee.discount || 0) + (fee.waiver || 0),
        0,
      ),
      totalPaid: fees.reduce((sum, fee) => sum + (fee.paidAmount || 0), 0),
      totalAdvanceUsed: fees.reduce(
        (sum, fee) => sum + (fee.advanceUsed || 0),
        0,
      ),
      totalDue: fees.reduce((sum, fee) => sum + (fee.dueAmount || 0), 0),
    },
  };

  return report;
};

// Get all fee adjustments
const getAllFeeAdjustments = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(
    FeeAdjustment.find()
      .populate('student')
      .populate('fee')
      .populate('enrollment')
      .populate('approvedBy'),
    query,
  )
    .search(['reason', 'type'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const data = await queryBuilder.modelQuery;

  return { meta, data };
};

// Get single fee adjustment
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
  applyAdjustmentToFee,
  reverseAdjustmentFromFee,
};
