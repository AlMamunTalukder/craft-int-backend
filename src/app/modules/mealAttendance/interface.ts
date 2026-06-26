<<<<<<< HEAD
// app/modules/mealAttendance/interface.ts
import { Types } from 'mongoose';

export type PersonType = 'student' | 'teacher' | 'staff';

export interface IMealAttendance {
  // ─── Person reference (one of these will be set) ───
  student?: Types.ObjectId;
  teacher?: Types.ObjectId;
  staff?: Types.ObjectId;

  // ─── Person type discriminator ───
  personType: PersonType; // 'student' | 'teacher' | 'staff'

  // ─── Attendance fields ───
  date: Date;
  month: string;       // 'YYYY-MM' format
  academicYear: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  totalMeals: number;

  // ─── Per-meal rates (custom or default) ───
  breakfastRate: number;
  lunchRate: number;
  dinnerRate: number;

  mealCost: number;

  grossCost: number;

  freeMealCostSaved: number;

  isFreeMeal: boolean;
  isHoliday: boolean;
  isAbsent: boolean;
  remarks?: string;

  // ─── Audit ───
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

// ─── Payload Types ───

export interface IAttendanceRecord {
  personId: string;
  personType: PersonType;
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  isFreeMeal?: boolean;

  breakfastRate?: number;
  lunchRate?: number;
  dinnerRate?: number;
}

export interface IBulkAttendancePayload {
  attendances: IAttendanceRecord[];
  academicYear: string;
}

export interface ICreateAttendancePayload {
  personId?: string;
  personType?: PersonType;
  student?: string;
  date: string;
  academicYear: string;
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
  isFreeMeal?: boolean;
  breakfastRate?: number;
  lunchRate?: number;
  dinnerRate?: number;
  remarks?: string;
}

export interface IBulkGetQueryPayload {
  studentIds?: string[];
  teacherIds?: string[];
  staffIds?: string[];
  personType?: PersonType;
  classNames?: string[];
  startDate?: string;
  endDate?: string;
  month?: string;
  academicYear: string;
  mealStatus?: 'all' | 'taken' | 'not_taken';
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
}

export interface IBulkUpdateAttendancePayload {
  updates: Array<{
    id: string;
    data: Partial<ICreateAttendancePayload>;
  }>;
=======
// app/modules/mealAttendance/interface.ts
import { Types } from 'mongoose';

export type PersonType = 'student' | 'teacher' | 'staff';

export interface IMealAttendance {
  // ─── Person reference (one of these will be set) ───
  student?: Types.ObjectId;
  teacher?: Types.ObjectId;
  staff?: Types.ObjectId;

  // ─── Person type discriminator ───
  personType: PersonType; // 'student' | 'teacher' | 'staff'

  // ─── Attendance fields ───
  date: Date;
  month: string;       // 'YYYY-MM' format
  academicYear: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  totalMeals: number;

  // ─── Per-meal rates (custom or default) ───
  breakfastRate: number;
  lunchRate: number;
  dinnerRate: number;

  mealCost: number;

  grossCost: number;

  freeMealCostSaved: number;

  isFreeMeal: boolean;
  isHoliday: boolean;
  isAbsent: boolean;
  remarks?: string;

  // ─── Audit ───
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

// ─── Payload Types ───

export interface IAttendanceRecord {
  personId: string;
  personType: PersonType;
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  isFreeMeal?: boolean;

  breakfastRate?: number;
  lunchRate?: number;
  dinnerRate?: number;
}

export interface IBulkAttendancePayload {
  attendances: IAttendanceRecord[];
  academicYear: string;
}

export interface ICreateAttendancePayload {
  personId?: string;
  personType?: PersonType;
  student?: string;
  date: string;
  academicYear: string;
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
  isFreeMeal?: boolean;
  breakfastRate?: number;
  lunchRate?: number;
  dinnerRate?: number;
  remarks?: string;
}

export interface IBulkGetQueryPayload {
  studentIds?: string[];
  teacherIds?: string[];
  staffIds?: string[];
  personType?: PersonType;
  classNames?: string[];
  startDate?: string;
  endDate?: string;
  month?: string;
  academicYear: string;
  mealStatus?: 'all' | 'taken' | 'not_taken';
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
}

export interface IBulkUpdateAttendancePayload {
  updates: Array<{
    id: string;
    data: Partial<ICreateAttendancePayload>;
  }>;
>>>>>>> 84d34149f1ac58cdcfb6e9387a96f9a45d43ab7a
}