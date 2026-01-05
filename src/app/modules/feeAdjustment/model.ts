<<<<<<< HEAD
import { Schema, model } from 'mongoose';
const FeeAdjustmentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    fee: { type: Schema.Types.ObjectId, ref: 'Fees', required: true },
    enrollment: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    type: { type: String, enum: ['discount', 'waiver'], required: true },
    adjustmentType: { type: String, enum: ['percentage', 'flat'], required: true }, // নতুন ফিল্ড
    value: { type: Number, required: true }, // ডিসকাউন্ট বা ওয়েভারের মান
    reason: { type: String, required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedDate: { type: Date, default: Date.now },
    startMonth: { type: String, required: true }, // কোন মাস থেকে শুরু
    endMonth: { type: String }, // কোন মাস পর্যন্ত (ঐচ্ছিক)
    isActive: { type: Boolean, default: true }, // এই অ্যাডজাস্টমেন্ট এখনও সক্রিয় কিনা
    isRecurring: { type: Boolean, default: false }, // এটি কি পুনরাবৃত্তিমূলক অ্যাডজাস্টমেন্ট
    academicYear: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
=======
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
>>>>>>> 4081da9dbbc24b8309c631cdcc91df35d7b8147c
  },
  { timestamps: true },
);

<<<<<<< HEAD
export const FeeAdjustment = model('FeeAdjustment', FeeAdjustmentSchema);
=======
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
>>>>>>> 4081da9dbbc24b8309c631cdcc91df35d7b8147c
