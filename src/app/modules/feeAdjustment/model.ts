import { model, Schema, Types } from 'mongoose';
import { IFeeAdjustment } from './interface';

const FeeAdjustmentSchema = new Schema<IFeeAdjustment>(
  {
    student: { type: Schema.ObjectId, ref: 'Student', required: true },
    fee: { type: Schema.ObjectId, ref: 'Fees', required: true },
    enrollment: { type: Schema.ObjectId, ref: 'Enrollment', required: true },

    type: { type: String, enum: ['discount', 'waiver'], required: true },

    adjustmentType: {
      type: String,
      enum: ['percentage', 'flat'],
      required: true,
    },

    value: { type: Number, required: true },

    reason: { type: String, default: '' },

    approvedBy: { type: Types.ObjectId, ref: 'User', default: null },
    approvedDate: { type: Date, default: null },

    startMonth: { type: String, required: true },
    endMonth: { type: String, default: null },

    isActive: { type: Boolean, default: true },
    isRecurring: { type: Boolean, default: false },

    academicYear: { type: String, required: true },
  },
  { timestamps: true },
);

FeeAdjustmentSchema.index({
  student: 1,
  fee: 1,
  type: 1,
  academicYear: 1,
});

export const FeeAdjustment = model<IFeeAdjustment>(
  'FeeAdjustment',
  FeeAdjustmentSchema,
);
