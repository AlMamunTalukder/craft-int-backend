import { Student } from './student.model';

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
  '' = '',
}

export enum StudentStatus {
  ACTIVE = 'active',
  PASSED = 'passed',
  GRADUATED = 'failed',
  LEFT = 'left',
}

const findLastStudentNo = async () => {
  const lastStudent = await Student.findOne({}, { studentId: 1 })
    .sort({ createdAt: -1 })
    .lean();

  return lastStudent?.studentId || '0000';
};

export const generateStudentId = async () => {
  const currentId = await findLastStudentNo(); // e.g., 'STU0001' or '0001'

  // Extract numeric part
  const numericPart = currentId.replace(/\D/g, ''); // remove non-digits
  const incrementId = (Number(numericPart) + 1).toString().padStart(4, '0');

  return incrementId; // e.g., '0002'
};
