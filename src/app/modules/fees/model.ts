import { Schema, model } from 'mongoose';
import { IFees } from './interface';

const FeesSchema = new Schema<IFees>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    enrollment: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    class: { type: String, required: true },
    month: { type: String, required: true },
    amount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    advanceUsed: { type: Number, default: 0 },
    dueAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    waiver: { type: Number, default: 0 },
    feeType: { type: String },
    status: { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'unpaid' },
    paymentMethod: { type: String, enum: ['cash', 'bkash', 'bank', 'online'] },
    transactionId: { type: String },
    receiptNo: { type: String },
    paymentDate: { type: Date },
    academicYear: { type: String, required: true },
    isCurrentMonth: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for faster query
FeesSchema.index({ student: 1, month: 1, academicYear: 1 });

export const Fees = model<IFees>('Fees', FeesSchema);