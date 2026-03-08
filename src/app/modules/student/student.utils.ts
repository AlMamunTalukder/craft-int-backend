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

// Updated generateStudentId function for CII0001, CII0002 format
export const generateStudentId = async (
  className?: string,
): Promise<string> => {
  const prefix = 'CII';

  // Simple pattern to find the last student ID with CII prefix followed by 4 digits
  const pattern = `^${prefix}\\d{4}$`;

  // Find the last student ID with matching pattern
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
    // Extract the numeric part after 'CII'
    const numericPart = lastId.slice(3); // Remove 'CII' prefix
    sequenceNumber = parseInt(numericPart, 10) + 1;

    if (sequenceNumber > 9999) {
      throw new Error('Sequence number exceeded maximum (CII9999)');
    }
  }

  // Generate ID with 4-digit padding (0001, 0002, etc.)
  const studentId = `${prefix}${sequenceNumber.toString().padStart(4, '0')}`;
  console.log('Generated Student ID:', studentId);
  return studentId;
};
