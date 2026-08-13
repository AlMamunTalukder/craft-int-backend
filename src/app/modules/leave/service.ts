import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { Leave } from './model';
import { ILeave } from './interface';

const calcDays = (start: Date, end: Date) => {
  const diff = Math.abs(new Date(end).getTime() - new Date(start).getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};

const createLeave = async (payload: ILeave) => {
  const days = calcDays(payload.startDate, payload.endDate);
  const result = await Leave.create({ ...payload, days });
  return result;
};

const getAllLeaves = async (query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = {};
  if (query.employeeType) filter.employeeType = query.employeeType;
  if (query.status) filter.status = query.status;

  const queryBuilder = new QueryBuilder(Leave.find(filter), query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const data = await queryBuilder.modelQuery;

  const populated = [];
  for (const leave of data) {
    const doc: any = leave.toObject();
    if (leave.employeeType === 'teacher') {
      doc.employeeInfo = await import('../teacher/teacher.model').then((m) =>
        m.Teacher.findById(leave.employee).select('name teacherId phone'),
      );
    } else {
      doc.employeeInfo = await import('../staff/staff.model').then((m) =>
        m.Staff.findById(leave.employee).select('name staffId phone'),
      );
    }
    populated.push(doc);
  }

  return { meta, data: populated };
};

const getSingleLeave = async (id: string) => {
  const result = await Leave.findById(id);
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Leave not found');
  return result;
};

const updateLeave = async (id: string, payload: Partial<ILeave>) => {
  if (payload.startDate && payload.endDate) {
    payload.days = calcDays(payload.startDate, payload.endDate);
  }
  const result = await Leave.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Failed to update leave');
  return result;
};

const updateLeaveStatus = async (
  id: string,
  status: string,
  approvedBy: string,
) => {
  const result = await Leave.findByIdAndUpdate(
    id,
    {
      status,
      approvedBy,
      approvedAt: status === 'approved' ? new Date() : undefined,
    },
    { new: true, runValidators: true },
  );
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Leave not found');
  return result;
};

const deleteLeave = async (id: string) => {
  const result = await Leave.findByIdAndDelete(id);
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Leave not found');
  return result;
};

export const leaveServices = {
  createLeave,
  getAllLeaves,
  getSingleLeave,
  updateLeave,
  updateLeaveStatus,
  deleteLeave,
};
