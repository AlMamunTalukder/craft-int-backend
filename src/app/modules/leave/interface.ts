import { ObjectId } from 'mongoose';

export type TLeaveType =
  | 'casual'
  | 'sick'
  | 'annual'
  | 'maternity'
  | 'paternity'
  | 'unpaid'
  | 'other';

export type TLeaveStatus = 'pending' | 'approved' | 'rejected';

export interface ILeave {
  employeeType: 'teacher' | 'staff';
  employee: ObjectId;
  leaveType: TLeaveType;
  startDate: Date;
  endDate: Date;
  days: number;
  reason?: string;
  status: TLeaveStatus;
  approvedBy?: ObjectId;
  approvedAt?: Date;
}
