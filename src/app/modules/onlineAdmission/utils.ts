import { AdmissionApplication } from './model';

export const generateApplicationId = async () => {
  const lastApplication = await AdmissionApplication.findOne()
    .sort({ createdAt: -1 })
    .lean();

  let newId = 'OA-0001';

  if (lastApplication?.applicationId) {
    const lastNumber = parseInt(lastApplication.applicationId.split('-')[1]);
    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
    newId = `OA-${nextNumber}`;
  }

  return newId;
};
