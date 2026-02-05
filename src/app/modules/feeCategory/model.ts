import { Schema, model } from 'mongoose';

const feeCategorySchema = new Schema(
  {
    categoryName: {
      type: String,
      enum: [
        '',
        'Residential',
        'Non-Residential',
        'Day Care',
        'Non-Residential One Meal',
        'Day Care One Meal',
      ],
      default: '',
    },

    className: {
      type: String,
      required: true,
      trim: true,
    },

    feeItems: [
      {
        feeType: {
          type: String,
          required: true,
          trim: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
  },
  { timestamps: true },
);

export const FeeCategory = model('FeeCategory', feeCategorySchema);
