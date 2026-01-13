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
