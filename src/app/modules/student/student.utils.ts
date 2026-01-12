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

export const generateStudentId = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = 'CII';

  const lastStudent = await Student.findOne(
    {
      studentId: { $regex: `^${prefix}${currentYear}` },
    },
    { studentId: 1 },
  )
    .sort({ createdAt: -1 })
    .lean();

  let sequenceNumber = 1000;
  if (lastStudent?.studentId) {
    const lastId = lastStudent.studentId;
    const lastSequence = parseInt(lastId.slice(-4));

    if (!isNaN(lastSequence)) {
      sequenceNumber = lastSequence + 1;
    }
  }

  return `${prefix}${currentYear}${sequenceNumber.toString().padStart(4, '0')}`;
};
