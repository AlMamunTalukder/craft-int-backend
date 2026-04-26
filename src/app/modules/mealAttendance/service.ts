// mealAttendance/service.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import { MealAttendance } from './model';
import moment from 'moment';
import { Student } from '../student/student.model';
import { Types } from 'mongoose';

const MEAL_RATE = 55;

interface ICreateAttendancePayload {
  student: string;
  date: string;
  academicYear: string;
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
  mealRate?: number;
  remarks?: string;
}

interface IBulkAttendancePayload {
  attendances: Array<{
    studentId: string;
    date: string;
    breakfast?: boolean;
    lunch?: boolean;
    dinner?: boolean;
  }>;
  academicYear: string;
}

// Calculate total meals and cost helper function
const calculateMealStats = (breakfast: boolean, lunch: boolean, dinner: boolean, mealRate: number = MEAL_RATE) => {
  const totalMeals = [breakfast, lunch, dinner].filter(Boolean).length;
  const mealCost = totalMeals * mealRate;
  return { totalMeals, mealCost };
};

// Helper function to get class IDs by class name
const getClassIdsByClassName = async (className: string): Promise<Types.ObjectId[]> => {
  try {
    const { Class } = require('../class/class.model');
    const classes = await Class.find({ className: className });
    if (!classes.length) return [];
    return classes.map((c: any) => c._id);
  } catch (error) {
    console.error('Error finding class IDs:', error);
    return [];
  }
};

// Helper function to get students by class name
const getStudentsByClassName = async (className: string): Promise<any[]> => {
  const classIds = await getClassIdsByClassName(className);

  if (classIds.length > 0) {
    return await Student.find({
      className: { $in: classIds },
      admissionStatus: 'enrolled',
    }).select('_id studentId name nameBangla studentClassRoll studentType');
  } else {
    return await Student.find({
      className: className,
      admissionStatus: 'enrolled',
    }).select('_id studentId name nameBangla studentClassRoll studentType');
  }
};

// Create or update single attendance
const createOrUpdateAttendance = async (payload: ICreateAttendancePayload) => {
  const { student, date, academicYear, breakfast = false, lunch = false, dinner = false, mealRate = MEAL_RATE, remarks } = payload;

  const studentExists = await Student.findById(student).select('_id studentId name className admissionStatus');
  if (!studentExists) throw new AppError(httpStatus.NOT_FOUND, 'Student not found');
  if (studentExists.admissionStatus !== 'enrolled') throw new AppError(httpStatus.BAD_REQUEST, 'Student is not enrolled');

  const dateObj = moment(date);
  const formattedDate = dateObj.format('YYYY-MM-DD');
  const month = dateObj.format('YYYY-MM');
  const { totalMeals, mealCost: calculatedMealCost } = calculateMealStats(breakfast, lunch, dinner, mealRate);

  const existingAttendance = await MealAttendance.findOne({
    student: new Types.ObjectId(student),
    date: formattedDate,
    academicYear,
  });

  const updateData = {
    student: new Types.ObjectId(student),
    date: formattedDate,
    month,
    academicYear,
    breakfast,
    lunch,
    dinner,
    totalMeals,
    mealCost: calculatedMealCost,
    mealRate,
    remarks,
  };

  if (existingAttendance) {
    return await MealAttendance.findByIdAndUpdate(existingAttendance._id, updateData, { new: true, runValidators: true });
  }

  return await MealAttendance.create(updateData);
};

// Bulk create/update attendance
const bulkCreateAttendance = async (payload: IBulkAttendancePayload) => {
  const { attendances, academicYear } = payload;

  if (!attendances || !attendances.length) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No attendance data provided');
  }

  const studentIds = [...new Set(attendances.map(att => att.studentId))];
  const existingStudents = await Student.find({
    _id: { $in: studentIds },
    admissionStatus: 'enrolled'
  }).select('_id');

  const existingStudentIds = new Set(existingStudents.map(s => s._id.toString()));
  const invalidStudents = studentIds.filter(id => !existingStudentIds.has(id));

  if (invalidStudents.length) {
    throw new AppError(httpStatus.NOT_FOUND, `Students not found or not enrolled: ${invalidStudents.join(', ')}`);
  }

  const operations = attendances.map(att => {
    const date = moment(att.date).format('YYYY-MM-DD');
    const month = moment(att.date).format('YYYY-MM');
    const breakfast = att.breakfast || false;
    const lunch = att.lunch || false;
    const dinner = att.dinner || false;
    const { totalMeals, mealCost } = calculateMealStats(breakfast, lunch, dinner);

    return {
      updateOne: {
        filter: { student: new Types.ObjectId(att.studentId), date, academicYear },
        update: {
          $set: {
            student: new Types.ObjectId(att.studentId),
            date,
            month,
            academicYear,
            breakfast,
            lunch,
            dinner,
            totalMeals,
            mealCost,
            mealRate: MEAL_RATE,
            isHoliday: false,
            isAbsent: false,
          }
        },
        upsert: true,
      },
    };
  });

  const result = await MealAttendance.bulkWrite(operations);
  return {
    modifiedCount: result.modifiedCount,
    upsertedCount: result.upsertedCount,
    matchedCount: result.matchedCount,
  };
};

// Get attendance by student and month
const getAttendanceByStudentAndMonth = async (studentId: string, month: string, academicYear: string) => {
  const studentExists = await Student.findById(studentId).select('_id studentId name');
  if (!studentExists) throw new AppError(httpStatus.NOT_FOUND, 'Student not found');
  if (!moment(month, 'YYYY-MM', true).isValid()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid month format. Use YYYY-MM');
  }

  const result = await MealAttendance.find({
    student: new Types.ObjectId(studentId),
    month,
    academicYear,
  }).sort({ date: 1 });

  return {
    student: studentExists,
    attendances: result,
    summary: {
      totalMeals: result.reduce((sum, att) => sum + att.totalMeals, 0),
      totalCost: result.reduce((sum, att) => sum + att.mealCost, 0),
      presentDays: result.filter(att => att.totalMeals > 0).length,
    }
  };
};

// Get monthly attendance sheet
const getMonthlyAttendanceSheet = async (className: string, month: string, academicYear: string) => {
  if (!className) throw new AppError(httpStatus.BAD_REQUEST, 'Class name is required');
  if (!moment(month, 'YYYY-MM', true).isValid()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid month format. Use YYYY-MM');
  }

  const students = await getStudentsByClassName(className);
  if (!students.length) throw new AppError(httpStatus.NOT_FOUND, `No students found for class: ${className}`);

  const attendances = await MealAttendance.find({ month, academicYear });

  const attendanceMap = new Map();
  attendances.forEach(att => {
    const key = `${att.student.toString()}_${moment(att.date).format('YYYY-MM-DD')}`;
    attendanceMap.set(key, att);
  });

  const startDate = moment(`${month}-01`);
  const endDate = startDate.clone().endOf('month');
  const dates: string[] = [];
  let currentDate = startDate.clone();
  while (currentDate <= endDate) {
    dates.push(currentDate.format('YYYY-MM-DD'));
    currentDate.add(1, 'day');
  }

  const sheetData = students.map(student => {
    const studentAttendance = dates.map(date => {
      const key = `${student._id.toString()}_${date}`;
      const attendance = attendanceMap.get(key);
      return {
        date,
        breakfast: attendance?.breakfast || false,
        lunch: attendance?.lunch || false,
        dinner: attendance?.dinner || false,
        totalMeals: attendance?.totalMeals || 0,
        isHoliday: attendance?.isHoliday || false,
        isAbsent: attendance?.isAbsent || false,
      };
    });

    const totalMeals = studentAttendance.reduce((sum, day) => sum + day.totalMeals, 0);
    const mealCost = totalMeals * MEAL_RATE;

    return {
      student: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        nameBangla: student.nameBangla,
        roll: student.studentClassRoll,
        type: student.studentType,
        class: className,
      },
      attendance: studentAttendance,
      totalMeals,
      mealCost,
    };
  });

  return {
    month,
    academicYear,
    className,
    dates,
    students: sheetData,
    mealRate: MEAL_RATE,
    totalStudents: sheetData.length,
    grandTotalMeals: sheetData.reduce((sum, s) => sum + s.totalMeals, 0),
    grandTotalCost: sheetData.reduce((sum, s) => sum + s.mealCost, 0),
  };
};

// Get monthly summary with fees calculation
const getMonthlySummary = async (className: string, month: string, academicYear: string) => {
  const sheetData = await getMonthlyAttendanceSheet(className, month, academicYear);

  const summary = sheetData.students.map(student => {
    const isResidential = student.student.type === 'Residential' || student.student.type === 'hostel';
    const monthlyMealFee = isResidential ? 5000 : 0;
    const adjustment = monthlyMealFee - student.mealCost;

    return {
      studentName: student.student.name,
      studentNameBangla: student.student.nameBangla,
      studentRoll: student.student.roll,
      studentId: student.student.studentId,
      studentType: student.student.type,
      totalMeals: student.totalMeals,
      actualMealCost: student.mealCost,
      monthlyMealFee,
      adjustment,
      adjustmentSign: adjustment > 0 ? `+${adjustment}` : adjustment.toString(),
      netPayable: student.mealCost > monthlyMealFee ? student.mealCost - monthlyMealFee : 0,
      refund: monthlyMealFee > student.mealCost ? monthlyMealFee - student.mealCost : 0,
    };
  });

  summary.sort((a, b) => {
    const rollA = parseInt(a.studentRoll as string) || 0;
    const rollB = parseInt(b.studentRoll as string) || 0;
    return rollA - rollB;
  });

  const totalMeals = summary.reduce((sum, s) => sum + s.totalMeals, 0);
  const totalMealCost = summary.reduce((sum, s) => sum + s.actualMealCost, 0);
  const totalMonthlyFee = summary.reduce((sum, s) => sum + s.monthlyMealFee, 0);
  const totalNetPayable = summary.reduce((sum, s) => sum + s.netPayable, 0);
  const totalRefund = summary.reduce((sum, s) => sum + s.refund, 0);

  return {
    month,
    academicYear,
    className,
    summary,
    statistics: {
      totalStudents: summary.length,
      totalMeals,
      totalMealCost,
      totalMonthlyFee,
      totalNetPayable,
      totalRefund,
      averageMealsPerStudent: (totalMeals / summary.length).toFixed(2),
      mealRate: MEAL_RATE,
    },
  };
};

// Get attendance by date range for specific class
const getAttendanceByDateRange = async (className: string, startDate: string, endDate: string, academicYear: string) => {
  if (!className) throw new AppError(httpStatus.BAD_REQUEST, 'Class name is required');
  if (!startDate || !endDate) throw new AppError(httpStatus.BAD_REQUEST, 'Start date and end date are required');
  if (!academicYear) throw new AppError(httpStatus.BAD_REQUEST, 'Academic year is required');

  const startDateObj = moment(startDate, 'YYYY-MM-DD', true);
  const endDateObj = moment(endDate, 'YYYY-MM-DD', true);

  if (!startDateObj.isValid()) throw new AppError(httpStatus.BAD_REQUEST, 'Invalid startDate format. Use YYYY-MM-DD');
  if (!endDateObj.isValid()) throw new AppError(httpStatus.BAD_REQUEST, 'Invalid endDate format. Use YYYY-MM-DD');
  if (startDateObj.isAfter(endDateObj)) throw new AppError(httpStatus.BAD_REQUEST, 'startDate cannot be after endDate');

  const students = await getStudentsByClassName(className);
  if (!students.length) throw new AppError(httpStatus.NOT_FOUND, `No students found for class: ${className}`);

  const formattedStartDate = startDateObj.format('YYYY-MM-DD');
  const formattedEndDate = endDateObj.format('YYYY-MM-DD');

  const attendances = await MealAttendance.find({
    date: { $gte: formattedStartDate, $lte: formattedEndDate },
    academicYear,
  });

  const attendanceMap = new Map();
  attendances.forEach(att => {
    const key = `${att.student.toString()}_${moment(att.date).format('YYYY-MM-DD')}`;
    attendanceMap.set(key, att);
  });

  const dateRange: string[] = [];
  let currentDate = startDateObj.clone();
  const end = endDateObj.clone();
  while (currentDate <= end) {
    dateRange.push(currentDate.format('YYYY-MM-DD'));
    currentDate.add(1, 'day');
  }

  const result = students.map(student => {
    const attendanceData = dateRange.map(date => {
      const key = `${student._id.toString()}_${date}`;
      const attendance = attendanceMap.get(key);
      return {
        date,
        breakfast: attendance?.breakfast || false,
        lunch: attendance?.lunch || false,
        dinner: attendance?.dinner || false,
        totalMeals: attendance?.totalMeals || 0,
        mealCost: attendance?.mealCost || 0,
        isHoliday: attendance?.isHoliday || false,
        isAbsent: attendance?.isAbsent || false,
      };
    });

    const totalMeals = attendanceData.reduce((sum, day) => sum + day.totalMeals, 0);
    const totalCost = attendanceData.reduce((sum, day) => sum + day.mealCost, 0);
    const presentDays = attendanceData.filter(day => day.totalMeals > 0).length;

    return {
      student: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        nameBangla: student.nameBangla,
        roll: student.studentClassRoll,
        type: student.studentType,
      },
      attendance: attendanceData,
      summary: { totalMeals, totalCost, presentDays, absentDays: dateRange.length - presentDays }
    };
  });

  return {
    startDate: formattedStartDate,
    endDate: formattedEndDate,
    academicYear,
    className,
    dateRange,
    totalDays: dateRange.length,
    totalStudents: result.length,
    students: result,
    grandTotal: {
      totalMeals: result.reduce((sum, s) => sum + s.summary.totalMeals, 0),
      totalCost: result.reduce((sum, s) => sum + s.summary.totalCost, 0),
      totalPresentDays: result.reduce((sum, s) => sum + s.summary.presentDays, 0),
    }
  };
};

// Get attendance by date range for all students
const getAttendanceByDateRangeForAllStudents = async (startDate: string, endDate: string, academicYear: string) => {
  if (!startDate || !endDate) throw new AppError(httpStatus.BAD_REQUEST, 'Start date and end date are required');
  if (!academicYear) throw new AppError(httpStatus.BAD_REQUEST, 'Academic year is required');

  const startDateObj = moment(startDate, 'YYYY-MM-DD', true);
  const endDateObj = moment(endDate, 'YYYY-MM-DD', true);

  if (!startDateObj.isValid()) throw new AppError(httpStatus.BAD_REQUEST, 'Invalid startDate format. Use YYYY-MM-DD');
  if (!endDateObj.isValid()) throw new AppError(httpStatus.BAD_REQUEST, 'Invalid endDate format. Use YYYY-MM-DD');
  if (startDateObj.isAfter(endDateObj)) throw new AppError(httpStatus.BAD_REQUEST, 'startDate cannot be after endDate');

  const students = await Student.find({ admissionStatus: 'enrolled' })
    .select('_id studentId name nameBangla studentClassRoll studentType');

  if (!students.length) throw new AppError(httpStatus.NOT_FOUND, 'No students found');

  const formattedStartDate = startDateObj.format('YYYY-MM-DD');
  const formattedEndDate = endDateObj.format('YYYY-MM-DD');

  const attendances = await MealAttendance.find({
    date: { $gte: formattedStartDate, $lte: formattedEndDate },
    academicYear,
  });

  const attendanceMap = new Map();
  attendances.forEach(att => {
    const key = `${att.student.toString()}_${moment(att.date).format('YYYY-MM-DD')}`;
    attendanceMap.set(key, att);
  });

  const dateRange: string[] = [];
  let currentDate = startDateObj.clone();
  const end = endDateObj.clone();
  while (currentDate <= end) {
    dateRange.push(currentDate.format('YYYY-MM-DD'));
    currentDate.add(1, 'day');
  }

  const result = students.map(student => {
    const attendanceData = dateRange.map(date => {
      const key = `${student._id.toString()}_${date}`;
      const attendance = attendanceMap.get(key);
      return {
        date,
        breakfast: attendance?.breakfast || false,
        lunch: attendance?.lunch || false,
        dinner: attendance?.dinner || false,
        totalMeals: attendance?.totalMeals || 0,
        mealCost: attendance?.mealCost || 0,
        isHoliday: attendance?.isHoliday || false,
        isAbsent: attendance?.isAbsent || false,
      };
    });

    const totalMeals = attendanceData.reduce((sum, day) => sum + day.totalMeals, 0);
    const totalCost = attendanceData.reduce((sum, day) => sum + day.mealCost, 0);
    const presentDays = attendanceData.filter(day => day.totalMeals > 0).length;

    return {
      student: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        nameBangla: student.nameBangla,
        roll: student.studentClassRoll,
        type: student.studentType,
      },
      attendance: attendanceData,
      summary: {
        totalMeals,
        totalCost,
        presentDays,
        absentDays: dateRange.length - presentDays,
        attendancePercentage: ((presentDays / dateRange.length) * 100).toFixed(2),
      }
    };
  });

  return {
    startDate: formattedStartDate,
    endDate: formattedEndDate,
    academicYear,
    dateRange,
    totalDays: dateRange.length,
    students: result,
    grandTotal: {
      totalStudents: result.length,
      totalMeals: result.reduce((sum, s) => sum + s.summary.totalMeals, 0),
      totalCost: result.reduce((sum, s) => sum + s.summary.totalCost, 0),
      totalPresentDays: result.reduce((sum, s) => sum + s.summary.presentDays, 0),
      averageAttendancePercentage: (result.reduce((sum, s) => sum + parseFloat(s.summary.attendancePercentage), 0) / result.length).toFixed(2),
    }
  };
};

// Delete attendance
const deleteAttendance = async (id: string) => {
  const result = await MealAttendance.findByIdAndDelete(id);
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Meal attendance not found');
  return result;
};

export const mealAttendanceServices = {
  createOrUpdateAttendance,
  bulkCreateAttendance,
  getAttendanceByStudentAndMonth,
  getMonthlyAttendanceSheet,
  getMonthlySummary,
  getAttendanceByDateRange,
  getAttendanceByDateRangeForAllStudents,
  deleteAttendance,
};