import { Document, Types } from 'mongoose';

// interface.ts
export interface IFees extends Document {
  student: Types.ObjectId;
  enrollment: Types.ObjectId;
  class: string;
  month: string; // "March-2025"
  amount: number; // monthly fee
  paidAmount: number;
  advanceUsed: number; // advance applied to this month
  dueAmount: number;
  discount?: number; // monthly discount
  waiver?: number; // monthly waiver
  status: 'paid' | 'partial' | 'unpaid';
  paymentMethod?: 'cash' | 'bkash' | 'bank' | 'online';
  transactionId?: string;
  receiptNo?: string;
  paymentDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
