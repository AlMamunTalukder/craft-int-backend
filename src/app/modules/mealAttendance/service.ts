/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import { MealAttendance } from './model';
import moment from 'moment';
import { Student } from '../student/student.model';
import mongoose, { Types } from 'mongoose';
import { IBulkAttendancePayload, IBulkGetQueryPayload, IBulkUpdateAttendancePayload, ICreateAttendancePayload } from './interface';

const MEAL_RATE = 55;

const calculateMealStats = (
  breakfast: boolean,
  lunch: boolean,
  dinner: boolean,
  mealRate: number = MEAL_RATE,
  isFreeMeal: boolean = false
) => {
  const totalMeals = [breakfast, lunch, dinner].filter(Boolean).length;
  const mealCost = isFreeMeal ? 0 : totalMeals * mealRate;
  return { totalMeals, mealCost };
};

const updateStudentMealAttendance = async (studentId: string, attendanceId: string, isDelete: boolean = false) => {
  try {
    if (isDelete) {
      await Student.findByIdAndUpdate(
        studentId,
        { $pull: { mealAttendances: attendanceId } }
      );
    } else {
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
    await updateStudentMealAttendance(student, result._id.toString(), false);
  }

  return result;
};

const bulkCreateAttendance = async (payload: IBulkAttendancePayload) => {
  const { attendances, academicYear } = payload;

  if (!attendances || !attendances.length) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No attendance data provided');
  }

  const bulkOperations = [];
  const newAttendanceIds: { studentId: string; attendanceId: string }[] = [];

  for (const att of attendances) {
    const date = moment(att.date).format('YYYY-MM-DD');
    const month = moment(att.date).format('YYYY-MM');
    const breakfast = att.breakfast || false;
    const lunch = att.lunch || false;
    const dinner = att.dinner || false;
    const isFreeMeal = att.isFreeMeal || false;

    const { totalMeals, mealCost } = calculateMealStats(breakfast, lunch, dinner, MEAL_RATE, isFreeMeal);

    const existingAttendance = await MealAttendance.findOne({
      student: new Types.ObjectId(att.studentId),
      date,
      academicYear,
    });

    const tempId = new Types.ObjectId();

    if (!existingAttendance) {
      newAttendanceIds.push({
        studentId: att.studentId,
        attendanceId: tempId.toString(),
      });
    }

    bulkOperations.push({
      updateOne: {
        filter: { student: new Types.ObjectId(att.studentId), date: new Date(date), academicYear },
        update: {
          $setOnInsert: { _id: tempId },
          $set: {
            student: new Types.ObjectId(att.studentId),
            date: new Date(date),
            month,
            academicYear,
            breakfast,
            lunch,
            dinner,
            totalMeals,
            mealCost,
            mealRate: MEAL_RATE,
            isFreeMeal: isFreeMeal,
            isHoliday: false,
            isAbsent: false,
          }
        },
        upsert: true,
      },
    });
  }

  const result = await MealAttendance.bulkWrite(bulkOperations);

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

// ============================================================
// ✅ UPDATED: getMonthlyAttendanceSheet — now Free-Meal aware
// ============================================================
const getMonthlyAttendanceSheet = async (className: string | undefined, month: string, academicYear: string) => {
  if (!month || !academicYear) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Month and Academic Year are required');
  }
  if (!moment(month, 'YYYY-MM', true).isValid()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid month format. Use YYYY-MM');
  }

  // 1. Get Students (All Classes or Specific Class)
  let students: any[];
  if (className) {
    students = await getStudentsByClassName(className);
  } else {
    students = await Student.find({
      admissionStatus: 'enrolled',
      status: 'active'
    }).select('_id studentId name nameBangla studentClassRoll studentType className class').lean();
  }

  if (!students.length) {
    return {
      month,
      academicYear,
      className: className || 'All Classes',
      dates: [],
      students: [],
      mealRate: MEAL_RATE,
      totalStudents: 0,
      grandTotalMeals: 0,
      grandTotalCost: 0,
      grandTotalBreakfast: 0,
      grandTotalLunch: 0,
      grandTotalDinner: 0,
      grandTotalFreeMeals: 0,
      grandTotalFreeMealCostSaved: 0,
      dailyTotals: []
    };
  }

  // 2. Fetch Attendance
  const attendances = await MealAttendance.find({ month, academicYear });

  // 3. Map for quick lookup
  const attendanceMap = new Map();
  attendances.forEach(att => {
    const key = `${att.student.toString()}_${moment(att.date).format('YYYY-MM-DD')}`;
    attendanceMap.set(key, att);
  });

  // 4. Generate Dates List
  const startDate = moment(`${month}-01`);
  const endDate = startDate.clone().endOf('month');
  const dates: string[] = [];
  const currentDate = startDate.clone();
  while (currentDate <= endDate) {
    dates.push(currentDate.format('YYYY-MM-DD'));
    currentDate.add(1, 'day');
  }

  // 5. Generate Sheet Data & Calculate Totals
  let grandTotalMeals = 0;
  let grandTotalCost = 0;
  let grandTotalBreakfast = 0;
  let grandTotalLunch = 0;
  let grandTotalDinner = 0;
  let grandTotalFreeMeals = 0;
  let grandTotalFreeMealCostSaved = 0;

  // Calculate Daily Totals (Daywise total for ALL classes)
  const dailyTotals = dates.map(date => {
    let totalMeals = 0;
    let totalCost = 0;
    let totalBreakfast = 0;
    let totalLunch = 0;
    let totalDinner = 0;
    let totalFreeMeals = 0;
    let freeMealCostSaved = 0;

    attendances.forEach(att => {
      if (moment(att.date).format('YYYY-MM-DD') === date) {
        const meals = att.totalMeals || 0;
        totalMeals += meals;

        if (att.isFreeMeal) {
          // Free meal -> not added to cost, but track count + what it would have cost
          totalFreeMeals += 1;
          freeMealCostSaved += meals * MEAL_RATE;
        } else {
          totalCost += att.mealCost || 0;
        }

        if (att.breakfast) totalBreakfast++;
        if (att.lunch) totalLunch++;
        if (att.dinner) totalDinner++;
      }
    });

    return {
      date,
      totalMeals,
      totalCost,
      totalBreakfast,
      totalLunch,
      totalDinner,
      totalFreeMeals,
      freeMealCostSaved,
      isWeekend: [0, 6].includes(moment(date).day()),
    };
  });

  // Accumulate Grand Totals
  dailyTotals.forEach(day => {
    grandTotalMeals += day.totalMeals;
    grandTotalCost += day.totalCost;
    grandTotalBreakfast += day.totalBreakfast;
    grandTotalLunch += day.totalLunch;
    grandTotalDinner += day.totalDinner;
    grandTotalFreeMeals += day.totalFreeMeals;
    grandTotalFreeMealCostSaved += day.freeMealCostSaved;
  });

  // 6. Generate Student-Specific Data
  const sheetData = students.map(student => {
    const studentAttendance = dates.map(date => {
      const key = `${student._id.toString()}_${date}`;
      const attendance = attendanceMap.get(key);
      const meals = attendance?.totalMeals || 0;
      const isFree = attendance?.isFreeMeal || false;

      return {
        date,
        breakfast: attendance?.breakfast || false,
        lunch: attendance?.lunch || false,
        dinner: attendance?.dinner || false,
        totalMeals: meals,
        // ✅ Free meal days cost 0 — use stored mealCost (which is already 0 if free)
        mealCost: isFree ? 0 : (attendance?.mealCost ?? meals * MEAL_RATE),
        isFreeMeal: isFree,
        isHoliday: attendance?.isHoliday || false,
        isAbsent: attendance?.isAbsent || false,
      };
    });

    const studentTotalMeals = studentAttendance.reduce((sum, day) => sum + day.totalMeals, 0);
    // ✅ Sum actual per-day cost (0 on free-meal days) instead of totalMeals * MEAL_RATE
    const studentMealCost = studentAttendance.reduce((sum, day) => sum + day.mealCost, 0);
    const studentFreeMealsCount = studentAttendance.filter(d => d.isFreeMeal).length;
    const studentFreeMealCostSaved = studentAttendance
      .filter(d => d.isFreeMeal)
      .reduce((sum, d) => sum + d.totalMeals * MEAL_RATE, 0);

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
      attendance: studentAttendance,
      totalMeals: studentTotalMeals,
      mealCost: studentMealCost,
      freeMealsCount: studentFreeMealsCount,
      freeMealCostSaved: studentFreeMealCostSaved,
    };
  });

  // 7. Return Full Response
  return {
    month,
    academicYear,
    className: className || 'All Classes',
    dates,
    students: sheetData,
    mealRate: MEAL_RATE,
    totalStudents: sheetData.length,
    grandTotalMeals,
    grandTotalCost,
    grandTotalBreakfast,
    grandTotalLunch,
    grandTotalDinner,
    grandTotalFreeMeals,
    grandTotalFreeMealCostSaved,
    dailyTotals,
  };
};

// ============================================================
// ✅ UPDATED: getMonthlySummary — Free-Meal aware
// ============================================================
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
      actualMealCost: student.mealCost, // already excludes free-meal days
      freeMealsCount: student.freeMealsCount,
      freeMealCostSaved: student.freeMealCostSaved,
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
  const totalFreeMeals = summary.reduce((sum, s) => sum + s.freeMealsCount, 0);
  const totalFreeMealCostSaved = summary.reduce((sum, s) => sum + s.freeMealCostSaved, 0);

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
      totalFreeMeals,
      totalFreeMealCostSaved,
      averageMealsPerStudent: (totalMeals / summary.length).toFixed(2),
      mealRate: MEAL_RATE,
    },
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
  const currentDate = startDateObj.clone();
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
}

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

const getAttendanceById = async (id: string) => {
  if (!id) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Attendance ID is required');
  }

  const attendance = await MealAttendance.findById(id)
    .populate('student', 'name nameBangla studentId studentClassRoll studentType className email mobile gender')
    .lean();

  if (!attendance) {
    throw new AppError(httpStatus.NOT_FOUND, 'Meal attendance not found');
  }

  const student = attendance.student as any;

  return {
    _id: attendance._id,
    student: {
      _id: student?._id,
      studentId: student?.studentId,
      name: student?.name,
      nameBangla: student?.nameBangla,
      roll: student?.studentClassRoll,
      studentType: student?.studentType,
      className: student?.className,
      email: student?.email,
      mobile: student?.mobile,
      gender: student?.gender,
    },
    date: attendance.date,
    month: attendance.month,
    academicYear: attendance.academicYear,
    breakfast: attendance.breakfast,
    lunch: attendance.lunch,
    dinner: attendance.dinner,
    totalMeals: attendance.totalMeals,
    mealCost: attendance.mealCost,
    mealRate: attendance.mealRate,
    isHoliday: attendance.isHoliday || false,
    isAbsent: attendance.isAbsent || false,
    remarks: attendance.remarks || '',
  };
};

const updateAttendance = async (id: string, payload: Partial<ICreateAttendancePayload>) => {
  if (!id) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Attendance ID is required');
  }

  const existingAttendance = await MealAttendance.findById(id);
  if (!existingAttendance) {
    throw new AppError(httpStatus.NOT_FOUND, 'Meal attendance not found');
  }

  const {
    student,
    date,
    academicYear,
    breakfast,
    lunch,
    dinner,
    mealRate = MEAL_RATE,
    remarks
  } = payload;

  if (student) {
    const studentExists = await Student.findById(student).select('_id studentId name className admissionStatus status');
    if (!studentExists) throw new AppError(httpStatus.NOT_FOUND, 'Student not found');
    if (studentExists.admissionStatus !== 'enrolled') throw new AppError(httpStatus.BAD_REQUEST, 'Student is not enrolled');
    if (studentExists.status !== 'active') throw new AppError(httpStatus.BAD_REQUEST, 'Student is not active');
  }

  const finalStudent = student || existingAttendance.student;
  const finalDate = date || existingAttendance.date;
  const finalAcademicYear = academicYear || existingAttendance.academicYear;
  const finalBreakfast = breakfast !== undefined ? breakfast : existingAttendance.breakfast;
  const finalLunch = lunch !== undefined ? lunch : existingAttendance.lunch;
  const finalDinner = dinner !== undefined ? dinner : existingAttendance.dinner;
  const finalRemarks = remarks !== undefined ? remarks : existingAttendance.remarks;

  const dateObj = moment(finalDate);
  const formattedDate = dateObj.format('YYYY-MM-DD');
  const month = dateObj.format('YYYY-MM');
  const { totalMeals, mealCost: calculatedMealCost } = calculateMealStats(
    finalBreakfast,
    finalLunch,
    finalDinner,
    mealRate
  );

  const updateData = {
    student: new Types.ObjectId(finalStudent as string),
    date: formattedDate,
    month,
    academicYear: finalAcademicYear,
    breakfast: finalBreakfast,
    lunch: finalLunch,
    dinner: finalDinner,
    totalMeals,
    mealCost: calculatedMealCost,
    mealRate,
    remarks: finalRemarks,
  };

  const result = await MealAttendance.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  }).populate('student', 'name nameBangla studentId studentClassRoll studentType className email mobile gender');

  return result;
};

const bulkUpdateAttendance = async (payload: IBulkUpdateAttendancePayload) => {
  const { updates } = payload;

  if (!updates || !updates.length) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No update data provided');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const results = {
      total: updates.length,
      modified: 0,
      failed: 0,
      details: [] as any[],
      errors: [] as any[]
    };

    for (const update of updates) {
      try {
        const { id, data } = update;

        const existingAttendance = await MealAttendance.findById(id).session(session);
        if (!existingAttendance) {
          results.failed++;
          results.errors.push({
            id,
            error: 'Attendance record not found'
          });
          continue;
        }

        const {
          student,
          date,
          academicYear,
          breakfast,
          lunch,
          dinner,
          mealRate = MEAL_RATE,
          remarks
        } = data;

        const finalStudent = student || existingAttendance.student.toString();
        const finalDate = date || existingAttendance.date;
        const finalAcademicYear = academicYear || existingAttendance.academicYear;
        const finalBreakfast = breakfast !== undefined ? breakfast : existingAttendance.breakfast;
        const finalLunch = lunch !== undefined ? lunch : existingAttendance.lunch;
        const finalDinner = dinner !== undefined ? dinner : existingAttendance.dinner;
        const finalRemarks = remarks !== undefined ? remarks : existingAttendance.remarks;

        if (student && student !== existingAttendance.student.toString()) {
          const studentExists = await Student.findById(student).session(session);
          if (!studentExists) {
            results.failed++;
            results.errors.push({
              id,
              error: 'Student not found'
            });
            continue;
          }
        }

        const dateObj = moment(finalDate);
        const formattedDate = dateObj.format('YYYY-MM-DD');
        const month = dateObj.format('YYYY-MM');
        const { totalMeals, mealCost: calculatedMealCost } = calculateMealStats(
          finalBreakfast,
          finalLunch,
          finalDinner,
          mealRate
        );

        const updateData = {
          student: new Types.ObjectId(finalStudent),
          date: formattedDate,
          month,
          academicYear: finalAcademicYear,
          breakfast: finalBreakfast,
          lunch: finalLunch,
          dinner: finalDinner,
          totalMeals,
          mealCost: calculatedMealCost,
          mealRate,
          remarks: finalRemarks,
        };

        const result = await MealAttendance.findByIdAndUpdate(id, updateData, {
          new: true,
          runValidators: true,
          session
        }).populate('student', 'name nameBangla studentId studentClassRoll studentType');

        results.modified++;
        results.details.push({
          id,
          success: true,
          data: result
        });

      } catch (error: any) {
        results.failed++;
        results.errors.push({
          id: update.id,
          error: error.message
        });
      }
    }

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      message: `Bulk update completed: ${results.modified} modified, ${results.failed} failed`,
      data: results
    };

  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

const bulkGetAttendance = async (query: IBulkGetQueryPayload) => {
  const {
    studentIds,
    classNames,
    startDate,
    endDate,
    month,
    academicYear,
    mealStatus = 'all',
    breakfast,
    lunch,
    dinner
  } = query;

  if (!academicYear) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Academic year is required');
  }

  const matchStage: any = { academicYear };

  if (studentIds && studentIds.length > 0) {
    matchStage.student = { $in: studentIds.map(id => new Types.ObjectId(id)) };
  }

  if (classNames && classNames.length > 0) {
    const { Class } = require('../class/class.model');
    const allClassIds: Types.ObjectId[] = [];

    for (const className of classNames) {
      const classes = await Class.find({ className });
      const classIds = classes.map((c: any) => c._id);
      allClassIds.push(...classIds);
    }

    if (allClassIds.length > 0) {
      const students = await Student.find({
        className: { $in: allClassIds },
        admissionStatus: 'enrolled',
        status: 'active'
      }).select('_id');

      const studentObjectIds = students.map(s => s._id);
      if (studentObjectIds.length > 0) {
        if (matchStage.student) {
          matchStage.student = { $in: [...matchStage.student.$in, ...studentObjectIds] };
        } else {
          matchStage.student = { $in: studentObjectIds };
        }
      }
    }
  }

  if (startDate && endDate) {
    const start = moment(startDate, 'YYYY-MM-DD');
    const end = moment(endDate, 'YYYY-MM-DD');

    if (!start.isValid() || !end.isValid()) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid date format. Use YYYY-MM-DD');
    }

    matchStage.date = {
      $gte: new Date(start.format('YYYY-MM-DD')),
      $lte: new Date(end.format('YYYY-MM-DD'))
    };
  }

  if (month) {
    if (!moment(month, 'YYYY-MM', true).isValid()) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid month format. Use YYYY-MM');
    }
    matchStage.month = month;
  }

  if (mealStatus === 'taken') {
    matchStage.totalMeals = { $gt: 0 };
  } else if (mealStatus === 'not_taken') {
    matchStage.totalMeals = 0;
  }

  if (breakfast !== undefined) matchStage.breakfast = breakfast;
  if (lunch !== undefined) matchStage.lunch = lunch;
  if (dinner !== undefined) matchStage.dinner = dinner;

  const attendances = await MealAttendance.find(matchStage)
    .populate('student', 'name nameBangla studentId studentClassRoll studentType className class email mobile')
    .sort({ date: 1, 'student.name': 1 });

  const groupedByStudent = new Map();

  attendances.forEach(attendance => {
    const studentId = (attendance.student as any)._id.toString();
    if (!groupedByStudent.has(studentId)) {
      groupedByStudent.set(studentId, {
        student: attendance.student,
        attendances: [],
        summary: {
          totalMeals: 0,
          totalCost: 0,
          totalBreakfast: 0,
          totalLunch: 0,
          totalDinner: 0,
          totalDays: 0,
          presentDays: 0
        }
      });
    }

    const studentData = groupedByStudent.get(studentId);
    studentData.attendances.push(attendance);
    studentData.summary.totalMeals += attendance.totalMeals;
    studentData.summary.totalCost += attendance.mealCost;
    studentData.summary.totalBreakfast += attendance.breakfast ? 1 : 0;
    studentData.summary.totalLunch += attendance.lunch ? 1 : 0;
    studentData.summary.totalDinner += attendance.dinner ? 1 : 0;
    studentData.summary.totalDays++;
    if (attendance.totalMeals > 0) {
      studentData.summary.presentDays++;
    }
  });

  const overallStats = {
    totalStudents: groupedByStudent.size,
    totalAttendanceRecords: attendances.length,
    totalMeals: attendances.reduce((sum, a) => sum + a.totalMeals, 0),
    totalCost: attendances.reduce((sum, a) => sum + a.mealCost, 0),
    totalBreakfast: attendances.filter(a => a.breakfast).length,
    totalLunch: attendances.filter(a => a.lunch).length,
    totalDinner: attendances.filter(a => a.dinner).length,
  };

  return {
    success: true,
    message: 'Bulk attendance data retrieved successfully',
    data: {
      query: {
        studentIds,
        classNames,
        dateRange: startDate && endDate ? { startDate, endDate } : undefined,
        month,
        academicYear,
        mealStatus,
        breakfast,
        lunch,
        dinner
      },
      overallStats,
      students: Array.from(groupedByStudent.values())
    }
  };
};

const bulkGetByDateRange = async (
  startDate: string,
  endDate: string,
  academicYear: string,
  page: number = 1,
  limit: number = 50,
  className?: string,
  studentType?: string
) => {
  if (!startDate || !endDate) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Start date and end date are required');
  }

  const start = moment(startDate, 'YYYY-MM-DD');
  const end = moment(endDate, 'YYYY-MM-DD');

  if (!start.isValid() || !end.isValid()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid date format. Use YYYY-MM-DD');
  }

  const studentFilter: any = {
    admissionStatus: 'enrolled',
    status: 'active'
  };

  if (className) {
    const { Class } = require('../class/class.model');
    const classes = await Class.find({ className });
    const classIds = classes.map((c: any) => c._id);
    if (classIds.length > 0) {
      studentFilter.className = { $in: classIds };
    } else {
      studentFilter.class = className;
    }
  }

  if (studentType) {
    studentFilter.studentType = studentType;
  }

  const students = await Student.find(studentFilter)
    .select('_id studentId name nameBangla studentClassRoll studentType className class')
    .lean();

  if (!students.length) {
    return {
      success: true,
      data: {
        students: [],
        totalStudents: 0,
        totalAttendanceRecords: 0,
        summary: {
          totalMeals: 0,
          totalCost: 0
        }
      }
    };
  }

  const formattedStartDate = start.format('YYYY-MM-DD');
  const formattedEndDate = end.format('YYYY-MM-DD');

  const attendances = await MealAttendance.find({
    student: { $in: students.map(s => s._id) },
    date: { $gte: formattedStartDate, $lte: formattedEndDate },
    academicYear
  }).sort({ date: 1 });

  const attendanceMap = new Map();
  attendances.forEach(att => {
    const key = `${att.student.toString()}_${att.date}`;
    attendanceMap.set(key, att);
  });

  const dateRange: string[] = [];
  const currentDate = start.clone();
  while (currentDate <= end) {
    dateRange.push(currentDate.format('YYYY-MM-DD'));
    currentDate.add(1, 'day');
  }

  const skip = (page - 1) * limit;
  const paginatedStudents = students.slice(skip, skip + limit);

  const result = paginatedStudents.map(student => {
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

  const totalMealsAll = students.reduce((sum, student) => {
    const key = student._id.toString();
    const studentAttendances = attendances.filter(a => a.student.toString() === key);
    return sum + studentAttendances.reduce((s, a) => s + a.totalMeals, 0);
  }, 0);

  const totalCostAll = students.reduce((sum, student) => {
    const key = student._id.toString();
    const studentAttendances = attendances.filter(a => a.student.toString() === key);
    return sum + studentAttendances.reduce((s, a) => s + a.mealCost, 0);
  }, 0);

  return {
    success: true,
    message: 'Bulk attendance by date range retrieved successfully',
    data: {
      dateRange: {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        totalDays: dateRange.length
      },
      academicYear,
      pagination: {
        page,
        limit,
        totalStudents: students.length,
        totalPages: Math.ceil(students.length / limit)
      },
      summary: {
        totalAttendanceRecords: attendances.length,
        totalMeals: totalMealsAll,
        totalCost: totalCostAll,
        averageMealsPerDay: (totalMealsAll / dateRange.length).toFixed(2)
      },
      students: result
    }
  };
};

const deleteMonthlyAttendance = async (
  className: string | undefined,
  month: string,
  academicYear: string
) => {
  if (!month || !academicYear) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Month and Academic Year are required');
  }

  let studentQuery: any = {
    admissionStatus: 'enrolled',
    status: 'active'
  };

  if (className && className !== 'ALL') {
    const classIds = await getClassIdsByClassName(className);
    if (classIds.length === 0) {
      throw new AppError(httpStatus.NOT_FOUND, 'Class not found');
    }
    studentQuery.className = { $in: classIds };
  }

  const students = await Student.find(studentQuery).select('_id');

  if (students.length === 0) {
    if (className && className !== 'ALL') {
      throw new AppError(httpStatus.NOT_FOUND, 'No active students found in this class');
    }
    throw new AppError(httpStatus.NOT_FOUND, 'No active students found');
  }

  const studentIds = students.map(s => s._id);

  const startDate = moment(month, 'YYYY-MM').startOf('month').startOf('day').toDate();
  const endDate = moment(month, 'YYYY-MM').endOf('month').endOf('day').toDate();

  const deleteResult = await MealAttendance.deleteMany({
    student: { $in: studentIds },
    date: { $gte: startDate, $lte: endDate },
    academicYear
  });

  if (deleteResult.deletedCount === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No attendance records found for this month');
  }

  return {
    deletedCount: deleteResult.deletedCount,
    message: `Successfully deleted ${deleteResult.deletedCount} records for ${className || 'All Classes'} in ${month}`
  };
};

export const mealAttendanceServices = {
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