/* eslint-disable @typescript-eslint/no-explicit-any */
import { differenceInDays } from 'date-fns';
import mongoose, { Types } from 'mongoose';
import httpStatus from 'http-status';
import { Fees } from './model';
import { Student } from '../student/student.model';
import { AppError } from '../../error/AppError';
import { IFees } from './interface';

interface LateFeeConfig {
  enabled: boolean;
  dueDayOfMonth: number;
  defaultLateFeePerDay: number;
  maxLateFeePercentage?: number;
  gracePeriodDays?: number;
}

interface DailyLateFeeResult {
  lateFeeAmount: number;
  daysLate: number;
  calculationDate: Date;
  perDayRate: number;
}

interface ProcessedFeeDetail {
  feeId: Types.ObjectId;
  studentId?: Types.ObjectId;
  studentName?: string;
  feeType?: string;
  month?: string;
  daysLate: number;
  perDayRate: number;
  lateFeeAmount: number;
  previousLateFee: number;
}

class LateFeeService {
  private config: LateFeeConfig = {
    enabled: true,
    dueDayOfMonth: 10,
    defaultLateFeePerDay: 100,
    maxLateFeePercentage: 100,
    gracePeriodDays: 0,
  };

  private isProcessing = false; // prevent cron race

  initialize(config: Partial<LateFeeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): LateFeeConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<LateFeeConfig>): LateFeeConfig {
    this.config = { ...this.config, ...newConfig };
    return this.config;
  }

  async calculateDailyLateFee(
    fee: IFees & { student?: any },
  ): Promise<DailyLateFeeResult> {
    if (!this.config.enabled || fee.status === 'paid' || !fee.dueDate) {
      return {
        lateFeeAmount: 0,
        daysLate: 0,
        calculationDate: new Date(),
        perDayRate: 0,
      };
    }

    const today = new Date();
    let daysLate = differenceInDays(today, new Date(fee.dueDate));

    if (this.config.gracePeriodDays)
      daysLate = Math.max(0, daysLate - this.config.gracePeriodDays);

    if (daysLate <= 0)
      return {
        lateFeeAmount: 0,
        daysLate: 0,
        calculationDate: today,
        perDayRate: 0,
      };

    const perDayRate = fee.lateFeePerDay || this.config.defaultLateFeePerDay;
    let lateFeeAmount = perDayRate * daysLate;

    if (this.config.maxLateFeePercentage) {
      const maxLateFee = (fee.amount * this.config.maxLateFeePercentage) / 100;
      lateFeeAmount = Math.min(lateFeeAmount, maxLateFee);
    }

    return {
      lateFeeAmount: Math.round(lateFeeAmount),
      daysLate,
      calculationDate: today,
      perDayRate,
    };
  }

  async applyDailyLateFees(): Promise<{
    totalProcessed: number;
    totalLateFeeApplied: number;
    details: ProcessedFeeDetail[];
  }> {
    if (this.isProcessing)
      throw new AppError(
        httpStatus.CONFLICT,
        'Late fee processing already running',
      );

    this.isProcessing = true;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const today = new Date();
      const processed: ProcessedFeeDetail[] = [];
      let totalLateFee = 0;

      const dueFees = await Fees.find({
        status: { $in: ['unpaid', 'partial'] },
        dueDate: { $lt: today },
        isLateFeeRecord: { $ne: true },
      })
        .session(session)
        .populate('student');

      for (const fee of dueFees) {
        try {
          const result = await this.calculateDailyLateFee(fee);
          if (result.lateFeeAmount <= 0) continue;

          const previousLateFee = fee.lateFeeCalculated || 0;
          fee.lateFeeCalculated = result.lateFeeAmount;
          fee.lateFeeAmount = result.lateFeeAmount;
          fee.lateFeeApplied = true;
          fee.lateFeeAppliedDate = today;
          fee.lateFeeDays = result.daysLate;
          fee.lastLateFeeCalculation = today;

          const originalDue =
            fee.amount - fee.paidAmount - fee.discount - fee.waiver;
          fee.dueAmount = originalDue; // only main fee

          await fee.save({ session });

          await this.createOrUpdateLateFeeRecord(fee, result, session);

          totalLateFee += result.lateFeeAmount - previousLateFee;

          processed.push({
            feeId: fee._id,
            studentId: (fee.student as any)?._id,
            studentName: (fee.student as any)?.name,
            feeType: fee.feeType,
            month: fee.month,
            daysLate: result.daysLate,
            perDayRate: result.perDayRate,
            lateFeeAmount: result.lateFeeAmount,
            previousLateFee,
          });
        } catch (err) {
          console.error(err);
        }
      }

      await session.commitTransaction();
      session.endSession();

      return {
        totalProcessed: processed.length,
        totalLateFeeApplied: totalLateFee,
        details: processed,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  async createOrUpdateLateFeeRecord(
    originalFee: IFees,
    result: DailyLateFeeResult,
    session: mongoose.ClientSession,
  ) {
    const existing = await Fees.findOne({
      originalFeeId: originalFee._id,
      isLateFeeRecord: true,
      month: originalFee.month,
      academicYear: originalFee.academicYear,
    }).session(session);

    if (existing) {
      existing.amount = result.lateFeeAmount;
      existing.dueAmount = result.lateFeeAmount - (existing.paidAmount || 0);
      existing.daysOverdue = result.daysLate;
      existing.lastLateFeeCalculation = new Date();
      await existing.save({ session });
    } else {
      const lateFeeData: Partial<IFees> = {
        student: originalFee.student,
        enrollment: originalFee.enrollment,
        class: originalFee.class,
        month: originalFee.month,
        amount: result.lateFeeAmount,
        paidAmount: 0,
        dueAmount: result.lateFeeAmount,
        discount: 0,
        waiver: 0,
        feeType: `Late Fee - ${originalFee.feeType}`,
        status: 'unpaid',
        dueDate: new Date(),
        lateFeePerDay: result.perDayRate,
        lateFeeCalculated: result.lateFeeAmount,
        lateFeeAmount: result.lateFeeAmount,
        lateFeeApplied: true,
        lateFeeAppliedDate: new Date(),
        academicYear: originalFee.academicYear,
        isLateFeeRecord: true,
        originalFeeId: originalFee._id,
        daysOverdue: result.daysLate,
      };

      const [createdLateFee] = await Fees.create([lateFeeData], { session });

      await Student.findByIdAndUpdate(
        originalFee.student,
        { $push: { fees: createdLateFee._id } },
        { session },
      );
    }
  }

  async customizeLateFee(
    feeId: string,
    newLateFeeAmount: number,
    reason: string,
    customizedBy: string,
    perDayRate?: number,
    notes?: string,
    externalSession?: mongoose.ClientSession,
  ) {
    const session = externalSession || (await mongoose.startSession());
    if (!externalSession) session.startTransaction();

    try {
      const fee = await Fees.findById(feeId).session(session);
      if (!fee) throw new AppError(httpStatus.NOT_FOUND, 'Fee not found');

      const customization = {
        previousAmount: fee.lateFeeAmount || 0,
        newAmount: newLateFeeAmount,
        reason,
        customizedBy,
        customizedAt: new Date(),
        notes,
      };
      fee.lateFeeCustomizations = fee.lateFeeCustomizations || [];
      fee.lateFeeCustomizations.push(customization);

      fee.lateFeeAmount = newLateFeeAmount;
      fee.lateFeeCustomized = true;
      fee.lateFeeApplied = true;
      fee.lateFeeAppliedDate = new Date();
      if (perDayRate) fee.lateFeePerDay = perDayRate;

      const originalDue =
        fee.amount - fee.paidAmount - fee.discount - fee.waiver;
      fee.dueAmount = originalDue;

      await fee.save({ session });

      const lateFeeRecord = await Fees.findOne({
        originalFeeId: feeId,
        isLateFeeRecord: true,
      }).session(session);
      if (lateFeeRecord) {
        lateFeeRecord.amount = newLateFeeAmount;
        lateFeeRecord.dueAmount =
          newLateFeeAmount - (lateFeeRecord.paidAmount || 0);
        lateFeeRecord.lateFeeCustomized = true;
        lateFeeRecord.lateFeeCustomizations = fee.lateFeeCustomizations;
        await lateFeeRecord.save({ session });
      }

      if (!externalSession) {
        await session.commitTransaction();
        session.endSession();
      }

      return {
        success: true,
        message: `Late fee customized from ৳${customization.previousAmount} to ৳${newLateFeeAmount}`,
        fee,
        customization,
      };
    } catch (error) {
      if (!externalSession) {
        await session.abortTransaction();
        session.endSession();
      }
      throw error;
    }
  }

  async bulkCustomizeStudentLateFees(
    studentId: string,
    newLateFeeAmount: number,
    reason: string,
    customizedBy: string,
    month?: string,
    academicYear?: string,
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const query: any = {
        student: studentId,
        status: { $in: ['unpaid', 'partial'] },
      };
      if (month) query.month = month;
      if (academicYear) query.academicYear = academicYear;

      const fees = await Fees.find(query).session(session);
      if (!fees.length)
        throw new AppError(httpStatus.NOT_FOUND, 'No fees found');

      const results = [];
      for (const fee of fees) {
        const result = await this.customizeLateFee(
          fee._id.toString(),
          newLateFeeAmount,
          reason,
          customizedBy,
          undefined,
          `Bulk customization: ${reason}`,
          session,
        );
        results.push(result);
      }

      await session.commitTransaction();
      session.endSession();
      return {
        success: true,
        message: `Bulk customized ${results.length} fees`,
        results,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async getCustomizationHistory(feeId: string) {
    const fee = await Fees.findById(feeId)
      .populate('student', 'name studentId')
      .select('lateFeeCustomizations feeType month amount');
    if (!fee) throw new AppError(httpStatus.NOT_FOUND, 'Fee not found');
    return {
      fee: {
        id: fee._id,
        type: fee.feeType,
        month: fee.month,
        amount: fee.amount,
      },
      customizations: fee.lateFeeCustomizations || [],
    };
  }

  async getFeeDueSummary(feeId: string) {
    const fee = await Fees.findById(feeId).populate('student');
    if (!fee) throw new AppError(httpStatus.NOT_FOUND, 'Fee not found');
    const today = new Date();
    const dueDate = fee.dueDate ? new Date(fee.dueDate) : null;
    const daysLate = dueDate
      ? Math.max(
          0,
          differenceInDays(today, dueDate) - (this.config.gracePeriodDays || 0),
        )
      : 0;
    return {
      feeId: fee._id,
      student: fee.student,
      feeType: fee.feeType,
      month: fee.month,
      originalAmount: fee.amount,
      paidAmount: fee.paidAmount,
      discount: fee.discount,
      waiver: fee.waiver,
      regularDue: fee.amount - fee.paidAmount - fee.discount - fee.waiver,
      dueDate: fee.dueDate,
      daysLate,
      lateFeePerDay: fee.lateFeePerDay || this.config.defaultLateFeePerDay,
      lateFeeCalculated: fee.lateFeeCalculated,
      lateFeeCustomized: fee.lateFeeCustomized,
      lateFeeAmount: fee.lateFeeAmount,
      totalDue: fee.dueAmount,
      status: fee.status,
    };
  }

  async getStudentLateFees(studentId: string) {
    const fees = await Fees.find({ student: studentId, isLateFeeRecord: true });
    return fees.map((f) => ({
      month: f.month,
      feeType: f.feeType,
      lateFee: f.amount,
    }));
  }
}

export const lateFeeService = new LateFeeService();
