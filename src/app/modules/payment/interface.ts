/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from 'mongoose';

export type TPaymentMethod =
  | 'cash'
  | 'bkash'
  | 'nagad'
  | 'bank'
  | 'card'
  | 'online';

export type TReceiptType = 'single' | 'bulk';

export interface IPayment {
  student: Types.ObjectId;
  fees: Types.ObjectId[];
  totalAmount: number;
  paymentMethod?: TPaymentMethod;
  paymentDate?: Date;
  receiptNo: string;

  regularAmount?: number;
  // lateFeeAmount?: number;
  advanceUsed?: number;

  // ✅ Late fee tracking
  // lateFeeCollected?: number; 
  // lateFeeDetails?: Array<{
  //   feeId: Types.ObjectId; 
  //   lateFeeRecordId: Types.ObjectId; 
  //   amount: number;
  // }>;

  transactionId?: string;
  note?: string;
  collectedBy: string;
  receiptType?: TReceiptType;
  receiptData?: Record<string, any>;
  status?: string;

  createdAt?: Date;
  updatedAt?: Date;
}
