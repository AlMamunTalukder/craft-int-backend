/* eslint-disable @typescript-eslint/no-explicit-any */

import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import { MealAttendance } from './model';
import moment from 'moment';
import { Student } from '../student/student.model';
import { Types } from 'mongoose';
import {
  IBulkAttendancePayload,
  ICreateAttendancePayload,
  PersonType,
} from './interface';
import {
  DEFAULT_BREAKFAST_RATE,
  DEFAULT_LUNCH_RATE,
  DEFAULT_DINNER_RATE,
  DEFAULT_MEAL_RATES,
} from './constants';


const calculateMealStats = (
  breakfast: boolean,
  lunch: boolean,
  dinner: boolean,
  breakfastRate = DEFAULT_BREAKFAST_RATE,
  lunchRate = DEFAULT_LUNCH_RATE,
  dinnerRate = DEFAULT_DINNER_RATE,
  isFreeMeal = false,
) => {
  const totalMeals = [breakfast, lunch, dinner].filter(Boolean).length;

  const grossCost =
    (breakfast ? breakfastRate : 0) +
    (lunch ? lunchRate : 0) +
    (dinner ? dinnerRate : 0);

  const mealCost = isFreeMeal ? 0 : grossCost;
  const freeMealCostSaved = isFreeMeal ? grossCost : 0;

  return { totalMeals, mealCost, grossCost, freeMealCostSaved };
};


const getRecordCosts = (att: any) => {
  const breakfast = !!att?.breakfast;
  const lunch = !!att?.lunch;
  const dinner = !!att?.dinner;
  const isFreeMeal = !!att?.isFreeMeal;

  const breakfastRate = att?.breakfastRate ?? DEFAULT_BREAKFAST_RATE;
  const lunchRate = att?.lunchRate ?? DEFAULT_LUNCH_RATE;
  const dinnerRate = att?.dinnerRate ?? DEFAULT_DINNER_RATE;

  const totalMeals = [breakfast, lunch, dinner].filter(Boolean).length;

  const grossCost =
    (breakfast ? breakfastRate : 0) +
    (lunch ? lunchRate : 0) +
    (dinner ? dinnerRate : 0);

  const mealCost = isFreeMeal ? 0 : grossCost;
  const freeMealCostSaved = isFreeMeal ? grossCost : 0;

  return { totalMeals, grossCost, mealCost, freeMealCostSaved };
};

/** Lazily require model to avoid circular deps */
const getTeacherModel = () => require('../teacher/teacher.model').Teacher;
const getStaffModel = () => require('../staff/staff.model').Staff;


const resolvePersonModel = (personType: PersonType) => {
  switch (personType) {
    case 'teacher':
      return { PersonModel: getTeacherModel(), field: 'teacher' as const };
    case 'staff':
      return { PersonModel: getStaffModel(), field: 'staff' as const };
    default:
      return { PersonModel: Student, field: 'student' as const };
  }
};

const validatePerson = async (personId: string, personType: PersonType) => {
  const { PersonModel } = resolvePersonModel(personType);
  const person = await PersonModel.findById(personId).select('_id name status admissionStatus').lean();
  if (!person) {
    throw new AppError(httpStatus.NOT_FOUND, `${personType} not found`);
  }
  if (personType === 'student') {
    if ((person as any).admissionStatus !== 'enrolled')
      throw new AppError(httpStatus.BAD_REQUEST, 'Student is not enrolled');
    if ((person as any).status !== 'active')
      throw new AppError(httpStatus.BAD_REQUEST, 'Student is not active');
  } else {
    if ((person as any).status && (person as any).status !== 'Active')
      throw new AppError(httpStatus.BAD_REQUEST, `${personType} is not active`);
  }
  return person;
};

const buildPersonFilter = (personId: string, personType: PersonType) => {
  const { field } = resolvePersonModel(personType);
  return { [field]: new Types.ObjectId(personId), personType };
};

const buildPersonSet = (personId: string, personType: PersonType) => {
  const { field } = resolvePersonModel(personType);
  return { [field]: new Types.ObjectId(personId), personType };
};

const getPopulatePath = (personType: PersonType) => {
  switch (personType) {
    case 'teacher': return 'teacher';
    case 'staff': return 'staff';
    default: return 'student';
  }
};

const getClassIdsByClassName = async (className: string): Promise<Types.ObjectId[]> => {
  try {
    const { Class } = require('../class/class.model');
    const classes = await Class.find({ className });
    return classes.map((c: any) => c._id);
  } catch {
    return [];
  }
};

const getStudentsByClassName = async (className?: string): Promise<any[]> => {
  const query: any = { admissionStatus: 'enrolled', status: 'active' };
  if (className) {
    const classIds = await getClassIdsByClassName(className);
    if (classIds.length > 0) query.className = { $in: classIds };
    else query.class = className;
  }
  return Student.find(query)
    .select('_id studentId name nameBangla studentClassRoll studentType className class')
    .lean();
};

const getAllActiveTeachers = async (): Promise<any[]> => {
  const Teacher = getTeacherModel();
  return Teacher.find({ status: 'Active' })
    .select('_id teacherId name phone email designation department staffType')
    .lean();
};

const getAllActiveStaff = async (): Promise<any[]> => {
  const StaffModel = getStaffModel();
  return StaffModel.find({ status: 'Active' })
    .select('_id staffId name phone email staffDepartment designation')
    .lean();
};

const normaliseTeacher = (t: any) => ({
  _id: t._id,
  personId: t.teacherId,
  name: t.name,
  nameBangla: t.nameBangla || '',
  roll: t.teacherId,
  type: t.staffType || 'Teacher',
  department: t.department || '',
});

const normaliseStaff = (s: any) => ({
  _id: s._id,
  personId: s.staffId,
  name: s.name,
  nameBangla: s.nameBangla || '',
  roll: s.staffId,
  type: 'Staff',
  department: s.staffDepartment || '',
});

const normaliseStudent = (s: any) => ({
  _id: s._id,
  personId: s.studentId,
  name: s.name,
  nameBangla: s.nameBangla || '',
  roll: s.studentClassRoll,
  type: s.studentType || 'Student',
  department: '',
});

// ─────────────────────────────────────────────
// Relation sync
// ─────────────────────────────────────────────

const syncPersonMealAttendances = async (
  persons: { personId: string; personType: PersonType }[],
) => {
  if (!persons.length) return;

  const grouped: Record<PersonType, Set<string>> = {
    student: new Set(),
    teacher: new Set(),
    staff: new Set(),
  };

  persons.forEach(({ personId, personType }) => {
    if (grouped[personType]) grouped[personType].add(personId);
  });

  for (const personType of Object.keys(grouped) as PersonType[]) {
    const ids = Array.from(grouped[personType]);
    if (!ids.length) continue;

    const { PersonModel, field } = resolvePersonModel(personType);

    const attendances = await MealAttendance.find({
      personType: personType,
      [field]: { $in: ids.map(id => new Types.ObjectId(id)) },
    }).select(`_id ${field}`);

    const personAttendanceMap = new Map<string, Types.ObjectId[]>();

    attendances.forEach((att: any) => {
      const pid = att[field]?.toString();
      if (pid) {
        if (!personAttendanceMap.has(pid)) {
          personAttendanceMap.set(pid, []);
        }
        personAttendanceMap.get(pid)!.push(att._id);
      }
    });

    const bulkOps = ids.map(personId => {
      const attendanceIds = personAttendanceMap.get(personId) || [];
      return {
        updateOne: {
          filter: { _id: new Types.ObjectId(personId) },
          update: { $set: { mealAttendances: attendanceIds } },
        },
      };
    });

    if (bulkOps.length > 0) {
      await PersonModel.bulkWrite(bulkOps);
    }
  }
};

// ─────────────────────────────────────────────
// Bulk Create / Upsert
// ─────────────────────────────────────────────

const bulkCreateAttendance = async (payload: IBulkAttendancePayload) => {
  const { attendances, academicYear } = payload;
  if (!attendances?.length) throw new AppError(httpStatus.BAD_REQUEST, 'No attendance data provided');

  const bulkOperations: any[] = [];
  const touchedPersons = new Map<string, { personId: string; personType: PersonType }>();

  for (const att of attendances) {
    const personType: PersonType = att.personType || 'student';
    const personId = att.personId;
    const date = moment(att.date).format('YYYY-MM-DD');
    const month = moment(att.date).format('YYYY-MM');
    const breakfast = att.breakfast || false;
    const lunch = att.lunch || false;
    const dinner = att.dinner || false;
    const isFreeMeal = att.isFreeMeal || false;

    // ── KEY FIX: always use the rates sent from the frontend.
    // The frontend now always sends breakfastRate/lunchRate/dinnerRate
    // (equal to mealRates which is customRates ?? apiMealRates).
    // Fall back to defaults only if somehow missing.
    const breakfastRate = att.breakfastRate ?? DEFAULT_BREAKFAST_RATE;
    const lunchRate = att.lunchRate ?? DEFAULT_LUNCH_RATE;
    const dinnerRate = att.dinnerRate ?? DEFAULT_DINNER_RATE;

    const { totalMeals, mealCost, grossCost, freeMealCostSaved } = calculateMealStats(
      breakfast, lunch, dinner, breakfastRate, lunchRate, dinnerRate, isFreeMeal,
    );

    const personFilter = buildPersonFilter(personId, personType);
    const personSet = buildPersonSet(personId, personType);

    bulkOperations.push({
      updateOne: {
        filter: { ...personFilter, date: new Date(date), academicYear },
        update: {
          $set: {
            ...personSet,
            date: new Date(date),
            month,
            academicYear,
            breakfast,
            lunch,
            dinner,
            totalMeals,
            breakfastRate,
            lunchRate,
            dinnerRate,
            mealCost,
            grossCost,
            freeMealCostSaved,
            isFreeMeal,
            isHoliday: false,
            isAbsent: false,
          },
        },
        upsert: true,
      },
    });

    touchedPersons.set(`${personType}_${personId}`, { personId, personType });
  }

  const result = await MealAttendance.bulkWrite(bulkOperations);

  await syncPersonMealAttendances(Array.from(touchedPersons.values()));

  return {
    modifiedCount: result.modifiedCount,
    upsertedCount: result.upsertedCount,
    matchedCount: result.matchedCount,
    totalProcessed: attendances.length,
  };
};

// ─────────────────────────────────────────────
// Get by ID
// ─────────────────────────────────────────────

const getAttendanceById = async (id: string) => {
  if (!id) throw new AppError(httpStatus.BAD_REQUEST, 'Attendance ID is required');

  const attendance = await MealAttendance.findById(id).lean();
  if (!attendance) throw new AppError(httpStatus.NOT_FOUND, 'Meal attendance not found');

  let personData: any = null;
  if (attendance.personType === 'teacher' && attendance.teacher) {
    const Teacher = getTeacherModel();
    personData = await Teacher.findById(attendance.teacher)
      .select('_id teacherId name nameBangla designation department staffType')
      .lean();
  } else if (attendance.personType === 'staff' && attendance.staff) {
    const StaffModel = getStaffModel();
    personData = await StaffModel.findById(attendance.staff)
      .select('_id staffId name nameBangla staffDepartment')
      .lean();
  } else if (attendance.student) {
    personData = await Student.findById(attendance.student)
      .select('_id studentId name nameBangla studentClassRoll studentType className email mobile gender')
      .lean();
  }

  const breakfastRate = attendance.breakfastRate ?? DEFAULT_BREAKFAST_RATE;
  const lunchRate = attendance.lunchRate ?? DEFAULT_LUNCH_RATE;
  const dinnerRate = attendance.dinnerRate ?? DEFAULT_DINNER_RATE;

  const { totalMeals, grossCost, mealCost, freeMealCostSaved } = getRecordCosts(attendance);

  return {
    _id: attendance._id,
    personType: attendance.personType,
    person: personData,
    student: attendance.personType === 'student' ? personData : null,
    date: attendance.date,
    month: attendance.month,
    academicYear: attendance.academicYear,
    breakfast: attendance.breakfast,
    lunch: attendance.lunch,
    dinner: attendance.dinner,
    totalMeals,
    breakfastRate,
    lunchRate,
    dinnerRate,
    mealCost,
    grossCost,
    freeMealCostSaved,
    isFreeMeal: attendance.isFreeMeal || false,
    isHoliday: attendance.isHoliday || false,
    isAbsent: attendance.isAbsent || false,
    remarks: attendance.remarks || '',
  };
};

// ─────────────────────────────────────────────
// Update single record
// ─────────────────────────────────────────────

const updateAttendance = async (id: string, payload: Partial<ICreateAttendancePayload>) => {
  if (!id) throw new AppError(httpStatus.BAD_REQUEST, 'Attendance ID is required');

  const existing = await MealAttendance.findById(id);
  if (!existing) throw new AppError(httpStatus.NOT_FOUND, 'Meal attendance not found');

  const breakfast = payload.breakfast !== undefined ? payload.breakfast : existing.breakfast;
  const lunch = payload.lunch !== undefined ? payload.lunch : existing.lunch;
  const dinner = payload.dinner !== undefined ? payload.dinner : existing.dinner;
  const isFreeMeal = payload.isFreeMeal !== undefined ? payload.isFreeMeal : existing.isFreeMeal;

  const breakfastRate = payload.breakfastRate ?? existing.breakfastRate ?? DEFAULT_BREAKFAST_RATE;
  const lunchRate = payload.lunchRate ?? existing.lunchRate ?? DEFAULT_LUNCH_RATE;
  const dinnerRate = payload.dinnerRate ?? existing.dinnerRate ?? DEFAULT_DINNER_RATE;

  const { totalMeals, mealCost, grossCost, freeMealCostSaved } = calculateMealStats(
    breakfast, lunch, dinner, breakfastRate, lunchRate, dinnerRate, isFreeMeal,
  );

  const dateStr = payload.date || existing.date?.toString();
  const formattedDate = moment(dateStr).format('YYYY-MM-DD');
  const month = moment(dateStr).format('YYYY-MM');

  const result = await MealAttendance.findByIdAndUpdate(
    id,
    {
      date: formattedDate,
      month,
      academicYear: payload.academicYear || existing.academicYear,
      breakfast,
      lunch,
      dinner,
      isFreeMeal,
      totalMeals,
      breakfastRate,
      lunchRate,
      dinnerRate,
      mealCost,
      grossCost,
      freeMealCostSaved,
      remarks: payload.remarks !== undefined ? payload.remarks : existing.remarks,
    },
    { new: true, runValidators: true },
  );

  return result;
};

// ─────────────────────────────────────────────
// Delete single record
// ─────────────────────────────────────────────

const deleteAttendance = async (id: string) => {
  const attendance = await MealAttendance.findById(id);
  if (!attendance) throw new AppError(httpStatus.NOT_FOUND, 'Meal attendance not found');

  const deleted = await MealAttendance.findByIdAndDelete(id);

  const { PersonModel, field } = resolvePersonModel(attendance.personType);
  const personId = (attendance as any)[field];
  if (personId) {
    await PersonModel.updateOne({ _id: personId }, { $pull: { mealAttendances: attendance._id } });
  }

  return deleted;
};

// ─────────────────────────────────────────────
// Monthly Sheet
// ─────────────────────────────────────────────

const getMonthlyAttendanceSheet = async (
  personType: PersonType = 'student',
  month: string,
  academicYear: string,
  className?: string,
) => {
  if (!month || !academicYear)
    throw new AppError(httpStatus.BAD_REQUEST, 'Month and Academic Year are required');
  if (!moment(month, 'YYYY-MM', true).isValid())
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid month format. Use YYYY-MM');

  // 1. Fetch persons list
  let persons: any[] = [];
  let normalise: (p: any) => any;

  if (personType === 'teacher') {
    persons = await getAllActiveTeachers();
    normalise = normaliseTeacher;
  } else if (personType === 'staff') {
    persons = await getAllActiveStaff();
    normalise = normaliseStaff;
  } else {
    persons = await getStudentsByClassName(className);
    normalise = normaliseStudent;
  }

  if (!persons.length) {
    return emptySheet(month, academicYear, personType);
  }

  // 2. Fetch attendance records for this person type + month
  const personField = personType === 'teacher' ? 'teacher' : personType === 'staff' ? 'staff' : 'student';
  const attendances = await MealAttendance.find({ personType, month, academicYear }).lean();

  // 3. Build lookup map: personId_date → record
  const attendanceMap = new Map<string, any>();
  attendances.forEach(att => {
    const pid = (att[personField] as Types.ObjectId)?.toString();
    const dateKey = moment(att.date).format('YYYY-MM-DD');
    if (pid) attendanceMap.set(`${pid}_${dateKey}`, att);
  });

  // 4. Generate date list for the month
  const dates = generateMonthDates(month);

  // ── KEY FIX: derive mealRates from actual saved DB records instead of
  // always returning DEFAULT_MEAL_RATES. This lets the frontend show the
  // correct rates after a save with custom rates.
  // We pick the most recent attendance record that has non-zero rates.
  const sampleAtt = attendances.find(
    a =>
      (a.breakfastRate && a.breakfastRate !== DEFAULT_BREAKFAST_RATE) ||
      (a.lunchRate && a.lunchRate !== DEFAULT_LUNCH_RATE) ||
      (a.dinnerRate && a.dinnerRate !== DEFAULT_DINNER_RATE),
  ) || attendances[0];

  const effectiveMealRates = {
    breakfast: sampleAtt?.breakfastRate ?? DEFAULT_MEAL_RATES.breakfast,
    lunch: sampleAtt?.lunchRate ?? DEFAULT_MEAL_RATES.lunch,
    dinner: sampleAtt?.dinnerRate ?? DEFAULT_MEAL_RATES.dinner,
  };

  // 5. Build per-person rows
  let grandTotalMeals = 0;
  let grandTotalGrossCost = 0;
  let grandTotalCost = 0;
  let grandTotalBreakfast = 0, grandTotalLunch = 0, grandTotalDinner = 0;
  let grandTotalFreeMeals = 0, grandTotalFreeMealCostSaved = 0;

  const AVERAGE_MEAL_RATE = (DEFAULT_BREAKFAST_RATE + DEFAULT_LUNCH_RATE + DEFAULT_DINNER_RATE) / 3;
  const isNonPayingType = personType === 'teacher' || personType === 'staff';

  const dailyTotals = dates.map(date => {
    let tMeals = 0, tGross = 0, tCost = 0, tB = 0, tL = 0, tD = 0, tFree = 0, tFreeSaved = 0;

    attendances.forEach(att => {
      if (moment(att.date).format('YYYY-MM-DD') === date) {
        const { totalMeals: recordMeals, grossCost: recordGross } = getRecordCosts(att);
        tMeals += recordMeals;
        tGross += recordGross;
        if (att.isFreeMeal) tFree++;
        if (att.breakfast) tB++;
        if (att.lunch) tL++;
        if (att.dinner) tD++;
      }
    });

    if (isNonPayingType) {
      tCost = 0;
      tFreeSaved = tGross;
    } else {
      tFreeSaved = tFree * AVERAGE_MEAL_RATE;
      tCost = tGross - tFreeSaved;
    }

    return {
      date,
      totalMeals: tMeals,
      grossCost: tGross,
      totalCost: tCost,
      totalBreakfast: tB,
      totalLunch: tL,
      totalDinner: tD,
      totalFreeMeals: tFree,
      freeMealCostSaved: tFreeSaved,
      isWeekend: [0, 6].includes(moment(date).day()),
    };
  });

  dailyTotals.forEach(d => {
    grandTotalMeals += d.totalMeals;
    grandTotalGrossCost += d.grossCost;
    grandTotalCost += d.totalCost;
    grandTotalBreakfast += d.totalBreakfast;
    grandTotalLunch += d.totalLunch;
    grandTotalDinner += d.totalDinner;
    grandTotalFreeMeals += d.totalFreeMeals;
    grandTotalFreeMealCostSaved += d.freeMealCostSaved;
  });

  const sheetData = persons.map(person => {
    const norm = normalise(person);
    const pid = person._id.toString();

    const attendance = dates.map(date => {
      const att = attendanceMap.get(`${pid}_${date}`);
      const breakfast = att?.breakfast || false;
      const lunch = att?.lunch || false;
      const dinner = att?.dinner || false;
      const meals = [breakfast, lunch, dinner].filter(Boolean).length;
      const isFree = att?.isFreeMeal || false;

      const breakfastRate = att?.breakfastRate ?? DEFAULT_BREAKFAST_RATE;
      const lunchRate = att?.lunchRate ?? DEFAULT_LUNCH_RATE;
      const dinnerRate = att?.dinnerRate ?? DEFAULT_DINNER_RATE;

      const { grossCost, mealCost, freeMealCostSaved } = getRecordCosts(att || {});

      return {
        date,
        breakfast,
        lunch,
        dinner,
        totalMeals: meals,
        breakfastRate,
        lunchRate,
        dinnerRate,
        grossCost,
        mealCost,
        freeMealCostSaved,
        isFreeMeal: isFree,
        isHoliday: att?.isHoliday || false,
        isAbsent: att?.isAbsent || false,
      };
    });

    const totalMeals = attendance.reduce((s, d) => s + d.totalMeals, 0);
    const grossCost = attendance.reduce((s, d) => s + d.grossCost, 0);
    const freeMealsCount = attendance.filter(d => d.isFreeMeal).length;

    let mealCost = 0;
    let freeMealCostSaved = 0;

    if (isNonPayingType) {
      mealCost = 0;
      freeMealCostSaved = grossCost;
    } else {
      const personFreeSaved = freeMealsCount * AVERAGE_MEAL_RATE;
      mealCost = grossCost - personFreeSaved;
      freeMealCostSaved = personFreeSaved;
    }

    return {
      person: { id: person._id, ...norm },
      student: personType === 'student' ? { id: person._id, ...norm } : null,
      attendance,
      totalMeals,
      grossCost,
      mealCost,
      freeMealsCount,
      freeMealCostSaved,
    };
  });

  return {
    month,
    academicYear,
    personType,
    className: personType === 'student' ? (className || 'All Classes') : undefined,
    dates,
    students: sheetData,
    persons: sheetData,
    // ── Returns actual saved rates so the frontend displays them correctly
    mealRates: effectiveMealRates,
    totalStudents: sheetData.length,
    grandTotalMeals,
    grandTotalGrossCost,
    grandTotalCost,
    grandTotalBreakfast,
    grandTotalLunch,
    grandTotalDinner,
    grandTotalFreeMeals,
    grandTotalFreeMealCostSaved,
    dailyTotals,
  };
};

// ─────────────────────────────────────────────
// Combined Monthly Sheet — Student + Teacher + Staff totals merged
// ─────────────────────────────────────────────

const getCombinedMonthlySheet = async (
  month: string,
  academicYear: string,
  className?: string, // only applied to the student portion
) => {
  if (!month || !academicYear)
    throw new AppError(httpStatus.BAD_REQUEST, 'Month and Academic Year are required');
  if (!moment(month, 'YYYY-MM', true).isValid())
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid month format. Use YYYY-MM');

  // Fetch all three sheets in parallel (className only matters for students)
  const [studentSheet, teacherSheet, staffSheet] = await Promise.all([
    getMonthlyAttendanceSheet('student', month, academicYear, className),
    getMonthlyAttendanceSheet('teacher', month, academicYear),
    getMonthlyAttendanceSheet('staff', month, academicYear),
  ]);

  const dates = generateMonthDates(month);

  // ── Merge daily totals across the three person types ──
  const dailyTotals = dates.map(date => {
    const sFind = studentSheet.dailyTotals.find(d => d.date === date);
    const tFind = teacherSheet.dailyTotals.find(d => d.date === date);
    const fFind = staffSheet.dailyTotals.find(d => d.date === date);

    const pick = (d: any, key: string) => d?.[key] || 0;

    return {
      date,
      totalMeals: pick(sFind, 'totalMeals') + pick(tFind, 'totalMeals') + pick(fFind, 'totalMeals'),
      grossCost: pick(sFind, 'grossCost') + pick(tFind, 'grossCost') + pick(fFind, 'grossCost'),
      totalCost: pick(sFind, 'totalCost') + pick(tFind, 'totalCost') + pick(fFind, 'totalCost'),
      totalBreakfast: pick(sFind, 'totalBreakfast') + pick(tFind, 'totalBreakfast') + pick(fFind, 'totalBreakfast'),
      totalLunch: pick(sFind, 'totalLunch') + pick(tFind, 'totalLunch') + pick(fFind, 'totalLunch'),
      totalDinner: pick(sFind, 'totalDinner') + pick(tFind, 'totalDinner') + pick(fFind, 'totalDinner'),
      totalFreeMeals: pick(sFind, 'totalFreeMeals') + pick(tFind, 'totalFreeMeals') + pick(fFind, 'totalFreeMeals'),
      freeMealCostSaved: pick(sFind, 'freeMealCostSaved') + pick(tFind, 'freeMealCostSaved') + pick(fFind, 'freeMealCostSaved'),
      isWeekend: [0, 6].includes(moment(date).day()),
      // Per-type breakdown for that single day (handy for tooltips / drilldown)
      breakdown: {
        student: { totalMeals: pick(sFind, 'totalMeals'), totalCost: pick(sFind, 'totalCost') },
        teacher: { totalMeals: pick(tFind, 'totalMeals'), totalCost: pick(tFind, 'totalCost') },
        staff: { totalMeals: pick(fFind, 'totalMeals'), totalCost: pick(fFind, 'totalCost') },
      },
    };
  });

  // ── Merge grand totals ──
  const grandTotalMeals = studentSheet.grandTotalMeals + teacherSheet.grandTotalMeals + staffSheet.grandTotalMeals;
  const grandTotalGrossCost = studentSheet.grandTotalGrossCost + teacherSheet.grandTotalGrossCost + staffSheet.grandTotalGrossCost;
  const grandTotalCost = studentSheet.grandTotalCost + teacherSheet.grandTotalCost + staffSheet.grandTotalCost;
  const grandTotalBreakfast = studentSheet.grandTotalBreakfast + teacherSheet.grandTotalBreakfast + staffSheet.grandTotalBreakfast;
  const grandTotalLunch = studentSheet.grandTotalLunch + teacherSheet.grandTotalLunch + staffSheet.grandTotalLunch;
  const grandTotalDinner = studentSheet.grandTotalDinner + teacherSheet.grandTotalDinner + staffSheet.grandTotalDinner;
  const grandTotalFreeMeals = studentSheet.grandTotalFreeMeals + teacherSheet.grandTotalFreeMeals + staffSheet.grandTotalFreeMeals;
  const grandTotalFreeMealCostSaved = studentSheet.grandTotalFreeMealCostSaved + teacherSheet.grandTotalFreeMealCostSaved + staffSheet.grandTotalFreeMealCostSaved;

  // ── Today's snapshot (merged) ──
  const todayDate = moment().format('YYYY-MM-DD');
  const todayEntry = dailyTotals.find(d => d.date === todayDate) || null;

  // ── Per-type summary cards (so the frontend can still show "Students: 120 meals" etc. inside the combined view) ──
  const byPersonType = {
    student: {
      totalPersons: studentSheet.totalStudents,
      totalMeals: studentSheet.grandTotalMeals,
      totalBreakfast: studentSheet.grandTotalBreakfast,
      totalLunch: studentSheet.grandTotalLunch,
      totalDinner: studentSheet.grandTotalDinner,
      totalFreeMeals: studentSheet.grandTotalFreeMeals,
      grossCost: studentSheet.grandTotalGrossCost,
      freeMealCostSaved: studentSheet.grandTotalFreeMealCostSaved,
      payableCost: studentSheet.grandTotalCost,
    },
    teacher: {
      totalPersons: teacherSheet.totalStudents,
      totalMeals: teacherSheet.grandTotalMeals,
      totalBreakfast: teacherSheet.grandTotalBreakfast,
      totalLunch: teacherSheet.grandTotalLunch,
      totalDinner: teacherSheet.grandTotalDinner,
      totalFreeMeals: teacherSheet.grandTotalFreeMeals,
      grossCost: teacherSheet.grandTotalGrossCost,
      freeMealCostSaved: teacherSheet.grandTotalFreeMealCostSaved,
      payableCost: teacherSheet.grandTotalCost,
    },
    staff: {
      totalPersons: staffSheet.totalStudents,
      totalMeals: staffSheet.grandTotalMeals,
      totalBreakfast: staffSheet.grandTotalBreakfast,
      totalLunch: staffSheet.grandTotalLunch,
      totalDinner: staffSheet.grandTotalDinner,
      totalFreeMeals: staffSheet.grandTotalFreeMeals,
      grossCost: staffSheet.grandTotalGrossCost,
      freeMealCostSaved: staffSheet.grandTotalFreeMealCostSaved,
      payableCost: staffSheet.grandTotalCost,
    },
  };

  const totalPersons = studentSheet.totalStudents + teacherSheet.totalStudents + staffSheet.totalStudents;

  return {
    month,
    academicYear,
    className: className || 'All Classes',
    dates,
    totalPersons,
    grandTotalMeals,
    grandTotalGrossCost,
    grandTotalCost,
    grandTotalBreakfast,
    grandTotalLunch,
    grandTotalDinner,
    grandTotalFreeMeals,
    grandTotalFreeMealCostSaved,
    dailyTotals,
    today: todayEntry,
    byPersonType,
    // Individual mealRates per type, in case rates differ across types
    mealRates: {
      student: studentSheet.mealRates,
      teacher: teacherSheet.mealRates,
      staff: staffSheet.mealRates,
    },
  };
};

// ─────────────────────────────────────────────
// List / Report helpers
// ─────────────────────────────────────────────

const getAllAttendanceRecords = async (
  page = 1,
  limit = 10,
  search = '',
  personType: PersonType = 'student',
  date = '',
  month = '',
  academicYear: string,
  sortColumn = 'date',
  sortDirection: 'asc' | 'desc' = 'desc',
  className = '',
) => {
  const skip = (page - 1) * limit;
  const matchStage: any = { academicYear, personType };
  if (date) matchStage.date = date;
  if (month) matchStage.month = month;

  if (personType === 'student' && className) {
    const { Class } = require('../class/class.model');
    const classes = await Class.find({ className });
    const classIds = classes.map((c: any) => c._id);
    const students = await Student.find({ className: { $in: classIds }, admissionStatus: 'enrolled', status: 'active' }).select('_id');
    if (!students.length) return { data: [], total: 0, page, limit, totalPages: 0, totalMeals: 0, totalCost: 0, totalGrossCost: 0, totalFreeMealCostSaved: 0, uniquePersons: 0 };
    matchStage.student = { $in: students.map(s => s._id) };
  }

  const populatePath = getPopulatePath(personType);
  const populateFields = personType === 'student'
    ? 'name nameBangla studentId studentClassRoll studentType className'
    : personType === 'teacher'
      ? 'name nameBangla teacherId designation department'
      : 'name nameBangla staffId staffDepartment';

  const sortObj: any = {};
  sortObj[sortColumn] = sortDirection === 'asc' ? 1 : -1;

  let records = await MealAttendance.find(matchStage)
    .populate(populatePath, populateFields)
    .sort(sortObj)
    .skip(skip)
    .limit(limit)
    .lean();

  let total = await MealAttendance.countDocuments(matchStage);

  if (search) {
    const rx = new RegExp(search, 'i');
    records = records.filter(r => {
      const p = (r as any)[populatePath];
      return p?.name?.match(rx) || p?.nameBangla?.match(rx);
    });
    total = records.length;
  }

  const recordsWithCosts = records.map(r => {
    const { totalMeals, grossCost, mealCost, freeMealCostSaved } = getRecordCosts(r);

    let finalMealCost = mealCost;
    let finalFreeSaved = freeMealCostSaved;

    if (personType === 'teacher' || personType === 'staff') {
      finalMealCost = 0;
      finalFreeSaved = grossCost;
    }

    return { ...r, totalMeals, grossCost, mealCost: finalMealCost, freeMealCostSaved: finalFreeSaved };
  });

  const totalMeals = recordsWithCosts.reduce((s, r) => s + (r.totalMeals || 0), 0);
  const totalCost = recordsWithCosts.reduce((s, r) => s + r.mealCost, 0);
  const totalGrossCost = recordsWithCosts.reduce((s, r) => s + r.grossCost, 0);
  const totalFreeMealCostSaved = recordsWithCosts.reduce((s, r) => s + r.freeMealCostSaved, 0);
  const uniquePersons = new Set(records.map(r => (r as any)[populatePath]?._id?.toString())).size;

  return {
    data: recordsWithCosts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    totalMeals,
    totalCost,
    totalGrossCost,
    totalFreeMealCostSaved,
    uniquePersons,
  };
};

// ─────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────

const generateMonthDates = (month: string): string[] => {
  const dates: string[] = [];
  const cur = moment(`${month}-01`);
  const end = cur.clone().endOf('month');
  while (cur <= end) { dates.push(cur.format('YYYY-MM-DD')); cur.add(1, 'day'); }
  return dates;
};

const emptySheet = (month: string, academicYear: string, personType: PersonType) => ({
  month, academicYear, personType,
  dates: [], students: [], persons: [],
  mealRates: DEFAULT_MEAL_RATES, totalStudents: 0,
  grandTotalMeals: 0, grandTotalGrossCost: 0, grandTotalCost: 0,
  grandTotalBreakfast: 0, grandTotalLunch: 0, grandTotalDinner: 0,
  grandTotalFreeMeals: 0, grandTotalFreeMealCostSaved: 0,
  dailyTotals: [],
});

// ─────────────────────────────────────────────
// Legacy: student-only helpers
// ─────────────────────────────────────────────

const getAttendanceByStudentAndMonth = async (studentId: string, month: string, academicYear: string) => {
  const student = await Student.findById(studentId).select('_id studentId name nameBangla studentClassRoll studentType');
  if (!student) throw new AppError(httpStatus.NOT_FOUND, 'Student not found');
  if (!moment(month, 'YYYY-MM', true).isValid()) throw new AppError(httpStatus.BAD_REQUEST, 'Invalid month format. Use YYYY-MM');

  const attendances = await MealAttendance.find({ student: new Types.ObjectId(studentId), month, academicYear }).sort({ date: 1 }).lean();

  let totalMeals = 0, totalCost = 0, totalGrossCost = 0, totalFreeMealCostSaved = 0;
  attendances.forEach(a => {
    const { totalMeals: recordMeals, grossCost, mealCost, freeMealCostSaved } = getRecordCosts(a);
    totalMeals += recordMeals || 0;
    totalCost += mealCost;
    totalGrossCost += grossCost;
    totalFreeMealCostSaved += freeMealCostSaved;
  });

  const presentDays = attendances.filter(a => {
    const { totalMeals: tm } = getRecordCosts(a);
    return tm > 0;
  }).length;
  const totalDays = moment(month, 'YYYY-MM').daysInMonth();

  return {
    student: { id: student._id, studentId: student.studentId, name: student.name, nameBangla: student.nameBangla, roll: student.studentClassRoll, type: student.studentType },
    month, academicYear, attendances,
    summary: {
      totalMeals,
      totalCost,
      totalGrossCost,
      totalFreeMealCostSaved,
      totalBreakfast: attendances.filter(a => a.breakfast).length,
      totalLunch: attendances.filter(a => a.lunch).length,
      totalDinner: attendances.filter(a => a.dinner).length,
      presentDays,
      absentDays: totalDays - presentDays,
      attendancePercentage: ((presentDays / totalDays) * 100).toFixed(2),
    },
  };
};

const getMonthlySummary = async (personType: PersonType = 'student', month: string, academicYear: string, className?: string) => {
  const sheetData = await getMonthlyAttendanceSheet(personType, month, academicYear, className);

  const summary = sheetData.persons.map(p => {
    const isResidential = p.person.type === 'Residential' || p.person.type === 'hostel';
    const monthlyFee = isResidential ? 5000 : 0;
    return {
      personName: p.person.name,
      personNameBangla: p.person.nameBangla,
      personRoll: p.person.roll,
      personId: p.person.personId,
      personType: p.person.type,
      department: p.person.department,
      totalMeals: p.totalMeals,
      grossMealCost: p.grossCost,
      actualMealCost: p.mealCost,
      freeMealsCount: p.freeMealsCount,
      freeMealCostSaved: p.freeMealCostSaved,
      monthlyFee,
      netPayable: p.mealCost > monthlyFee ? p.mealCost - monthlyFee : 0,
      refund: monthlyFee > p.mealCost ? monthlyFee - p.mealCost : 0,
    };
  });

  return {
    month, academicYear, personType,
    summary,
    statistics: {
      totalPersons: summary.length,
      totalMeals: summary.reduce((s, p) => s + p.totalMeals, 0),
      totalGrossMealCost: summary.reduce((s, p) => s + p.grossMealCost, 0),
      totalMealCost: summary.reduce((s, p) => s + p.actualMealCost, 0),
      totalFreeMeals: summary.reduce((s, p) => s + p.freeMealsCount, 0),
      totalFreeMealCostSaved: summary.reduce((s, p) => s + p.freeMealCostSaved, 0),
      mealRates: sheetData.mealRates,
    },
  };
};

const deleteMonthlyAttendance = async (
  personType: PersonType = 'student',
  month: string,
  academicYear: string,
  className?: string,
) => {
  if (!month || !academicYear) throw new AppError(httpStatus.BAD_REQUEST, 'Month and Academic Year are required');

  let personIds: Types.ObjectId[] = [];
  const personField = personType === 'teacher' ? 'teacher' : personType === 'staff' ? 'staff' : 'student';

  if (personType === 'student') {
    const query: any = { admissionStatus: 'enrolled', status: 'active' };
    if (className && className !== 'ALL') {
      const classIds = await getClassIdsByClassName(className);
      if (!classIds.length) throw new AppError(httpStatus.NOT_FOUND, 'Class not found');
      query.className = { $in: classIds };
    }
    const students = await Student.find(query).select('_id');
    personIds = students.map(s => s._id as Types.ObjectId);
  } else if (personType === 'teacher') {
    const teachers = await getAllActiveTeachers();
    personIds = teachers.map(t => t._id);
  } else {
    const staffList = await getAllActiveStaff();
    personIds = staffList.map(s => s._id);
  }

  if (!personIds.length) throw new AppError(httpStatus.NOT_FOUND, 'No persons found');

  const startDate = moment(month, 'YYYY-MM').startOf('month').toDate();
  const endDate = moment(month, 'YYYY-MM').endOf('month').toDate();

  const toDelete = await MealAttendance.find({
    personType,
    [personField]: { $in: personIds },
    date: { $gte: startDate, $lte: endDate },
    academicYear,
  }).select(`_id ${personField}`);

  if (!toDelete.length) throw new AppError(httpStatus.NOT_FOUND, 'No attendance records found for this month');

  const result = await MealAttendance.deleteMany({
    _id: { $in: toDelete.map(d => d._id) },
  });

  const { PersonModel } = resolvePersonModel(personType);
  const pullOps = toDelete.map(d => ({
    updateOne: {
      filter: { _id: (d as any)[personField] },
      update: { $pull: { mealAttendances: d._id } },
    },
  }));
  if (pullOps.length) await PersonModel.bulkWrite(pullOps);

  return { deletedCount: result.deletedCount, message: `Deleted ${result.deletedCount} records for ${personType}s in ${month}` };
};

// ─────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────

export const mealAttendanceServices = {
  bulkCreateAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  getMonthlyAttendanceSheet,
  getCombinedMonthlySheet,
  getMonthlySummary,
  getAllAttendanceRecords,
  getAttendanceByStudentAndMonth,
  deleteMonthlyAttendance,
  validatePerson,
};