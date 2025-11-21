import { Types } from "mongoose";

export interface IFeeAdjustment {
  student: Types.ObjectId;
  fee: Types.ObjectId;
  type: "discount" | "waiver";
  amount: number;
  reason?: string;
  approvedBy?: Types.ObjectId;
  approvedDate?: Date;
  startMonth?: string;
  endMonth?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

