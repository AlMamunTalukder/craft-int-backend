// modules/fees/lateFeeAdjustment.interface.ts
import { Types } from 'mongoose';

export interface ILateFeeAdjustment {
  student: Types.ObjectId;
  fee: Types.ObjectId; // Original fee
  lateFeeRecord?: Types.ObjectId; // Late fee record being adjusted
  previousLateFeeAmount: number;
  newLateFeeAmount: number;
  adjustmentAmount: number;
  reason: string;
  adjustedBy: string;
  adjustmentDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
}

// modules/fees/lateFeeAdjustment.model.ts
import { Schema, model } from 'mongoose';

const lateFeeAdjustmentSchema = new Schema<ILateFeeAdjustment>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    fee: {
      type: Schema.Types.ObjectId,
      ref: 'Fees',
      required: true,
    },
    lateFeeRecord: {
      type: Schema.Types.ObjectId,
      ref: 'Fees',
    },
    previousLateFeeAmount: {
      type: Number,
      required: true,
    },
    newLateFeeAmount: {
      type: Number,
      required: true,
    },
    adjustmentAmount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    adjustedBy: {
      type: String,
      required: true,
    },
    adjustmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    approvedBy: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true },
);

export const LateFeeAdjustment = model<ILateFeeAdjustment>(
  'LateFeeAdjustment',
  lateFeeAdjustmentSchema,
);
