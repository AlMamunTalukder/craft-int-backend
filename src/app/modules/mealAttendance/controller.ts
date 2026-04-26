// mealAttendance/controller.ts
import httpStatus from 'http-status';
import sendResponse from '../../../utils/sendResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { mealAttendanceServices } from './service';
import { Request, Response } from 'express';

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
  const { studentId, month, academicYear } = req.query;

  if (!studentId || !month || !academicYear) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'studentId, month and academicYear are required',
      data: null,
    });
  }

  const result = await mealAttendanceServices.getAttendanceByStudentAndMonth(
    studentId as string,
    month as string,
    academicYear as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Meal attendance retrieved successfully',
    data: result,
  });
});

const getMonthlyAttendanceSheet = catchAsync(async (req: Request, res: Response) => {
  const { class: className, month, academicYear } = req.query;

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
  const { class: className, month, academicYear } = req.query;

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
  const { class: className, startDate, endDate, academicYear } = req.query;

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

const deleteAttendance = catchAsync(async (req: Request, res: Response) => {
  const result = await mealAttendanceServices.deleteAttendance(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Meal attendance deleted successfully',
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
};