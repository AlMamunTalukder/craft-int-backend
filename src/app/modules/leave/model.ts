import { Schema, model } from 'mongoose';
import { ILeave } from './interface';

const LeaveSchema = new Schema<ILeave>(
  {
    employeeType: { type: String, enum: ['teacher', 'staff'], required: true },
    employee: { type: Schema.Types.ObjectId, required: true },
    leaveType: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, default: 1 },
    reason: { type: String },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

export const Leave = model<ILeave>('Leave', LeaveSchema);

LeaveSchema.index({ employeeType: 1, status: 1 });
