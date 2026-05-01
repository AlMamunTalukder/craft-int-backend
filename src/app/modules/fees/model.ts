import { Schema, model } from 'mongoose';
import { IFees } from './interface';

const FeesSchema = new Schema<IFees>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
    },
    class: { type: String, required: true },
    month: { type: String },
    amount: { type: Number, required: true },
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
    academicYear: { type: String, required: true },
    isCurrentMonth: { type: Boolean, default: false },

    dueDate: { type: Date },
    mealCount: { type: Number, default: 0 },
    mealRate: { type: Number, default: 55 },
  },
  { timestamps: true },
);

// Indexes
FeesSchema.index({ student: 1, month: 1, academicYear: 1 });
// FeesSchema.index({ dueDate: 1 });
FeesSchema.index({ status: 1 });
// FeesSchema.index({ isLateFeeRecord: 1 });
// FeesSchema.index({ originalFeeId: 1 });

export const Fees = model<IFees>('Fees', FeesSchema);
