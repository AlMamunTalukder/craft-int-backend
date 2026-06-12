
import httpStatus from 'http-status';
import sendResponse from '../../../utils/sendResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { mealAttendanceServices } from './service';
import { Request, Response } from 'express';
import moment from 'moment';
import { IBulkGetQueryPayload } from './interface';

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

// app/modules/mealAttendance/controller.ts

const getMonthlyAttendanceSheet = catchAsync(async (req: Request, res: Response) => {
  // আপনি আর রিকোযস অনুযায় className এখন option থাকতে পারবেন।
  // যদি frontend ক্লাস পাঠায (All Classes), তাহলে এটি validation আসবে Service এ handle করবে।
  const { className, month, academicYear } = req.query;

  if (!month || !academicYear) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'month and academicYear are required',
      data: null,
    });
  }

  const result = await mealAttendanceServices.getMonthlyAttendanceSheet(
    className as string | undefined,
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
const getAttendanceById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Attendance ID is required',
      data: null,
    });
  }

  const result = await mealAttendanceServices.getAttendanceById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Attendance record retrieved successfully',
    data: result,
  });
});
const updateAttendance = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!id) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Attendance ID is required',
      data: null,
    });
  }

  const result = await mealAttendanceServices.updateAttendance(id, updateData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Meal attendance updated successfully',
    data: result,
  });
});


const bulkUpdateAttendance = catchAsync(async (req: Request, res: Response) => {
  const result = await mealAttendanceServices.bulkUpdateAttendance(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});



const bulkGetAttendance = catchAsync(async (req: Request, res: Response) => {
  const queryPayload: IBulkGetQueryPayload = {
    studentIds: req.query.studentIds ? (req.query.studentIds as string).split(',') : undefined,
    classNames: req.query.classNames ? (req.query.classNames as string).split(',') : undefined,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    month: req.query.month as string,
    academicYear: req.query.academicYear as string,
    mealStatus: req.query.mealStatus as 'all' | 'taken' | 'not_taken',
    breakfast: req.query.breakfast === 'true' ? true : req.query.breakfast === 'false' ? false : undefined,
    lunch: req.query.lunch === 'true' ? true : req.query.lunch === 'false' ? false : undefined,
    dinner: req.query.dinner === 'true' ? true : req.query.dinner === 'false' ? false : undefined,
  };

  if (!queryPayload.academicYear) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'academicYear is required',
      data: null,
    });
  }

  const result = await mealAttendanceServices.bulkGetAttendance(queryPayload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});


const bulkGetByDateRange = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate, academicYear } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const className = req.query.className as string;
  const studentType = req.query.studentType as string;

  if (!startDate || !endDate || !academicYear) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'startDate, endDate and academicYear are required',
      data: null,
    });
  }

  const result = await mealAttendanceServices.bulkGetByDateRange(
    startDate as string,
    endDate as string,
    academicYear as string,
    page,
    limit,
    className,
    studentType
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});
const deleteMonthlyAttendance = catchAsync(async (req: Request, res: Response) => {
  const { className, month, academicYear } = req.query;

  // Only Month and Year are strictly required. Class is optional for "All Classes" deletion.
  if (!month || !academicYear) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'month and academicYear are required',
      data: null,
    });
  }

  const result = await mealAttendanceServices.deleteMonthlyAttendance(
    className as string, // Pass undefined if not provided
    month as string,
    academicYear as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

export const mealAttendanceControllers = {
  createOrUpdateAttendance,
  bulkCreateAttendance,
  bulkUpdateAttendance,
  bulkGetAttendance,
  bulkGetByDateRange,
  getAttendanceByStudentAndMonth,
  getMonthlyAttendanceSheet,
  getMonthlySummary,
  getAttendanceByDateRangeForAllStudents,
  deleteAttendance,
  getStudentMealReport,
  getAllAttendanceRecords,
  getAttendanceById,
  updateAttendance,
  deleteMonthlyAttendance
};
