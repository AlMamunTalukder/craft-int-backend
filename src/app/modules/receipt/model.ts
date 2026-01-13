import { Schema, model } from 'mongoose';
import { IReceipt } from './interface';

const receiptSchema = new Schema<IReceipt>(
  {
    receiptNo: {
      type: String,
      required: true,
      unique: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentId: {
      type: String,
      required: true,
    },
    className: {
      type: String,
      default: 'N/A',
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bkash', 'nagad', 'bank', 'card'],
      default: 'cash',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    collectedBy: {
      type: String,
      required: true,
    },
    transactionId: {
      type: String,
    },
    note: {
      type: String,
    },
    fees: [
      {
        feeType: String,
        month: String,
        originalAmount: Number,
        discount: Number,
        waiver: Number,
        netAmount: Number,
        paidAmount: Number,
      },
    ],
    summary: {
      totalItems: Number,
      subtotal: Number,
      totalDiscount: Number,
      totalWaiver: Number,
      totalNetAmount: Number,
      amountPaid: Number,
    },
    institute: {
      name: { type: String, default: 'Craft International Institute' },
      address: {
        type: String,
        default: '123 Education Street, Dhaka, Bangladesh',
      },
      phone: { type: String, default: '+880 1300-726000' },
      mobile: { type: String, default: '+880 1830-678383' },
      email: { type: String, default: 'info@craftinstitute.edu.bd' },
      website: { type: String, default: 'www.craftinstitute.edu.bd' },
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'refunded'],
      default: 'active',
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

// Indexes for better performance
receiptSchema.index({ receiptNo: 1 }, { unique: true });
receiptSchema.index({ student: 1 });
receiptSchema.index({ studentId: 1 });
receiptSchema.index({ paymentDate: -1 });

export const Receipt = model('Receipt', receiptSchema);
