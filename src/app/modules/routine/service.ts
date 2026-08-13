import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { ClassRoutine } from './model';
import { IClassRoutine, IRoutinePeriod } from './interface';

const timeOverlaps = (
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
) => aStart < bEnd && bStart < aEnd;

const checkTeacherConflict = async (
  payload: Partial<IClassRoutine>,
  excludeId?: string,
) => {
  const periods = payload.periods || [];
  const teacherIds = periods
    .filter((p) => p.teacher && !p.isBreak)
    .map((p) => p.teacher?.toString());

  if (!teacherIds.length) return;

  const existing = await ClassRoutine.find({
    day: payload.day,
    academicYear: payload.academicYear,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).populate('periods');

  const conflicts: string[] = [];
  for (const routine of existing) {
    for (const newP of periods) {
      if (!newP.teacher || newP.isBreak) continue;
      for (const oldP of routine.periods as IRoutinePeriod[]) {
        if (!oldP.teacher || oldP.isBreak) continue;
        if (
          newP.teacher.toString() === oldP.teacher.toString() &&
          timeOverlaps(newP.startTime, newP.endTime, oldP.startTime, oldP.endTime)
        ) {
          conflicts.push(
            `${routine.day}: ${oldP.startTime}-${oldP.endTime} (${oldP.subject})`,
          );
        }
      }
    }
  }

  if (conflicts.length) {
    throw new AppError(
      httpStatus.CONFLICT,
      `Teacher already has a class at: ${conflicts.join(', ')}`,
    );
  }
};

const createRoutine = async (payload: IClassRoutine) => {
  await checkTeacherConflict(payload);
  const result = await ClassRoutine.create({
    ...payload,
    academicYear:
      payload.academicYear || String(new Date().getFullYear()),
  });
  return result;
};

const getAllRoutines = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(
    ClassRoutine.find().populate('className'),
    query,
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const data = await queryBuilder.modelQuery;
  return { meta, data };
};

const getSingleRoutine = async (id: string) => {
  const result = await ClassRoutine.findById(id).populate('className');
  if (!result)
    throw new AppError(httpStatus.NOT_FOUND, 'Class routine not found');
  return result;
};

const updateRoutine = async (id: string, payload: Partial<IClassRoutine>) => {
  await checkTeacherConflict(payload, id);
  const result = await ClassRoutine.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!result)
    throw new AppError(httpStatus.NOT_FOUND, 'Failed to update routine');
  return result;
};

const deleteRoutine = async (id: string) => {
  const result = await ClassRoutine.findByIdAndDelete(id);
  if (!result)
    throw new AppError(httpStatus.NOT_FOUND, 'Class routine not found');
  return result;
};

const getWeekRoutine = async (query: Record<string, unknown>) => {
  const { className, section, academicYear } = query;
  if (!className) throw new AppError(httpStatus.BAD_REQUEST, 'class is required');

  const filter: Record<string, unknown> = { className };
  if (section) filter.section = section;
  if (academicYear) filter.academicYear = academicYear;

  const data = await ClassRoutine.find(filter)
    .populate('className')
    .populate('periods.teacher', 'name teacherId');

  const weekMap: Record<string, typeof data> = {};
  for (const day of [
    'Saturday',
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ]) {
    weekMap[day] = data.filter((r) => r.day === day);
  }

  return { data, week: weekMap };
};

export const routineServices = {
  createRoutine,
  getAllRoutines,
  getSingleRoutine,
  updateRoutine,
  deleteRoutine,
  getWeekRoutine,
};
