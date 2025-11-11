// interfaces/IFees.ts
import { Document, Types } from 'mongoose';

export interface IFees extends Document {
  enrollment: Types.ObjectId;
  student: Types.ObjectId;
  feeType: 'admission' | 'monthly' | 'exam' | 'homework' | 'other';
  month?: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'paid' | 'partial' | 'unpaid';
  paymentMethod?: 'cash' | 'bkash' | 'bank' | 'online';
  transactionId?: string;
  receiptNo?: string;
  paymentDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
