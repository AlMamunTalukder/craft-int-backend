import { Schema, model } from 'mongoose';
import { IFees } from './interface';

const feeSchema = new Schema<IFees>(
  {
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    feeType: {
      type: String,
      required: true,
    },
    month: { type: String },
    amount: { type: Number, required: true },
    advance: { type: Number },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['paid', 'partial', 'unpaid'],
      default: 'unpaid',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bkash', 'bank', 'online'],
      default: 'cash',
    },
    transactionId: { type: String },
    receiptNo: { type: String, index: true },
    paymentDate: { type: Date },
  },
  { timestamps: true },
);

feeSchema.pre('save', function (next) {
  if (this.amount != null) {
    const paid = this.paidAmount ?? 0;
    this.dueAmount = Math.max(0, this.amount - paid);
    if (paid === 0) this.status = 'unpaid';
    else if (paid >= this.amount) this.status = 'paid';
    else this.status = 'partial';
  }
  next();
});

export const Fees = model<IFees>('Fees', feeSchema);
