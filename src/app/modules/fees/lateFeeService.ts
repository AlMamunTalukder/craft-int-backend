/* eslint-disable @typescript-eslint/no-explicit-any */
import { startOfMonth, differenceInDays } from 'date-fns';
import mongoose, { Types } from 'mongoose';
import httpStatus from 'http-status';
import { Fees } from './model';
import { Student } from '../student/student.model';
import { AppError } from '../../error/AppError';
import { IFees } from './interface';

interface LateFeeConfig {
  enabled: boolean;
  dueDayOfMonth: number; // Day when fee is due (e.g., 10)
  defaultLateFeePerDay: number; // Default daily late fee (e.g., 100)
  maxLateFeePercentage?: number; // Maximum late fee as percentage of original fee
  gracePeriodDays?: number; // Additional grace days after due date
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
    dueDayOfMonth: 10, // Due on 10th of each month
    defaultLateFeePerDay: 100, // 100tk per day
    maxLateFeePercentage: 100, // Maximum 100% of original fee
    gracePeriodDays: 0, // No grace period after due date
  };

  // Initialize with custom config
  initialize(config: Partial<LateFeeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Get current config
  getConfig(): LateFeeConfig {
    return { ...this.config };
  }

  // Update config
  updateConfig(newConfig: Partial<LateFeeConfig>): LateFeeConfig {
    this.config = { ...this.config, ...newConfig };
    return this.config;
  }

  // Calculate daily late fee for a fee
  async calculateDailyLateFee(
    fee: IFees & { student?: any },
  ): Promise<DailyLateFeeResult> {
    if (!this.config.enabled) {
      return {
        lateFeeAmount: 0,
        daysLate: 0,
        calculationDate: new Date(),
        perDayRate: 0,
      };
    }

    if (fee.status === 'paid') {
      return {
        lateFeeAmount: 0,
        daysLate: 0,
        calculationDate: new Date(),
        perDayRate: 0,
      };
    }

    if (!fee.dueDate) {
      return {
        lateFeeAmount: 0,
        daysLate: 0,
        calculationDate: new Date(),
        perDayRate: 0,
      };
    }

    const today = new Date();
    const dueDate = new Date(fee.dueDate);

    // Calculate days late (only count after due date)
    let daysLate = differenceInDays(today, dueDate);

    // Apply grace period if any
    if (this.config.gracePeriodDays && this.config.gracePeriodDays > 0) {
      daysLate = Math.max(0, daysLate - this.config.gracePeriodDays);
    }

    if (daysLate <= 0) {
      return {
        lateFeeAmount: 0,
        daysLate: 0,
        calculationDate: today,
        perDayRate: 0,
      };
    }

    // Use fee-specific late fee per day or default
    const perDayRate = fee.lateFeePerDay || this.config.defaultLateFeePerDay;

    // Calculate late fee
    let lateFeeAmount = perDayRate * daysLate;

    // Apply maximum cap if set
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

  // Apply daily late fees to all applicable fees
  async applyDailyLateFees(): Promise<{
    totalProcessed: number;
    totalLateFeeApplied: number;
    details: ProcessedFeeDetail[];
  }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const today = new Date();
      const processed: ProcessedFeeDetail[] = [];
      let totalLateFee = 0;

      // Find all unpaid/partial fees that are due
      const dueFees = await Fees.find({
        status: { $in: ['unpaid', 'partial'] },
        dueDate: { $lt: today }, // Due before today
        isLateFeeRecord: { $ne: true }, // Don't apply on late fee records
        $or: [
          { lateFeeCustomized: false }, // Not customized
          {
            lastLateFeeCalculation: {
              $lt: startOfMonth(today),
            },
          }, // Last calculated before today
        ],
      })
        .session(session)
        .populate('student');

      for (const fee of dueFees) {
        try {
          // Skip if fee was customized and we should respect customization
          if (fee.lateFeeCustomized) {
            // Still update days but keep customized amount
            const dueDate = fee.dueDate ? new Date(fee.dueDate) : new Date();
            const daysLate = differenceInDays(today, dueDate);
            fee.lateFeeDays = Math.max(
              0,
              daysLate - (this.config.gracePeriodDays || 0),
            );
            fee.lastLateFeeCalculation = today;
            await fee.save({ session });
            continue;
          }

          const result = await this.calculateDailyLateFee(fee);

          if (result.lateFeeAmount > 0) {
            // Update fee with new late fee calculation
            const previousLateFee = fee.lateFeeCalculated || 0;
            const newLateFee = result.lateFeeAmount;

            fee.lateFeeCalculated = newLateFee;
            fee.lateFeeAmount = newLateFee; // Set final amount to calculated
            fee.lateFeeDays = result.daysLate;
            fee.lateFeeApplied = true;
            fee.lateFeeAppliedDate = today;
            fee.lastLateFeeCalculation = today;

            // Update due amount to include late fee
            const originalDue =
              fee.amount - fee.paidAmount - fee.discount - fee.waiver;
            fee.dueAmount = originalDue + newLateFee;

            await fee.save({ session });

            // Create or update late fee record
            await this.createOrUpdateLateFeeRecord(fee, result, session);

            totalLateFee += newLateFee - previousLateFee;

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
          }
        } catch (error) {
          console.error(`Error applying late fee to fee ${fee._id}:`, error);
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
    }
  }

  // Create or update late fee record
  async createOrUpdateLateFeeRecord(
    originalFee: IFees,
    result: DailyLateFeeResult,
    session: mongoose.ClientSession,
  ): Promise<void> {
    // Find existing late fee record for this month
    const existingLateFeeRecord = await Fees.findOne({
      originalFeeId: originalFee._id,
      isLateFeeRecord: true,
      month: originalFee.month,
      academicYear: originalFee.academicYear,
    }).session(session);

    if (existingLateFeeRecord) {
      // Update existing record
      existingLateFeeRecord.amount = result.lateFeeAmount;
      existingLateFeeRecord.dueAmount =
        result.lateFeeAmount - (existingLateFeeRecord.paidAmount || 0);
      existingLateFeeRecord.daysOverdue = result.daysLate;
      existingLateFeeRecord.lastLateFeeCalculation = new Date();
      await existingLateFeeRecord.save({ session });
    } else {
      // Create new late fee record
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

      // Update student's fees array
      await Student.findByIdAndUpdate(
        originalFee.student,
        { $push: { fees: createdLateFee._id } },
        { session },
      );
    }
  }

  // Set due dates for fees (10th of each month)
  setDueDatesForFees(fees: any[], academicYear: string): any[] {
    const year = parseInt(academicYear) || new Date().getFullYear();

    return fees.map((fee) => {
      if (fee.month === 'Admission') {
        // Admission fee due at enrollment
        return {
          ...fee,
          dueDate: new Date(),
        };
      } else {
        // Monthly fees due on 10th of each month
        const monthIndex = this.getMonthIndex(fee.month);
        if (monthIndex !== -1) {
          // Set due date to 10th of the month
          const dueDate = new Date(year, monthIndex, this.config.dueDayOfMonth);
          return {
            ...fee,
            dueDate,
          };
        }
      }
      return fee;
    });
  }

  // Customize late fee for a specific fee
  async customizeLateFee(
    feeId: string,
    newLateFeeAmount: number,
    reason: string,
    customizedBy: string,
    perDayRate?: number,
    notes?: string,
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const fee = await Fees.findById(feeId).session(session);
      if (!fee) {
        throw new AppError(httpStatus.NOT_FOUND, 'Fee not found');
      }

      // Store customization history
      const customization = {
        previousAmount: fee.lateFeeAmount || 0,
        newAmount: newLateFeeAmount,
        reason,
        customizedBy,
        customizedAt: new Date(),
        notes,
      };

      if (!fee.lateFeeCustomizations) {
        fee.lateFeeCustomizations = [];
      }
      fee.lateFeeCustomizations.push(customization);

      // Update fee with customized late fee
      fee.lateFeeAmount = newLateFeeAmount;
      fee.lateFeeCustomized = true;
      fee.lateFeeApplied = true;
      fee.lateFeeAppliedDate = new Date();

      // Update per day rate if provided
      if (perDayRate) {
        fee.lateFeePerDay = perDayRate;
      }

      // Recalculate due amount
      const originalDue =
        fee.amount - fee.paidAmount - fee.discount - fee.waiver;
      fee.dueAmount = originalDue + newLateFeeAmount;

      await fee.save({ session });

      // Update associated late fee record
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

      await session.commitTransaction();
      session.endSession();

      return {
        success: true,
        message: `Late fee customized from ৳${customization.previousAmount} to ৳${newLateFeeAmount}`,
        fee,
        customization,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // Bulk customize late fees for a student
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

      if (fees.length === 0) {
        throw new AppError(httpStatus.NOT_FOUND, 'No fees found');
      }

      const results = [];

      for (const fee of fees) {
        const result = await this.customizeLateFee(
          fee._id.toString(),
          newLateFeeAmount,
          reason,
          customizedBy,
          undefined,
          `Bulk customization: ${reason}`,
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

  // Get customization history for a fee
  async getCustomizationHistory(feeId: string) {
    const fee = await Fees.findById(feeId)
      .populate('student', 'name studentId')
      .select('lateFeeCustomizations feeType month amount');

    if (!fee) {
      throw new AppError(httpStatus.NOT_FOUND, 'Fee not found');
    }

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

  // Calculate due summary for a fee
  async getFeeDueSummary(feeId: string) {
    const fee = await Fees.findById(feeId).populate('student');
    if (!fee) {
      throw new AppError(httpStatus.NOT_FOUND, 'Fee not found');
    }

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

  private getMonthIndex(month: string): number {
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
    return months.indexOf(month);
  }
}

export const lateFeeService = new LateFeeService();
