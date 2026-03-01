// modules/fees/interface.ts
import { Document, Types } from 'mongoose';

export interface IFees extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  enrollment?: Types.ObjectId;
  class?: string;
  month?: string;
  amount: number;
  paidAmount: number;
  advanceUsed: number;
  dueAmount: number;
  discount: number;
  waiver: number;
  feeType?: string;
  status: 'paid' | 'partial' | 'unpaid';
  paymentMethod?: 'cash' | 'bkash' | 'bank' | 'online';
  transactionId?: string;
  receiptNo?: string;
  paymentDate?: Date;
  academicYear: string;
  isCurrentMonth: boolean;

  // ✅ Late Fee Fields
  dueDate: Date; // When the fee was due (e.g., 10th of month)

  // Auto-calculated late fee
  lateFeePerDay: number; // Default 100tk per day
  lateFeeCalculated: number; // Auto-calculated amount
  lateFeeDays: number; // Number of days late

  // Final late fee (after customization)
  lateFeeAmount: number; // Final amount after customization
  lateFeeApplied: boolean;
  lateFeeAppliedDate?: Date;
  lastLateFeeCalculation?: Date;
  totalLateFeePaid: number;

  // Customization tracking
  lateFeeCustomized: boolean;
  lateFeeCustomizations: Array<{
    previousAmount: number;
    newAmount: number;
    reason: string;
    customizedBy: string;
    customizedAt: Date;
    notes?: string;
  }>;

  // For tracking late fee records
  isLateFeeRecord: boolean;
  originalFeeId?: Types.ObjectId;
  monthsOverdue: number;
  daysOverdue: number;

  // Last payment info
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;

  createdAt?: Date;
  updatedAt?: Date;
}
