// app/modules/mealAttendance/interface.ts

import { Types } from 'mongoose';

export interface IMealAttendance {
  student: Types.ObjectId | string;
  date: Date;
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
  isFreeMeal: boolean;
}

export interface ICreateAttendancePayload {
  student: string;
  date: string; // 'YYYY-MM-DD' as input, converted to Date
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
    isFreeMeal?: boolean; // ✅ NEW

  }>;
  academicYear: string;
}

export interface IBulkMealAttendance {
  studentId: string;
  date: string;
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
}

export interface IBulkUpdateItem {
  id: string;
  data: Partial<ICreateAttendancePayload>;
}

export interface IBulkUpdateAttendancePayload {
  updates: IBulkUpdateItem[];
}

export interface IBulkGetQueryPayload {
  studentIds?: string[];
  classNames?: string[];
  startDate?: string;  // ✅ Added startDate
  endDate?: string;    // ✅ Added endDate
  month?: string;
  academicYear: string;
  mealStatus?: 'all' | 'taken' | 'not_taken';
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
}

export interface IBulkGetByDateRangePayload {
  startDate: string;
  endDate: string;
  academicYear: string;
  page?: number;
  limit?: number;
  className?: string;
  studentType?: string;
}

export interface IBulkDeleteAttendancePayload {
  ids: string[];
}

export interface IBulkDeleteByCriteriaPayload {
  studentIds?: string[];
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

export interface IBulkSummaryReportPayload {
  classNames?: string[];
  studentIds?: string[];
  startDate?: string;
  endDate?: string;
  month?: string;
  academicYear: string;
  groupBy?: 'student' | 'class' | 'date';
}

export interface IBulkExportPayload {
  startDate?: string;
  endDate?: string;
  month?: string;
  academicYear: string;
  classNames?: string[];
  studentIds?: string[];
  format?: 'detailed' | 'summary';
}