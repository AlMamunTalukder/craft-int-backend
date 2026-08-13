import { Schema, model } from 'mongoose';
import { IAsset } from './interface';

const AssetSchema = new Schema<IAsset>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0, default: 1 },
    unitPrice: { type: Number, required: true, min: 0, default: 0 },
    totalPrice: { type: Number, default: 0 },
    purchaseDate: { type: Date },
    vendor: { type: String },
    location: { type: String },
    condition: { type: String, default: 'new' },
    warrantyTill: { type: Date },
    note: { type: String },
  },
  { timestamps: true }
);

export const Asset = model<IAsset>('Asset', AssetSchema);

AssetSchema.index({ category: 1, condition: 1 });
