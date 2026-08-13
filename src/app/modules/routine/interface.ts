import { ObjectId } from 'mongoose';

export interface IRoutinePeriod {
  subject: string;
  teacher?: ObjectId;
  startTime: string;
  endTime: string;
  room?: string;
  isBreak?: boolean;
}

export interface IClassRoutine {
  className: ObjectId;
  section?: string;
  day: string;
  academicYear: string;
  periods: IRoutinePeriod[];
}
