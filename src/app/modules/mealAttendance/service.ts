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
  AVERAGE_MEAL_RATE,
} from './constants';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

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
  const rawCost =
    (breakfast ? breakfastRate : 0) +
    (lunch ? lunchRate : 0) +
    (dinner ? dinnerRate : 0);
  const mealCost = isFreeMeal ? 0 : rawCost;
  return { totalMeals, mealCost };
};

/** Lazily require model to avoid circular deps */
const getTeacherModel = () => require('../teacher/teacher.model').Teacher;
const getStaffModel = () => require('../staff/staff.model').Staff;

/**
 * Resolve the correct Mongoose model + field name for a given personType.
 * Returns { model, field } where field is 'student' | 'teacher' | 'staff'.
 */
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

/** Verify person exists and is active */
const validatePerson = async (personId: string, personType: PersonType) => {
  const { PersonModel } = resolvePersonModel(personType);
  const person = await PersonModel.findById(personId).select('_id name status admissionStatus').lean();
  if (!person) {
    throw new AppError(httpStatus.NOT_FOUND, `${personType} not found`);
  }
  // Students have admissionStatus; teachers/staff use status
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

/** Build the filter object for finding an attendance record by person */
const buildPersonFilter = (personId: string, personType: PersonType) => {
  const { field } = resolvePersonModel(personType);
  return { [field]: new Types.ObjectId(personId), personType };
};

/** Build the $set object for upsert */
const buildPersonSet = (personId: string, personType: PersonType) => {
  const { field } = resolvePersonModel(personType);
  return { [field]: new Types.ObjectId(personId), personType };
};

/** Populate path based on personType (for queries) */
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

/** Fetch all enrolled students for a class (or all if no class given) */
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

/** Fetch all active teachers */
const getAllActiveTeachers = async (): Promise<any[]> => {
  const Teacher = getTeacherModel();
  return Teacher.find({ status: 'Active' })
    .select('_id teacherId name phone email designation department staffType')
    .lean();
};

/** Fetch all active staff */
const getAllActiveStaff = async (): Promise<any[]> => {
  const StaffModel = getStaffModel();
  return StaffModel.find({ status: 'Active' })
    .select('_id staffId name phone email staffDepartment designation')
    .lean();
};

/** Normalise a teacher/staff record to a common shape for sheet generation */
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
// Relation sync — keep Student/Teacher/Staff.mealAttendances current
// ─────────────────────────────────────────────

/**
 * After any create/upsert of attendance records, re-sync the
 * `mealAttendances` reference array on each touched Student/Teacher/Staff
 * document so populating that field always returns the full, correct list.
 */
const syncPersonMealAttendances = async (
  persons: { personId: string; personType: PersonType }[],
) => {
  if (!persons.length) return;

  const grouped: Record<PersonType, Set<string>> = {
    student: new Set(),
    teacher: new Set(),
    staff: new Set(),
  };

  persons.forEach(({ personId, personType }) => grouped[personType]?.add(personId));

  for (const personType of Object.keys(grouped) as PersonType[]) {
    const ids = Array.from(grouped[personType]);
    if (!ids.length) continue;

    const { PersonModel, field } = resolvePersonModel(personType);

    const ops = await Promise.all(
      ids.map(async personId => {
        const attendanceIds = await MealAttendance.find({
          personType,
          [field]: new Types.ObjectId(personId),
        }).distinct('_id');

        return {
          updateOne: {
            filter: { _id: new Types.ObjectId(personId) },
            update: { $set: { mealAttendances: attendanceIds } },
          },
        };
      }),
    );

    if (ops.length) await PersonModel.bulkWrite(ops);
  }
};

// ─────────────────────────────────────────────
// Core CRUD
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

    // Custom-or-default per-meal rates
    const breakfastRate = att.breakfastRate ?? DEFAULT_BREAKFAST_RATE;
    const lunchRate = att.lunchRate ?? DEFAULT_LUNCH_RATE;
    const dinnerRate = att.dinnerRate ?? DEFAULT_DINNER_RATE;

    const { totalMeals, mealCost } = calculateMealStats(
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

  // Keep Student/Teacher/Staff.mealAttendances reference arrays in sync
  await syncPersonMealAttendances(Array.from(touchedPersons.values()));

  return {
    modifiedCount: result.modifiedCount,
    upsertedCount: result.upsertedCount,
    matchedCount: result.matchedCount,
    totalProcessed: attendances.length,
  };
};

const getAttendanceById = async (id: string) => {
  if (!id) throw new AppError(httpStatus.BAD_REQUEST, 'Attendance ID is required');

  const attendance = await MealAttendance.findById(id).lean();
  if (!attendance) throw new AppError(httpStatus.NOT_FOUND, 'Meal attendance not found');

  // Populate based on personType
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

  return {
    _id: attendance._id,
    personType: attendance.personType,
    person: personData,
    // Legacy compat
    student: attendance.personType === 'student' ? personData : null,
    date: attendance.date,
    month: attendance.month,
    academicYear: attendance.academicYear,
    breakfast: attendance.breakfast,
    lunch: attendance.lunch,
    dinner: attendance.dinner,
    totalMeals: attendance.totalMeals,
    breakfastRate: attendance.breakfastRate ?? DEFAULT_BREAKFAST_RATE,
    lunchRate: attendance.lunchRate ?? DEFAULT_LUNCH_RATE,
    dinnerRate: attendance.dinnerRate ?? DEFAULT_DINNER_RATE,
    mealCost: attendance.mealCost,
    isFreeMeal: attendance.isFreeMeal || false,
    isHoliday: attendance.isHoliday || false,
    isAbsent: attendance.isAbsent || false,
    remarks: attendance.remarks || '',
  };
};

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

  const { totalMeals, mealCost } = calculateMealStats(
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
      remarks: payload.remarks !== undefined ? payload.remarks : existing.remarks,
    },
    { new: true, runValidators: true },
  );

  return result;
};

const deleteAttendance = async (id: string) => {
  const attendance = await MealAttendance.findById(id);
  if (!attendance) throw new AppError(httpStatus.NOT_FOUND, 'Meal attendance not found');

  const deleted = await MealAttendance.findByIdAndDelete(id);

  // Keep the person's mealAttendances relation array in sync
  const { PersonModel, field } = resolvePersonModel(attendance.personType);
  const personId = (attendance as any)[field];
  if (personId) {
    await PersonModel.updateOne({ _id: personId }, { $pull: { mealAttendances: attendance._id } });
  }

  return deleted;
};

// ─────────────────────────────────────────────
// Monthly Sheet (unified: students / teachers / staff)
// ─────────────────────────────────────────────

const getMonthlyAttendanceSheet = async (
  personType: PersonType = 'student',
  month: string,
  academicYear: string,
  className?: string, // only relevant for students
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

  // 5. Build per-person rows
  let grandTotalMeals = 0, grandTotalCost = 0;
  let grandTotalBreakfast = 0, grandTotalLunch = 0, grandTotalDinner = 0;
  let grandTotalFreeMeals = 0, grandTotalFreeMealCostSaved = 0;

  const dailyTotals = dates.map(date => {
    let tMeals = 0, tCost = 0, tB = 0, tL = 0, tD = 0, tFree = 0, tFreeSaved = 0;
    attendances.forEach(att => {
      if (moment(att.date).format('YYYY-MM-DD') === date) {
        tMeals += att.totalMeals || 0;
        if (att.isFreeMeal) { tFree++; tFreeSaved += (att.totalMeals || 0) * AVERAGE_MEAL_RATE; }
        else tCost += att.mealCost || 0;
        if (att.breakfast) tB++;
        if (att.lunch) tL++;
        if (att.dinner) tD++;
      }
    });
    return { date, totalMeals: tMeals, totalCost: tCost, totalBreakfast: tB, totalLunch: tL, totalDinner: tD, totalFreeMeals: tFree, freeMealCostSaved: tFreeSaved, isWeekend: [0, 6].includes(moment(date).day()) };
  });

  dailyTotals.forEach(d => {
    grandTotalMeals += d.totalMeals;
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
      const meals = att?.totalMeals ?? [breakfast, lunch, dinner].filter(Boolean).length;
      const isFree = att?.isFreeMeal || false;

      // Per-meal rates: use the rate stored on the record, otherwise default
      const breakfastRate = att?.breakfastRate ?? DEFAULT_BREAKFAST_RATE;
      const lunchRate = att?.lunchRate ?? DEFAULT_LUNCH_RATE;
      const dinnerRate = att?.dinnerRate ?? DEFAULT_DINNER_RATE;
      const grossCost = (breakfast ? breakfastRate : 0) + (lunch ? lunchRate : 0) + (dinner ? dinnerRate : 0);

      return {
        date,
        breakfast,
        lunch,
        dinner,
        totalMeals: meals,
        breakfastRate,
        lunchRate,
        dinnerRate,
        mealCost: isFree ? 0 : (att?.mealCost ?? grossCost),
        isFreeMeal: isFree,
        isHoliday: att?.isHoliday || false,
        isAbsent: att?.isAbsent || false,
      };
    });

    const totalMeals = attendance.reduce((s, d) => s + d.totalMeals, 0);
    const mealCost = attendance.reduce((s, d) => s + d.mealCost, 0);
    const freeMealsCount = attendance.filter(d => d.isFreeMeal).length;
    const freeMealCostSaved = attendance.filter(d => d.isFreeMeal).reduce((s, d) => s + d.totalMeals * AVERAGE_MEAL_RATE, 0);

    return {
      person: { id: person._id, ...norm },
      // legacy compat for frontend
      student: personType === 'student' ? { id: person._id, ...norm } : null,
      attendance,
      totalMeals,
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
    students: sheetData,   // kept for backward compat
    persons: sheetData,
    mealRates: DEFAULT_MEAL_RATES, // { breakfast: 40, lunch: 45, dinner: 80 }
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
    if (!students.length) return { data: [], total: 0, page, limit, totalPages: 0, totalMeals: 0, totalCost: 0, uniquePersons: 0 };
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

  const totalMeals = records.reduce((s, r) => s + (r.totalMeals || 0), 0);
  const totalCost = records.reduce((s, r) => s + (r.mealCost || 0), 0);
  const uniquePersons = new Set(records.map(r => (r as any)[populatePath]?._id?.toString())).size;

  return { data: records, total, page, limit, totalPages: Math.ceil(total / limit), totalMeals, totalCost, uniquePersons };
};

// ─────────────────────────────────────────────
// Util
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
  grandTotalMeals: 0, grandTotalCost: 0,
  grandTotalBreakfast: 0, grandTotalLunch: 0, grandTotalDinner: 0,
  grandTotalFreeMeals: 0, grandTotalFreeMealCostSaved: 0,
  dailyTotals: [],
});

// ─────────────────────────────────────────────
// Legacy: student-only helpers (kept for compat)
// ─────────────────────────────────────────────

const getAttendanceByStudentAndMonth = async (studentId: string, month: string, academicYear: string) => {
  const student = await Student.findById(studentId).select('_id studentId name nameBangla studentClassRoll studentType');
  if (!student) throw new AppError(httpStatus.NOT_FOUND, 'Student not found');
  if (!moment(month, 'YYYY-MM', true).isValid()) throw new AppError(httpStatus.BAD_REQUEST, 'Invalid month format. Use YYYY-MM');

  const attendances = await MealAttendance.find({ student: new Types.ObjectId(studentId), month, academicYear }).sort({ date: 1 });
  const totalMeals = attendances.reduce((s, a) => s + a.totalMeals, 0);
  const totalCost = attendances.reduce((s, a) => s + a.mealCost, 0);
  const presentDays = attendances.filter(a => a.totalMeals > 0).length;
  const totalDays = moment(month, 'YYYY-MM').daysInMonth();

  return {
    student: { id: student._id, studentId: student.studentId, name: student.name, nameBangla: student.nameBangla, roll: student.studentClassRoll, type: student.studentType },
    month, academicYear, attendances,
    summary: { totalMeals, totalCost, totalBreakfast: attendances.filter(a => a.breakfast).length, totalLunch: attendances.filter(a => a.lunch).length, totalDinner: attendances.filter(a => a.dinner).length, presentDays, absentDays: totalDays - presentDays, attendancePercentage: ((presentDays / totalDays) * 100).toFixed(2) },
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
      totalMealCost: summary.reduce((s, p) => s + p.actualMealCost, 0),
      totalFreeMeals: summary.reduce((s, p) => s + p.freeMealsCount, 0),
      totalFreeMealCostSaved: summary.reduce((s, p) => s + p.freeMealCostSaved, 0),
      mealRates: DEFAULT_MEAL_RATES,
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

  // Pull the removed references out of each person's mealAttendances array
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
  getMonthlySummary,
  getAllAttendanceRecords,
  getAttendanceByStudentAndMonth,
  deleteMonthlyAttendance,
  validatePerson,
};