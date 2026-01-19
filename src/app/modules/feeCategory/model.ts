import { Schema, model } from 'mongoose';
import { IFeeCategory } from './interface';

const feeCategorySchema = new Schema<IFeeCategory>(
  {
    class: {
      type: String,
    },
    feeType: {
      type: String,
    },
    feeAmount: {
      type: Number,
    },
    category: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export const FeeCategory = model<IFeeCategory>(
  'FeeCategory',
  feeCategorySchema,
);
