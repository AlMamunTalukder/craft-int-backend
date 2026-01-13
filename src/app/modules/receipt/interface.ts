/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from 'mongoose';

/** Fee line item inside receipt */
export interface IReceiptFee {
  feeType: string;
  month?: string;
  originalAmount: number;
  discount?: number;
  waiver?: number;
  netAmount: number;
  paidAmount: number;
}

/** Summary block */
export interface IReceiptSummary {
  totalItems: number;
  subtotal: number;
  totalDiscount: number;
  totalWaiver: number;
  totalNetAmount: number;
  amountPaid: number;
}

/** Institute snapshot */
export interface IReceiptInstitute {
  name: string;
  address: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
}

export interface IReceipt {
  receiptNo: string;
  student: Types.ObjectId;
  studentName: string;
  studentId: string;
  className?: string;

  paymentId: Types.ObjectId;
  totalAmount: number;

  paymentMethod: 'cash' | 'bkash' | 'nagad' | 'bank' | 'card';
  paymentDate?: Date | number | string | any;

  collectedBy: string;
  transactionId?: string;
  note?: string;

  fees: IReceiptFee[];
  summary: IReceiptSummary;

  institute: IReceiptInstitute;

  status: 'active' | 'cancelled' | 'refunded';
  generatedBy?: Types.ObjectId;
}
