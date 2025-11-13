// interfaces/IFees.ts
import { Document, Types } from 'mongoose';

export interface IFees extends Document {
  enrollment: Types.ObjectId;
  student: Types.ObjectId;
  feeType: string;
  month?: string;
  amount: number;
  paidAmount: number;
  advance: number;
  dueAmount: number;
  status: 'paid' | 'partial' | 'unpaid';
  paymentMethod?: 'cash' | 'bkash' | 'bank' | 'online';
  transactionId?: string;
  receiptNo?: string;
  paymentDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
