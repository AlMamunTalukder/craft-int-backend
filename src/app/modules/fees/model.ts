// modules/fees/model.ts
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

    // ✅ Late Fee Fields (Single dueDate field)
    dueDate: { type: Date }, // When the fee was due (e.g., 10th of month)

    // Auto-calculated late fee
    lateFeePerDay: { type: Number, default: 100 }, // Default 100tk per day
    lateFeeCalculated: { type: Number, default: 0 }, // Auto-calculated amount
    lateFeeDays: { type: Number, default: 0 }, // Number of days late

    // Final late fee (after customization)
    lateFeeAmount: { type: Number, default: 0 }, // Final amount after customization
    lateFeeApplied: { type: Boolean, default: false },
    lateFeeAppliedDate: { type: Date },
    lastLateFeeCalculation: { type: Date },
    totalLateFeePaid: { type: Number, default: 0 },

    // Customization tracking
    lateFeeCustomized: { type: Boolean, default: false },
    lateFeeCustomizations: [
      {
        previousAmount: { type: Number, required: true },
        newAmount: { type: Number, required: true },
        reason: { type: String, required: true },
        customizedBy: { type: String, required: true },
        customizedAt: { type: Date, default: Date.now },
        notes: { type: String },
      },
    ],

    // For tracking late fee records
    isLateFeeRecord: { type: Boolean, default: false },
    originalFeeId: { type: Schema.Types.ObjectId, ref: 'Fees' },
    monthsOverdue: { type: Number, default: 0 },
    daysOverdue: { type: Number, default: 0 },

    // Last payment info
    lastPaymentDate: { type: Date },
    lastPaymentAmount: { type: Number },
  },
  { timestamps: true },
);

// Indexes
FeesSchema.index({ student: 1, month: 1, academicYear: 1 });
FeesSchema.index({ dueDate: 1 });
FeesSchema.index({ status: 1 });
FeesSchema.index({ isLateFeeRecord: 1 });
FeesSchema.index({ originalFeeId: 1 });

export const Fees = model<IFees>('Fees', FeesSchema);
