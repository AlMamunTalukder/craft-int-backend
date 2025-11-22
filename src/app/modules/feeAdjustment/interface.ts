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