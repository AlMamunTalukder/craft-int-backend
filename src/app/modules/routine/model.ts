import { Schema, model } from 'mongoose';
import { IClassRoutine, IRoutinePeriod } from './interface';

const RoutinePeriodSchema = new Schema<IRoutinePeriod>(
  {
    subject: { type: String, required: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'Teacher' },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    room: { type: String },
    isBreak: { type: Boolean, default: false },
  },
  { _id: false }
);

const ClassRoutineSchema = new Schema<IClassRoutine>(
  {
    className: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    section: { type: String },
    day: { type: String, required: true },
    academicYear: { type: String, required: true },
    periods: { type: [RoutinePeriodSchema], default: [] },
  },
  { timestamps: true }
);

ClassRoutineSchema.index(
  { className: 1, section: 1, day: 1, academicYear: 1 },
  { unique: true, sparse: true },
);

export const ClassRoutine = model<IClassRoutine>(
  'ClassRoutine',
  ClassRoutineSchema,
);
