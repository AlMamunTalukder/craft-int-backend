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
  const currentYear = new Date().getFullYear();
  const prefix = 'CII';

  // Function to extract class number from class name
  const extractClassNumber = (className: string): number => {
    if (!className) return 0;

    const normalized = className.toLowerCase().trim();

    // Direct number extraction
    const numberMatch = normalized.match(/\d+/);
    if (numberMatch) {
      return parseInt(numberMatch[0]);
    }

    // Text to number mapping
    const textToNumber: { [key: string]: number } = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
    };

    // Check each text pattern
    for (const [text, number] of Object.entries(textToNumber)) {
      if (normalized.includes(text)) {
        return number;
      }
    }

    return 0;
  };

  let classCode = 0;

  if (className) {
    classCode = extractClassNumber(className);
  }

  console.log(`Class Name: "${className}", Extracted class code: ${classCode}`);

  // Build the regex pattern to find existing student IDs for this class
  const pattern = `^${prefix}${currentYear}${classCode}\\d{3}$`;

  // Find the last student ID for this class
  const lastStudent = await Student.findOne(
    {
      studentId: { $regex: pattern },
    },
    { studentId: 1 },
  )
    .sort({ studentId: -1 })
    .lean();

  let sequenceNumber = 0;
  if (lastStudent?.studentId) {
    const lastId = lastStudent.studentId;
    const lastSequence = parseInt(lastId.slice(-3));

    if (!isNaN(lastSequence)) {
      sequenceNumber = lastSequence + 1;
    }
  }

  // Generate the student ID
  return `${prefix}${currentYear}${classCode}${sequenceNumber.toString().padStart(3, '0')}`;
};
