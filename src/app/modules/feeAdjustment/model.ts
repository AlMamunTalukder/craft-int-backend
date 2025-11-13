import { model, Schema } from "mongoose";
import { IFeeAdjustment } from "./interface";

const FeeAdjustmentSchema = new Schema<IFeeAdjustment>(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    fee: { type: Schema.Types.ObjectId, ref: "Fee", required: true },
    type: { type: String, enum: ["discount", "waiver"], required: true },
    amount: { type: Number, required: true },
    reason: { type: String },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedDate: { type: Date },
    startMonth: { type: String },
    endMonth: { type: String },
  },
  { timestamps: true }
);

// Index for performance: frequently queried fields
FeeAdjustmentSchema.index({ student: 1, type: 1, startMonth: 1 });

export const FeeAdjustment = model<IFeeAdjustment>("FeeAdjustment", FeeAdjustmentSchema);
