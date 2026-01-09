// In your payment model
import { Schema, model } from 'mongoose';

const paymentSchema = new Schema(
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
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed',
    },
  },
  { timestamps: true },
);

// Add indexes for better query performance
paymentSchema.index({ receiptNo: 1 }, { unique: true });
paymentSchema.index({ student: 1 });
paymentSchema.index({ paymentDate: -1 });

export const Payment = model('Payment', paymentSchema);
