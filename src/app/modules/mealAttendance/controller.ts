// app/modules/mealAttendance/controller.ts
import httpStatus from 'http-status';
import sendResponse from '../../../utils/sendResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { mealAttendanceServices } from './service';
import { Request, Response } from 'express';
import { PersonType } from './interface';

const bulkCreateAttendance = catchAsync(async (req: Request, res: Response) => {
  const result = await mealAttendanceServices.bulkCreateAttendance(req.body);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Bulk meal attendance saved successfully', data: result });
});

const getMonthlyAttendanceSheet = catchAsync(async (req: Request, res: Response) => {
  const { className, month, academicYear, personType } = req.query;

  if (!month || !academicYear) {
    return sendResponse(res, { statusCode: httpStatus.BAD_REQUEST, success: false, message: 'month and academicYear are required', data: null });
  }

  const result = await mealAttendanceServices.getMonthlyAttendanceSheet(
    (personType as PersonType) || 'student',
    month as string,
    academicYear as string,
    className as string | undefined,
  );

  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Monthly attendance sheet retrieved successfully', data: result });
});

const getMonthlySummary = catchAsync(async (req: Request, res: Response) => {
  const { className, month, academicYear, personType } = req.query;

  if (!month || !academicYear) {
    return sendResponse(res, { statusCode: httpStatus.BAD_REQUEST, success: false, message: 'month and academicYear are required', data: null });
  }

  const result = await mealAttendanceServices.getMonthlySummary(
    (personType as PersonType) || 'student',
    month as string,
    academicYear as string,
    className as string | undefined,
  );

  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Monthly summary retrieved successfully', data: result });
});

const getAllAttendanceRecords = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string) || '';
  const personType = ((req.query.personType as string) || 'student') as PersonType;
  const className = (req.query.className as string) || '';
  const date = (req.query.date as string) || '';
  const month = (req.query.month as string) || '';
  const academicYear = (req.query.academicYear as string) || new Date().getFullYear().toString();
  const sortColumn = (req.query.sortColumn as string) || 'date';
  const sortDirection = ((req.query.sortDirection as string) || 'desc') as 'asc' | 'desc';

  const result = await mealAttendanceServices.getAllAttendanceRecords(
    page, limit, search, personType, date, month, academicYear, sortColumn, sortDirection, className,
  );

  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Attendance records retrieved successfully', data: result });
});

const getAttendanceById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) return sendResponse(res, { statusCode: httpStatus.BAD_REQUEST, success: false, message: 'Attendance ID is required', data: null });

  const result = await mealAttendanceServices.getAttendanceById(id);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Attendance record retrieved successfully', data: result });
});

const updateAttendance = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) return sendResponse(res, { statusCode: httpStatus.BAD_REQUEST, success: false, message: 'Attendance ID is required', data: null });

  const result = await mealAttendanceServices.updateAttendance(id, req.body);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Meal attendance updated successfully', data: result });
});

const deleteAttendance = catchAsync(async (req: Request, res: Response) => {
  const result = await mealAttendanceServices.deleteAttendance(req.params.id);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Meal attendance deleted successfully', data: result });
});

const deleteMonthlyAttendance = catchAsync(async (req: Request, res: Response) => {
  const { className, month, academicYear, personType } = req.query;

  if (!month || !academicYear) {
    return sendResponse(res, { statusCode: httpStatus.BAD_REQUEST, success: false, message: 'month and academicYear are required', data: null });
  }

  const result = await mealAttendanceServices.deleteMonthlyAttendance(
    (personType as PersonType) || 'student',
    month as string,
    academicYear as string,
    className as string | undefined,
  );

  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: result.message, data: result });
});

const getAttendanceByStudentAndMonth = catchAsync(async (req: Request, res: Response) => {
  const { studentId, month, academicYear } = req.params;
  if (!studentId || !month || !academicYear) {
    return sendResponse(res, { statusCode: httpStatus.BAD_REQUEST, success: false, message: 'studentId, month and academicYear are required', data: null });
  }
  const result = await mealAttendanceServices.getAttendanceByStudentAndMonth(studentId, month, academicYear);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Meal attendance retrieved successfully', data: result });
});

export const mealAttendanceControllers = {
  bulkCreateAttendance,
  getMonthlyAttendanceSheet,
  getMonthlySummary,
  getAllAttendanceRecords,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  deleteMonthlyAttendance,
  getAttendanceByStudentAndMonth,
};