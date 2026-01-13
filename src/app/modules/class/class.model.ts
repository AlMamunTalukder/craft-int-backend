import { Schema } from 'mongoose';
import { TClass } from './class.interface';
import { model } from 'mongoose';

const feeStructureSchema = new Schema(
  {
    feeType: { type: String, required: true },
    amount: { type: Number, required: true },
    isMonthly: { type: Boolean, default: false },
  },
  { _id: false },
);

const classSchema = new Schema<TClass>(
  {
    className: { type: String, required: true },

    sections: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Section',
      },
    ],

    feeStructure: {
      type: [feeStructureSchema],
      default: [],
    },
  },
  { timestamps: true },
);
export const Class = model<TClass>('Class', classSchema);
