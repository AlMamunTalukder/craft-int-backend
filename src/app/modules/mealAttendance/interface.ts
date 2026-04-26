
import { Types } from 'mongoose';

export interface IMealAttendance {
  student: Types.ObjectId | string;
  date: Date | string;
  month: string;
  academicYear: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  totalMeals: number;
  mealRate: number;
  mealCost: number;
  isHoliday: boolean;
  isAbsent: boolean;
  remarks?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

export interface IBulkMealAttendance {
  studentId: string;
  date: string;
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
}

export interface ICreateAttendancePayload {
  student: string;
  date: string;
  academicYear: string;
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
  mealRate?: number;
  remarks?: string;
}

export interface IBulkAttendancePayload {
  attendances: Array<{
    studentId: string;
    date: string;
    breakfast?: boolean;
    lunch?: boolean;
    dinner?: boolean;
  }>;
  academicYear: string;
}