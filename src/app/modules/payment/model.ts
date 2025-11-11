import { Schema, model } from 'mongoose';

const paymentSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
    },
    fee: {
      type: Schema.Types.ObjectId,
      ref: 'Fee',
      required: true,
    },
    amountPaid: {
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
    receiptNo: {
      type: String,
      unique: true,
    },
    note: {
      type: String,
    },
    collectedBy: {
      type: String,
    },
  },
  { timestamps: true },
);

export const Payment = model('Payment', paymentSchema);
