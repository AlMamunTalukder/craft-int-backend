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
// Updated generateStudentId function
export const generateStudentId = async (
  className?: string,
): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = 'CII';

  let classCode = '0';

  if (className && typeof className === 'string' && className.trim() !== '') {
    const normalized = className.toLowerCase().trim();
    console.log('Normalized class name for ID generation:', normalized);

    // Class name mappings - updated with your specific format
    const specialClassMappings: { [key: string]: string } = {
      // Pre-School classes
      'pre one': '00',
      'pre-one': '00',
      preone: '00',
      'pre 1': '00',
      'pre-1': '00',

      // Standard classes 1-7
      one: '10',
      '1': '10',
      'class one': '10',
      two: '20',
      '2': '20',
      'class two': '20',
      three: '30',
      '3': '30',
      'class three': '30',
      four: '40',
      '4': '40',
      'class four': '40',
      five: '50',
      '5': '50',
      'class five': '50',
      six: '60',
      '6': '60',
      'class six': '60',
      seven: '70',
      '7': '70',
      'class seven': '70',
      eight: '80',
      '8': '80',
      'class eight': '80',
      nine: '90',
      '9': '90',
      'class nine': '90',
      ten: '100',
      '10': '100',
      'class ten': '100',

      // Islamic Studies
      nurani: 'N',
      noorani: 'N',
      nazera: 'NA',
      nazira: 'NA',
      qaida: 'QA',
      quida: 'QA',
      hifz: 'HA',
      'hifzul quran': 'HA',
    };

    // Check for exact matches
    if (specialClassMappings[normalized]) {
      classCode = specialClassMappings[normalized];
    } else {
      // Check for partial matches
      for (const [key, code] of Object.entries(specialClassMappings)) {
        if (normalized.includes(key) || key.includes(normalized)) {
          classCode = code;
          break;
        }
      }

      // If still no match, take first letter
      if (classCode === '0') {
        const firstLetter = normalized.charAt(0).toUpperCase();
        if (/^[A-Za-z]$/.test(firstLetter)) {
          classCode = firstLetter;
        }
      }
    }
  }

  console.log('Determined class code:', classCode);

  // Determine pattern based on class code
  const pattern = `^${prefix}${currentYear}${classCode}\\d{3}$`;

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
    const sequenceStr = lastId.slice(-3);
    sequenceNumber = parseInt(sequenceStr, 10) + 1;

    if (sequenceNumber > 999) {
      throw new Error('Sequence number exceeded maximum for this class');
    }
  }

  const studentId = `${prefix}${currentYear}${classCode}${sequenceNumber.toString().padStart(3, '0')}`;
  console.log('Generated Student ID:', studentId);
  return studentId;
};
