// src/modules/mealAttendance/service.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import { MealAttendance } from './model';
import moment from 'moment';
import { Student } from '../student/student.model';
import { Types } from 'mongoose';
import { IBulkAttendancePayload, ICreateAttendancePayload } from './interface';

const MEAL_RATE = 55;



const calculateMealStats = (breakfast: boolean, lunch: boolean, dinner: boolean, mealRate: number = MEAL_RATE) => {
  const totalMeals = [breakfast, lunch, dinner].filter(Boolean).length;
  const mealCost = totalMeals * mealRate;
  return { totalMeals, mealCost };
};


const updateStudentMealAttendance = async (studentId: string, attendanceId: string, isDelete: boolean = false) => {
  try {
    if (isDelete) {
      // Remove attendance reference from student
      await Student.findByIdAndUpdate(
        studentId,
        { $pull: { mealAttendances: attendanceId } }
      );
    } else {
      // Add attendance reference to student (use $addToSet to avoid duplicates)
      await Student.findByIdAndUpdate(
        studentId,
        { $addToSet: { mealAttendances: attendanceId } }
      );
    }
  } catch (error) {
    console.error('Error updating student meal attendance:', error);
  }
};

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


const getStudentsByClassName = async (className: string): Promise<any[]> => {
  const classIds = await getClassIdsByClassName(className);

  const query: any = {
    admissionStatus: 'enrolled',
    status: 'active'
  };

  if (classIds.length > 0) {
    query.className = { $in: classIds };
  } else {
    query.class = className;
  }

  return await Student.find(query)
    .select('_id studentId name nameBangla studentClassRoll studentType className class')
    .lean();
};


const createOrUpdateAttendance = async (payload: ICreateAttendancePayload) => {
  const { student, date, academicYear, breakfast = false, lunch = false, dinner = false, mealRate = MEAL_RATE, remarks } = payload;

  const studentExists = await Student.findById(student).select('_id studentId name className admissionStatus status');
  if (!studentExists) throw new AppError(httpStatus.NOT_FOUND, 'Student not found');
  if (studentExists.admissionStatus !== 'enrolled') throw new AppError(httpStatus.BAD_REQUEST, 'Student is not enrolled');
  if (studentExists.status !== 'active') throw new AppError(httpStatus.BAD_REQUEST, 'Student is not active');

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

  let result;
  if (existingAttendance) {
    result = await MealAttendance.findByIdAndUpdate(existingAttendance._id, updateData, { new: true, runValidators: true });
  } else {
    result = await MealAttendance.create(updateData);
    // CRITICAL: Add attendance reference to student
    await updateStudentMealAttendance(student, result._id.toString(), false);
  }

  return result;
};


const bulkCreateAttendance = async (payload: IBulkAttendancePayload) => {
  const { attendances, academicYear } = payload;

  if (!attendances || !attendances.length) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No attendance data provided');
  }

  const studentIds = [...new Set(attendances.map(att => att.studentId))];
  const existingStudents = await Student.find({
    _id: { $in: studentIds },
    admissionStatus: 'enrolled',
    status: 'active'
  }).select('_id');

  const existingStudentIds = new Set(existingStudents.map(s => s._id.toString()));
  const invalidStudents = studentIds.filter(id => !existingStudentIds.has(id));

  const bulkOperations = [];
  const newAttendanceIds: { studentId: string; attendanceId: string }[] = [];

  for (const att of attendances) {
    const date = moment(att.date).format('YYYY-MM-DD');
    const month = moment(att.date).format('YYYY-MM');
    const breakfast = att.breakfast || false;
    const lunch = att.lunch || false;
    const dinner = att.dinner || false;
    const { totalMeals, mealCost } = calculateMealStats(breakfast, lunch, dinner);

    // Check if attendance exists
    const existingAttendance = await MealAttendance.findOne({
      student: new Types.ObjectId(att.studentId),
      date,
      academicYear,
    });

    // Create a temporary ID for new attendance
    const tempId = new Types.ObjectId();

    if (!existingAttendance) {
      newAttendanceIds.push({
        studentId: att.studentId,
        attendanceId: tempId.toString(),
      });
    }

    bulkOperations.push({
      updateOne: {
        filter: { student: new Types.ObjectId(att.studentId), date, academicYear },
        update: {
          $setOnInsert: { _id: tempId },
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
    });
  }

  const result = await MealAttendance.bulkWrite(bulkOperations);

  // CRITICAL: Update student references for new attendances
  for (const item of newAttendanceIds) {
    await updateStudentMealAttendance(item.studentId, item.attendanceId, false);
  }

  return {
    modifiedCount: result.modifiedCount,
    upsertedCount: result.upsertedCount,
    matchedCount: result.matchedCount,
    totalProcessed: attendances.length,
  };
};


const deleteAttendance = async (id: string) => {
  const attendance = await MealAttendance.findById(id);
  if (!attendance) throw new AppError(httpStatus.NOT_FOUND, 'Meal attendance not found');

  const studentId = attendance.student.toString();
  const result = await MealAttendance.findByIdAndDelete(id);

  // Remove attendance reference from student
  await updateStudentMealAttendance(studentId, id, true);

  return result;
};



const getAttendanceByStudentAndMonth = async (studentId: string, month: string, academicYear: string) => {
  const student = await Student.findById(studentId).select('_id studentId name nameBangla studentClassRoll studentType');
  if (!student) throw new AppError(httpStatus.NOT_FOUND, 'Student not found');
  if (!moment(month, 'YYYY-MM', true).isValid()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid month format. Use YYYY-MM');
  }

  const attendances = await MealAttendance.find({
    student: new Types.ObjectId(studentId),
    month,
    academicYear,
  }).sort({ date: 1 });

  const totalMeals = attendances.reduce((sum, att) => sum + att.totalMeals, 0);
  const totalCost = attendances.reduce((sum, att) => sum + att.mealCost, 0);
  const presentDays = attendances.filter(att => att.totalMeals > 0).length;
  const totalDays = moment(month, 'YYYY-MM').daysInMonth();

  return {
    student: {
      id: student._id,
      studentId: student.studentId,
      name: student.name,
      nameBangla: student.nameBangla,
      roll: student.studentClassRoll,
      type: student.studentType,
    },
    month,
    academicYear,
    attendances,
    summary: {
      totalMeals,
      totalCost,
      totalBreakfast: attendances.filter(a => a.breakfast).length,
      totalLunch: attendances.filter(a => a.lunch).length,
      totalDinner: attendances.filter(a => a.dinner).length,
      presentDays,
      absentDays: totalDays - presentDays,
      attendancePercentage: ((presentDays / totalDays) * 100).toFixed(2),
    }
  };
};


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

const getAttendanceByDateRangeForAllStudents = async (startDate: string, endDate: string, academicYear: string) => {
  if (!startDate || !endDate) throw new AppError(httpStatus.BAD_REQUEST, 'Start date and end date are required');
  if (!academicYear) throw new AppError(httpStatus.BAD_REQUEST, 'Academic year is required');

  const startDateObj = moment(startDate, 'YYYY-MM-DD', true);
  const endDateObj = moment(endDate, 'YYYY-MM-DD', true);

  if (!startDateObj.isValid()) throw new AppError(httpStatus.BAD_REQUEST, 'Invalid startDate format. Use YYYY-MM-DD');
  if (!endDateObj.isValid()) throw new AppError(httpStatus.BAD_REQUEST, 'Invalid endDate format. Use YYYY-MM-DD');
  if (startDateObj.isAfter(endDateObj)) throw new AppError(httpStatus.BAD_REQUEST, 'startDate cannot be after endDate');

  const students = await Student.find({ admissionStatus: 'enrolled', status: 'active' })
    .select('_id studentId name nameBangla studentClassRoll studentType class className');

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
        class: student.className || student.class,
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

const getStudentMealReport = async (studentId: string, startDate: string, endDate: string) => {
  const student = await Student.findById(studentId).select('_id studentId name nameBangla studentClassRoll studentType');
  if (!student) throw new AppError(httpStatus.NOT_FOUND, 'Student not found');

  const start = moment(startDate, 'YYYY-MM-DD');
  const end = moment(endDate, 'YYYY-MM-DD');

  if (!start.isValid() || !end.isValid()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid date format. Use YYYY-MM-DD');
  }

  const attendances = await MealAttendance.find({
    student: new Types.ObjectId(studentId),
    date: { $gte: start.toDate(), $lte: end.toDate() },
  }).sort({ date: 1 });

  const totalMeals = attendances.reduce((sum, att) => sum + att.totalMeals, 0);
  const totalCost = attendances.reduce((sum, att) => sum + att.mealCost, 0);
  const presentDays = attendances.filter(att => att.totalMeals > 0).length;
  const totalDays = end.diff(start, 'days') + 1;

  return {
    student: {
      id: student._id,
      studentId: student.studentId,
      name: student.name,
      nameBangla: student.nameBangla,
      roll: student.studentClassRoll,
      type: student.studentType,
    },
    period: {
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
      totalDays,
    },
    attendances,
    summary: {
      totalMeals,
      totalCost,
      totalBreakfast: attendances.filter(a => a.breakfast).length,
      totalLunch: attendances.filter(a => a.lunch).length,
      totalDinner: attendances.filter(a => a.dinner).length,
      presentDays,
      absentDays: totalDays - presentDays,
      attendancePercentage: ((presentDays / totalDays) * 100).toFixed(2),
      averageMealsPerDay: (totalMeals / totalDays).toFixed(2),
    }
  };
};



const getStudentWithMealHistory = async (studentId: string, academicYear?: string, month?: string) => {
  const student = await Student.findById(studentId)
    .select('_id studentId name nameBangla studentClassRoll studentType className')
    .populate({
      path: 'mealAttendances',
      match: {
        ...(academicYear && { academicYear }),
        ...(month && { month }),
      },
      options: { sort: { date: -1 } }
    })
    .lean();

  if (!student) throw new AppError(httpStatus.NOT_FOUND, 'Student not found');

  const mealHistory = (student as any).mealAttendances || [];

  const statistics = {
    totalMeals: mealHistory.reduce((sum: number, m: any) => sum + m.totalMeals, 0),
    totalCost: mealHistory.reduce((sum: number, m: any) => sum + m.mealCost, 0),
    totalBreakfast: mealHistory.filter((m: any) => m.breakfast).length,
    totalLunch: mealHistory.filter((m: any) => m.lunch).length,
    totalDinner: mealHistory.filter((m: any) => m.dinner).length,
    totalDays: mealHistory.length,
    presentDays: mealHistory.filter((m: any) => m.totalMeals > 0).length,
  };

  return {
    studentInfo: {
      id: student._id,
      studentId: student.studentId,
      name: student.name,
      nameBangla: student.nameBangla,
      roll: student.studentClassRoll,
      type: student.studentType,
      class: student.className,
    },
    mealHistory,
    statistics,
  };
};

const getAllAttendanceRecords = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
  className: string = '',
  date: string = '',
  month: string = '',
  academicYear: string,
  sortColumn: string = 'date',
  sortDirection: 'asc' | 'desc' = 'desc'
) => {
  const skip = (page - 1) * limit;

  let studentIds: Types.ObjectId[] = [];

  if (className) {
    const { Class } = require('../class/class.model');
    const classes = await Class.find({ className: className });
    const classIds = classes.map((c: any) => c._id);

    const students = await Student.find({
      className: { $in: classIds },
      admissionStatus: 'enrolled',
      status: 'active'
    }).select('_id');

    studentIds = students.map((s: any) => s._id);

    if (studentIds.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
        totalMeals: 0,
        totalCost: 0,
        uniqueStudents: 0,
      };
    }
  }

  const matchStage: any = {};

  if (academicYear) {
    matchStage.academicYear = academicYear;
  }

  if (date) {
    matchStage.date = date;
  }

  if (month) {
    matchStage.month = month;
  }

  if (studentIds.length > 0) {
    matchStage.student = { $in: studentIds };
  }

  const sortObj: any = {};
  sortObj[sortColumn] = sortDirection === 'asc' ? 1 : -1;

  let query = MealAttendance.find(matchStage)
    .populate('student', 'name nameBangla studentId studentClassRoll studentType className')
    .sort(sortObj);

  let totalCount = await MealAttendance.countDocuments(matchStage);
  query = query.skip(skip).limit(limit);
  let attendanceRecords = await query.lean();

  if (search && attendanceRecords.length > 0) {
    const searchRegex = new RegExp(search, 'i');
    attendanceRecords = attendanceRecords.filter(record => {
      const student = record.student as any;
      return (
        student?.name?.match(searchRegex) ||
        student?.nameBangla?.match(searchRegex) ||
        student?.studentId?.match(searchRegex) ||
        student?.studentClassRoll?.toString().match(searchRegex)
      );
    });
    totalCount = attendanceRecords.length;
  }

  const totalMeals = attendanceRecords.reduce((sum, record) => sum + (record.totalMeals || 0), 0);
  const totalCost = attendanceRecords.reduce((sum, record) => sum + (record.mealCost || 0), 0);
  const uniqueStudents = new Set(attendanceRecords.map(r => (r.student as any)?._id?.toString())).size;

  return {
    data: attendanceRecords,
    total: totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
    totalMeals,
    totalCost,
    uniqueStudents,
  };
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
  getStudentMealReport,
  getStudentWithMealHistory,
  getAllAttendanceRecords
};