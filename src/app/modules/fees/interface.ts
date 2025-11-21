import { Document, Types } from 'mongoose';

export interface IFees extends Document {

  student: Types.ObjectId;
  enrollment: Types.ObjectId;

  class: string;

  month: string; // e.g. "March"
  year: number;  // <-- schema তে আছে, আপনার interface এ missing ছিল

  amount: number;        // total amount for the month
  paidAmount: number;    // default: 0
  advanceUsed: number;   // default: 0
  dueAmount: number;     // required

  discount: number;      // default: 0
  waiver: number;        // default: 0
  feeType: string

  status: 'paid' | 'partial' | 'unpaid';

  paymentMethod?: 'cash' | 'bkash' | 'bank' | 'online';
  transactionId?: string;
  receiptNo?: string;
  paymentDate?: Date;

  yearlyTotal?: number;  // <-- schema তে আছে but interface এ missing ছিল

  createdAt?: Date;
  updatedAt?: Date;
  academicYear: string;
  isCurrentMonth: boolean;
}
