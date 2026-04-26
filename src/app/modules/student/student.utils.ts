/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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

export const generateStudentId = async (
  className?: string,
): Promise<string> => {
  const prefix = 'CII';

  const pattern = `^${prefix}\\d{4}$`;


  const lastStudent = await Student.findOne(
    {
      studentId: { $regex: pattern, $options: 'i' },
    },
    { studentId: 1 },
  )
    .sort({ studentId: -1 })
    .lean();

  let sequenceNumber = 1;

  if (lastStudent?.studentId) {
    const lastId = lastStudent.studentId;
    const numericPart = lastId.slice(3);
    sequenceNumber = parseInt(numericPart, 10) + 1;

    if (sequenceNumber > 9999) {
      throw new Error('Sequence number exceeded maximum (CII9999)');
    }
  }

  const studentId = `${prefix}${sequenceNumber.toString().padStart(4, '0')}`;
  console.log('Generated Student ID:', studentId);
  return studentId;
};
