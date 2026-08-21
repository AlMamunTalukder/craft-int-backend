import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import { AdmissionApplication } from '../onlineAdmission/model';
import { Student } from '../student/student.model';

const getAdmissionStats = async (query: Record<string, unknown>) => {
  const year = (query.year as string) || undefined;
  const appMatch: Record<string, unknown> = {};
  if (year) appMatch.academicYear = year;

  const [byStatus, byClass, byDepartment, monthly, studentEnrolled] =
    await Promise.all([
      AdmissionApplication.aggregate([
        { $match: appMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      AdmissionApplication.aggregate([
        { $match: appMatch },
        {
          $group: {
            _id: '$studentInfo.class',
            applied: { $sum: 1 },
            approved: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
            },
          },
        },
      ]),
      AdmissionApplication.aggregate([
        { $match: appMatch },
        {
          $group: {
            _id: '$studentInfo.department',
            applied: { $sum: 1 },
          },
        },
      ]),
      AdmissionApplication.aggregate([
        { $match: appMatch },
        {
          $group: {
            _id: { $month: '$createdAt' },
            applied: { $sum: 1 },
            approved: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Student.countDocuments(
        year ? { academicYear: year, admissionStatus: 'enrolled' } : { admissionStatus: 'enrolled' },
      ),
    ]);

  const statusMap: Record<string, number> = {};
  for (const row of byStatus) statusMap[row._id] = row.count;

  const applied = byStatus.reduce((s, r) => s + r.count, 0);
  const pending = statusMap.pending || 0;
  const approved = statusMap.approved || 0;
  const rejected = statusMap.rejected || 0;
  const enrolled = studentEnrolled;

  if (!applied && !enrolled) {
    throw new AppError(httpStatus.NOT_FOUND, 'No admission data found');
  }

  return {
    year: year || 'all',
    funnel: { applied, pending, approved, rejected, enrolled },
    conversionRate: applied
      ? Number(((approved / applied) * 100).toFixed(1))
      : 0,
    enrollmentRate: applied
      ? Number(((enrolled / applied) * 100).toFixed(1))
      : 0,
    byClass,
    byDepartment,
    monthly,
  };
};

export const admissionAnalyticsServices = { getAdmissionStats };
