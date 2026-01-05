<<<<<<< HEAD
export interface IFeeAdjustment {
  _id:string;
  student: string;
  fee: string;
  enrollment: string;
  type: "discount" | "waiver";
  adjustmentType: "percentage" | "flat";
  value: number;
  reason: string;
  approvedBy?: string;
  approvedDate?: Date;
  startMonth: string;
  endMonth?: string;
  isActive: boolean;
  isRecurring: boolean;
  academicYear: string;
  createdAt?: Date;
  updatedAt?: Date;
}
=======
import { Types, Document } from 'mongoose';

export interface IFeeAdjustment extends Document {
  student: Types.ObjectId;
  fee: Types.ObjectId;
  enrollment: Types.ObjectId;

  type: 'discount' | 'waiver';
  adjustmentType: 'percentage' | 'flat';
  value: number;

  reason: string;

  approvedBy?: Types.ObjectId | null;
  approvedDate?: Date | null;

  startMonth: string;
  endMonth?: string | null;

  isActive: boolean;
  isRecurring: boolean;
  academicYear: string;

  createdAt: Date;
  updatedAt: Date;
}
>>>>>>> 4081da9dbbc24b8309c631cdcc91df35d7b8147c
