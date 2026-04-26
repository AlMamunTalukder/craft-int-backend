
import httpStatus from 'http-status';
import sendResponse from '../../../utils/sendResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { mealAttendanceServices } from './service';
import { Request, Response } from 'express';
import moment from 'moment';

const createOrUpdateAttendance = catchAsync(async (req: Request, res: Response) => {
  const result = await mealAttendanceServices.createOrUpdateAttendance(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Meal attendance saved successfully',
    data: result,
  });
});

const bulkCreateAttendance = catchAsync(async (req: Request, res: Response) => {
  const result = await mealAttendanceServices.bulkCreateAttendance(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bulk meal attendance saved successfully',
    data: result,
  });
});

const getAttendanceByStudentAndMonth = catchAsync(async (req: Request, res: Response) => {
  const { studentId, month, academicYear } = req.params;

  if (!studentId || !month || !academicYear) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'studentId, month and academicYear are required',
      data: null,
    });
  }

  const result = await mealAttendanceServices.getAttendanceByStudentAndMonth(
    studentId,
    month,
    academicYear
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Meal attendance retrieved successfully',
    data: result,
  });
});

const getMonthlyAttendanceSheet = catchAsync(async (req: Request, res: Response) => {
  const { className, month, academicYear } = req.query;

  if (!className || !month || !academicYear) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'class, month and academicYear are required',
      data: null,
    });
  }

  const result = await mealAttendanceServices.getMonthlyAttendanceSheet(
    className as string,
    month as string,
    academicYear as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Monthly attendance sheet retrieved successfully',
    data: result,
  });
});

const getMonthlySummary = catchAsync(async (req: Request, res: Response) => {
  const { className, month, academicYear } = req.query;

  if (!className || !month || !academicYear) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'class, month and academicYear are required',
      data: null,
    });
  }

  const result = await mealAttendanceServices.getMonthlySummary(
    className as string,
    month as string,
    academicYear as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Monthly summary retrieved successfully',
    data: result,
  });
});

const getAttendanceByDateRange = catchAsync(async (req: Request, res: Response) => {
  const { className, startDate, endDate, academicYear } = req.query;

  if (!className) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'class parameter is required',
      data: null,
    });
  }

  if (!startDate || !endDate) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'startDate and endDate are required (format: YYYY-MM-DD)',
      data: null,
    });
  }

  if (!academicYear) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'academicYear parameter is required',
      data: null,
    });
  }

  const result = await mealAttendanceServices.getAttendanceByDateRange(
    className as string,
    startDate as string,
    endDate as string,
    academicYear as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Attendance by date range retrieved successfully',
    data: result,
  });
});

const getAttendanceByDateRangeForAllStudents = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate, academicYear } = req.query;

  if (!startDate || !endDate) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'startDate and endDate are required (format: YYYY-MM-DD)',
      data: null,
    });
  }

  if (!academicYear) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'academicYear is required',
      data: null,
    });
  }

  const result = await mealAttendanceServices.getAttendanceByDateRangeForAllStudents(
    startDate as string,
    endDate as string,
    academicYear as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Attendance by date range for all students retrieved successfully',
    data: result,
  });
});

const getStudentMealReport = catchAsync(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'startDate and endDate are required',
      data: null,
    });
  }

  const result = await mealAttendanceServices.getStudentMealReport(
    studentId,
    startDate as string,
    endDate as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Student meal report retrieved successfully',
    data: result,
  });
});

const getStudentWithMealHistory = catchAsync(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const { academicYear, month } = req.query;

  const result = await mealAttendanceServices.getStudentWithMealHistory(
    studentId,
    academicYear as string,
    month as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Student with meal history retrieved successfully',
    data: result,
  });
});

const deleteAttendance = catchAsync(async (req: Request, res: Response) => {
  const result = await mealAttendanceServices.deleteAttendance(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Meal attendance deleted successfully',
    data: result,
  });
});

const getAllAttendanceRecords = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string || '';
  const className = req.query.className as string || '';
  const date = req.query.date as string || '';
  const month = req.query.month as string || '';
  const academicYear = req.query.academicYear as string || moment().year().toString();
  const sortColumn = req.query.sortColumn as string || 'date';
  const sortDirection = (req.query.sortDirection as 'asc' | 'desc') || 'desc';

  const result = await mealAttendanceServices.getAllAttendanceRecords(
    page,
    limit,
    search,
    className,
    date,
    month,
    academicYear,
    sortColumn,
    sortDirection
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Attendance records retrieved successfully',
    data: result,
  });
});

export const mealAttendanceControllers = {
  createOrUpdateAttendance,
  bulkCreateAttendance,
  getAttendanceByStudentAndMonth,
  getMonthlyAttendanceSheet,
  getMonthlySummary,
  getAttendanceByDateRange,
  getAttendanceByDateRangeForAllStudents,
  deleteAttendance,
  getStudentMealReport,
  getStudentWithMealHistory,
  getAllAttendanceRecords
};