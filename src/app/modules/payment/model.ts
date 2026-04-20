import { Schema, model } from 'mongoose';
import { IPayment } from './interface';

const paymentSchema = new Schema<IPayment>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    fees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Fees',
        required: true,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },

    // Payment breakdown
    regularAmount: {
      type: Number,
      default: 0,
    },
    lateFeeAmount: {
      type: Number,
      default: 0,
    },
    advanceUsed: {
      type: Number,
      default: 0,
    },

    // ✅ Late fee tracking
    lateFeeCollected: {
      type: Number,
      default: 0,
    },
    lateFeeDetails: [
      {
        feeId: {
          type: Schema.Types.ObjectId,
          ref: 'Fees',
          required: true,
        },
        lateFeeRecordId: {
          type: Schema.Types.ObjectId,
          ref: 'Fees',
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],

    paymentMethod: {
      type: String,
      enum: ['cash', 'bkash', 'nagad', 'bank', 'card', 'online'],
      default: 'cash',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    receiptNo: {
      type: String,
      unique: true,
      required: true,
    },
    transactionId: {
      type: String,
    },
    note: {
      type: String,
    },
    collectedBy: {
      type: String,
      required: true,
    },
    receiptType: {
      type: String,
      enum: ['single', 'bulk'],
      default: 'single',
    },
    receiptData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed', 'refunded'],
      default: 'completed',
    },
  },
  { timestamps: true },
);

// Indexes for better performance
paymentSchema.index({ receiptNo: 1 }, { unique: true });
paymentSchema.index({ student: 1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ 'lateFeeDetails.feeId': 1 });
paymentSchema.index({ 'lateFeeDetails.lateFeeRecordId': 1 });

export const Payment = model<IPayment>('Payment', paymentSchema);
