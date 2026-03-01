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

  // Payment breakdown
  regularAmount?: number; // Amount paid for regular fees
  lateFeeAmount?: number; // Amount paid for late fees
  advanceUsed?: number; // Amount used from advance balance

  // ✅ Late fee tracking
  lateFeeCollected?: number; // Total late fee collected in this payment
  lateFeeDetails?: Array<{
    // Details of which late fees were paid
    feeId: Types.ObjectId; // Original fee ID
    lateFeeRecordId: Types.ObjectId; // Late fee record ID
    amount: number; // Amount paid for this late fee
  }>;

  transactionId?: string;
  note?: string;
  collectedBy: string;
  receiptType?: TReceiptType;
  receiptData?: Record<string, any>;
  status?: string;

  createdAt?: Date;
  updatedAt?: Date;
}
