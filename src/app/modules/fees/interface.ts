import { Document, Types } from 'mongoose';

export interface IFees extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  class?: string;
  month?: string;

  paidAmount: number;
  advanceUsed: number;
  dueAmount: number;
  discount: number;
  waiver: number;
  feeType?: string;
  amount: number;
  advanceMealAmount: number;
  dueMealAmount: number;
  futureMonthMealAmount: number;
  status: 'paid' | 'partial' | 'unpaid';
  paymentMethod?: 'cash' | 'bkash' | 'bank' | 'online';
  transactionId?: string;
  receiptNo?: string;
  paymentDate?: Date;
  academicYear: string;
  isCurrentMonth: boolean;
  dueDate: Date;
  mealCount?: number;
  mealRate?: number;
  createdAt?: Date;
  updatedAt?: Date;
}