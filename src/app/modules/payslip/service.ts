import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { Payslip } from './model';
import { IPayslip } from './interface';
import { Salary } from '../salary/salary.model';

const populateEmployees = async (payslips: any[]) => {
  const populated = [];
  for (const slip of payslips) {
    const doc = slip.toObject ? slip.toObject() : slip;
    if (doc.employeeType === 'teacher') {
      doc.employeeInfo = await import('../teacher/teacher.model').then((m) =>
        m.Teacher.findById(doc.employee).select('name teacherId phone designation'),
      );
    } else {
      doc.employeeInfo = await import('../staff/staff.model').then((m) =>
        m.Staff.findById(doc.employee).select('name staffId phone category'),
      );
    }
    populated.push(doc);
  }
  return populated;
};

const generatePayslips = async (payload: {
  month: number;
  year: number;
  employeeType: 'teacher' | 'staff';
}) => {
  const { month, year, employeeType } = payload;

  const employees =
    employeeType === 'teacher'
      ? await import('../teacher/teacher.model').then((m) =>
          m.Teacher.find().select('_id name'),
        )
      : await import('../staff/staff.model').then((m) =>
          m.Staff.find().select('_id name'),
        );

  const salaries = await Salary.find().sort({ effectiveDate: -1 });

  const latestByEmployeeName = new Map<string, (typeof salaries)[0]>();
  for (const s of salaries) {
    const key = (s.employee || '').trim().toLowerCase();
    if (key && !latestByEmployeeName.has(key)) {
      latestByEmployeeName.set(key, s);
    }
  }

  const existing = await Payslip.find({ month, year, employeeType });
  const existingKeys = new Set(existing.map((p) => p.employee.toString()));

  const created = [];
  for (const emp of employees) {
    const empId = emp._id.toString();
    if (existingKeys.has(empId)) continue;

    const salary = latestByEmployeeName.get(
      (emp.name || '').trim().toLowerCase(),
    );
    if (!salary) continue;

    const gross =
      (salary.basicSalary || 0) +
      (salary.houseRent || 0) +
      (salary.medicalAllowance || 0) +
      (salary.transportAllowance || 0) +
      (salary.foodAllowance || 0) +
      (salary.otherAllowances || 0);

    const totalDeductions =
      (salary.deductions || 0) +
      (salary.incomeTax || 0) +
      (salary.providentFund || 0) +
      (salary.otherDeductions || 0);

    const net = gross - totalDeductions;

    const slip = await Payslip.create({
      employeeType,
      employee: empId as any,
      month,
      year,
      salary: salary._id,
      basicSalary: salary.basicSalary || 0,
      houseRent: salary.houseRent || 0,
      medicalAllowance: salary.medicalAllowance || 0,
      transportAllowance: salary.transportAllowance || 0,
      foodAllowance: salary.foodAllowance || 0,
      otherAllowances: salary.otherAllowances || 0,
      grossSalary: gross,
      deductions: salary.deductions || 0,
      incomeTax: salary.incomeTax || 0,
      providentFund: salary.providentFund || 0,
      otherDeductions: salary.otherDeductions || 0,
      totalDeductions,
      netSalary: net,
      status: 'draft',
    } as any);

    created.push(slip);
  }

  return {
    generated: created.length,
    skipped: existing.length,
    totalEmployees: employees.length,
    data: created,
  };
};

const getAllPayslips = async (query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = {};
  if (query.month) filter.month = Number(query.month);
  if (query.year) filter.year = Number(query.year);
  if (query.employeeType) filter.employeeType = query.employeeType;
  if (query.status) filter.status = query.status;

  const queryBuilder = new QueryBuilder(Payslip.find(filter), query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const data = await queryBuilder.modelQuery;

  const populated = await populateEmployees(data as any);
  return { meta, data: populated };
};

const getSinglePayslip = async (id: string) => {
  const result = await Payslip.findById(id);
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Payslip not found');
  const [populated] = await populateEmployees([result as any]);
  return populated;
};

const markPaid = async (id: string) => {
  const result = await Payslip.findByIdAndUpdate(
    id,
    { status: 'paid', paidAt: new Date() },
    { new: true, runValidators: true },
  );
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Payslip not found');
  return result;
};

const deletePayslip = async (id: string) => {
  const result = await Payslip.findByIdAndDelete(id);
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Payslip not found');
  return result;
};

const getSummary = async () => {
  const [totals, byMonth] = await Promise.all([
    Payslip.aggregate([
      {
        $group: {
          _id: null,
          totalNet: { $sum: '$netSalary' },
          totalGross: { $sum: '$grossSalary' },
          count: { $sum: 1 },
          paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
        },
      },
    ]),
    Payslip.aggregate([
      {
        $group: {
          _id: { month: '$month', year: '$year' },
          totalNet: { $sum: '$netSalary' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]),
  ]);

  return {
    totals: totals[0] || { totalNet: 0, totalGross: 0, count: 0, paid: 0 },
    byMonth,
  };
};

export const payslipServices = {
  generatePayslips,
  getAllPayslips,
  getSinglePayslip,
  markPaid,
  deletePayslip,
  getSummary,
};
