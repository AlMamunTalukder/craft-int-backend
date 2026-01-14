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

  // Function to get class code based on your requirements
  const getClassCode = (className: string): string => {
    if (!className) return '0';

    const normalized = className.toLowerCase().trim();

    // Check for numbered classes (One, Two, Three, etc.)
    const textToNumber: { [key: string]: string } = {
      one: '10',
      two: '20',
      three: '30',
      four: '40',
      five: '50',
      six: '60',
      seven: '70',
      eight: '80',
      nine: '90',
      ten: '100',
    };

    // Check text patterns first
    for (const [text, number] of Object.entries(textToNumber)) {
      if (normalized.includes(text)) {
        return number;
      }
    }

    // Check for numeric classes
    const numberMatch = normalized.match(/\d+/);
    if (numberMatch) {
      const num = parseInt(numberMatch[0]);
      return (num * 10).toString(); // Multiply by 10 to match your format
    }

    // For other classes like "Nazera", "Hifz", etc., use first letter
    const firstLetter = className.charAt(0).toUpperCase();

    // Check if it's a letter and not a number
    if (/^[A-Za-z]$/.test(firstLetter)) {
      return firstLetter; // Return the first letter for non-numeric classes
    }

    return '0';
  };

  let classCode = '0';

  if (className) {
    classCode = getClassCode(className);
  }

  console.log(`Class Name: "${className}", Extracted class code: ${classCode}`);

  // Build the regex pattern based on class code type
  let pattern: string;

  if (/^\d+$/.test(classCode)) {
    // For numeric class codes (10, 20, 30, etc.)
    pattern = `^${prefix}${currentYear}${classCode}\\d{3}$`;
  } else {
    // For letter class codes (N, H, etc.)
    pattern = `^${prefix}${currentYear}${classCode}\\d{4}$`;
  }

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

    if (/^\d+$/.test(classCode)) {
      // For numeric codes: CII202510001 (4-digit year + 2-digit class + 3-digit sequence)
      const sequenceStr = lastId.slice(-3);
      sequenceNumber = parseInt(sequenceStr) + 1;
    } else {
      // For letter codes: CII2025N0001 (4-digit year + 1-letter + 4-digit sequence)
      const sequenceStr = lastId.slice(-4);
      sequenceNumber = parseInt(sequenceStr) + 1;
    }
  }

  // Generate the student ID
  if (/^\d+$/.test(classCode)) {
    // For numeric classes: CII202610001, CII202610002, etc.
    return `${prefix}${currentYear}${classCode}${sequenceNumber.toString().padStart(3, '0')}`;
  } else {
    // For letter classes: CII2026N0001, CII2026H0002, etc.
    return `${prefix}${currentYear}${classCode}${sequenceNumber.toString().padStart(4, '0')}`;
  }
};
