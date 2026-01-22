import { Schema, model } from 'mongoose';
import { IFees } from './interface';

const FeesSchema = new Schema<IFees>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
    },

    class: { type: String },
    month: { type: String },
    amount: { type: Number },
    paidAmount: { type: Number, default: 0 },
    advanceUsed: { type: Number, default: 0 },
    dueAmount: { type: Number },
    discount: { type: Number, default: 0 },
    waiver: { type: Number, default: 0 },
    feeType: { type: String },
    status: {
      type: String,
      enum: ['paid', 'partial', 'unpaid'],
      default: 'unpaid',
    },
    paymentMethod: { type: String, enum: ['cash', 'bkash', 'bank', 'online'] },
    transactionId: { type: String },
    receiptNo: { type: String },
    paymentDate: { type: Date },
    academicYear: { type: String },
    isCurrentMonth: { type: Boolean, default: false },
  },
  { timestamps: true },
);

FeesSchema.index({ student: 1, month: 1, academicYear: 1 });

export const Fees = model<IFees>('Fees', FeesSchema);
