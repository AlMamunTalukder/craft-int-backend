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

  // Helper function to determine the Class Code
  const getClassCode = (className: string): string => {
    if (!className) return '0'; // Default fallback if no class name provided

    const normalized = className.toLowerCase().trim();
    console.log('classname check ', className, normalized);

    // 1. Handle Specific Class Names with Special Codes

    // 'Pre One' takes precedence over 'One'
    if (normalized.includes('pre one')) return '00';

    // 'One' but NOT 'Pre One'
    if (
      normalized === 'one' ||
      (normalized.includes('one') && !normalized.includes('pre'))
    )
      return '10';

    if (normalized.includes('two')) return '20';
    if (normalized.includes('three')) return '30';
    if (normalized.includes('four')) return '40';
    if (normalized.includes('five')) return '50';
    if (normalized.includes('six')) return '60';
    if (normalized.includes('seven')) return '70';

    // Religious/Islamic Classes
    if (normalized.includes('nurani')) return 'N';
    if (normalized.includes('nazera')) return 'NA';
    if (normalized.includes('qaida')) return 'QA';
    if (normalized.includes('hifz')) return 'HA';

    // 2. Default: Take the first letter of the class name (e.g., "Eight" -> "E")
    return className.charAt(0).toUpperCase();
  };

  const classCode = getClassCode(className || '');

  // Sequence length is fixed to 3 digits based on your examples (001, 002)
  const sequenceLength = 3;

  // Explicitly define 'pattern' here to avoid the "Cannot find name 'pattern'" error
  const pattern = `^${prefix}${currentYear}${classCode}\\d{${sequenceLength}}$`;

  const lastStudent = await Student.findOne(
    {
      studentId: { $regex: pattern },
    },
    { studentId: 1 },
  )
    .sort({ studentId: -1 })
    .lean();

  let sequenceNumber = 1; // Default to 1 if this is the first student

  if (lastStudent?.studentId) {
    // Extract the last 3 digits as the sequence number
    const sequenceStr = lastStudent.studentId.slice(-sequenceLength);
    sequenceNumber = parseInt(sequenceStr, 10) + 1;
  }

  // Pad sequence with leading zeros (e.g., 1 -> "001")
  const paddedSequence = sequenceNumber
    .toString()
    .padStart(sequenceLength, '0');

  // Construct Final ID
  return `${prefix}${currentYear}${classCode}${paddedSequence}`;
};
