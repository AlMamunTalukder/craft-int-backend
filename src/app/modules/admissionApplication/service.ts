import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { AdmissionApplication } from './model';
import { TAdmissionApplication } from './interface';

const generateApplicationId = async () => {
  const lastApplication = await AdmissionApplication.findOne()
    .sort({ createdAt: -1 })
    .lean();

  let newId = 'APP-0001';

  if (lastApplication?.applicationId) {
    const lastNumber = parseInt(lastApplication.applicationId.split('-')[1]);
    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
    newId = `APP-${nextNumber}`;
  }

  return newId;
};

const createAdmissionApplication = async (payload: TAdmissionApplication) => {
  const applicationId = await generateApplicationId();

  const result = await AdmissionApplication.create({
    ...payload,
    applicationId,
  });

  return result;
};

const getAllAdmissionApplications = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(AdmissionApplication.find(), query)
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const data = await queryBuilder.modelQuery;

  return { meta, data };
};

const getSingleAdmissionApplication = async (id: string) => {
  const result = await AdmissionApplication.findById(id);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'AdmissionApplication not found');
  }

  return result;
};

const updateAdmissionApplication = async (
  id: string,
  payload: Partial<TAdmissionApplication>,
) => {
  const result = await AdmissionApplication.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!result) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Failed to update AdmissionApplication',
    );
  }

  return result;
};

const deleteAdmissionApplication = async (id: string) => {
  const result = await AdmissionApplication.findByIdAndDelete(id);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'AdmissionApplication not found');
  }

  return result;
};

export const admissionApplicationServices = {
  createAdmissionApplication,
  getAllAdmissionApplications,
  getSingleAdmissionApplication,
  updateAdmissionApplication,
  deleteAdmissionApplication,
};
