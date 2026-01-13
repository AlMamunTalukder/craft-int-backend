// fees/interface.ts
import { Document, Types } from 'mongoose';

export interface IFees extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  enrollment: Types.ObjectId;
  class: string;
  month: string;
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
  createdAt?: Date;
  updatedAt?: Date;
}
