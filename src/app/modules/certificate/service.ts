import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { Certificate } from './model';
import { ICertificate } from './interface';
import { Student } from '../student/student.model';

const generateCertificateNo = async () => {
  const year = new Date().getFullYear();
  const last = await Certificate.findOne({
    certificateNo: new RegExp(`^CII-CERT-${year}-`),
  })
    .sort({ certificateNo: -1 })
    .select('certificateNo');
  let next = 1;
  if (last?.certificateNo) {
    const parsed = parseInt(
      String(last.certificateNo).split('-').pop() || '0',
      10,
    );
    if (!isNaN(parsed)) next = parsed + 1;
  }
  return `CII-CERT-${year}-${String(next).padStart(4, '0')}`;
};

const createCertificate = async (payload: ICertificate) => {
  const certificateNo = await generateCertificateNo();
  const result = await Certificate.create({ ...payload, certificateNo });
  return result;
};

const getAllCertificates = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(
    Certificate.find().populate('student', 'name nameBangla studentId className'),
    query,
  )
    .search(['certificateNo'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const data = await queryBuilder.modelQuery;
  return { meta, data };
};

const getSingleCertificate = async (id: string) => {
  const result = await Certificate.findById(id).populate(
    'student',
    'name nameBangla studentId studentClassRoll studentPhoto className section parentInfo',
  );
  if (!result)
    throw new AppError(httpStatus.NOT_FOUND, 'Certificate not found');
  return result;
};

const updateCertificate = async (id: string, payload: Partial<ICertificate>) => {
  const result = await Certificate.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!result)
    throw new AppError(httpStatus.NOT_FOUND, 'Failed to update certificate');
  return result;
};

const deleteCertificate = async (id: string) => {
  const result = await Certificate.findByIdAndDelete(id);
  if (!result)
    throw new AppError(httpStatus.NOT_FOUND, 'Certificate not found');
  return result;
};

const getIdCards = async (query: Record<string, unknown>) => {
  const { className, department } = query;
  const filter: Record<string, unknown> = { status: { $nin: ['left', 'passed'] } };
  if (className) filter.className = { $in: [className] };
  if (department) filter.studentDepartment = department;

  const students = await Student.find(filter)
    .populate('className', 'className')
    .select(
      'studentId smartIdCard name nameBangla studentPhoto studentClassRoll className section studentDepartment bloodGroup birthDate parentInfo',
    )
    .sort('studentClassRoll');

  return { data: students };
};

export const certificateServices = {
  createCertificate,
  getAllCertificates,
  getSingleCertificate,
  updateCertificate,
  deleteCertificate,
  getIdCards,
};
