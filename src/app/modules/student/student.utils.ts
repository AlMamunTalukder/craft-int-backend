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

  const getClassCode = (className: string): string => {
    if (!className) return '0';

    const normalized = className.toLowerCase().trim();

    const textToNumber: { [key: string]: string } = {
      one: '1',
      two: '2',
      three: '3',
      four: '4',
      five: '5',
      six: '6',
      seven: '7',
      eight: '8',
      nine: '9',
      ten: '10',
    };

    for (const [text, number] of Object.entries(textToNumber)) {
      if (normalized.includes(text)) {
        return number;
      }
    }

    const numberMatch = normalized.match(/\d+/);
    if (numberMatch) {
      const num = parseInt(numberMatch[0]);
      return (num * 10).toString();
    }

    const firstLetter = className.charAt(0).toUpperCase();

    if (/^[A-Za-z]$/.test(firstLetter)) {
      return firstLetter;
    }

    return '0';
  };

  let classCode = '0';

  if (className) {
    classCode = getClassCode(className);
  }

  let pattern: string;

  if (/^\d+$/.test(classCode)) {
    pattern = `^${prefix}${currentYear}${classCode}\\d{3}$`;
  } else {
    pattern = `^${prefix}${currentYear}${classCode}\\d{4}$`;
  }

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
      const sequenceStr = lastId.slice(-3);
      sequenceNumber = parseInt(sequenceStr) + 1;
    } else {
      const sequenceStr = lastId.slice(-4);
      sequenceNumber = parseInt(sequenceStr) + 1;
    }
  }
  if (/^\d+$/.test(classCode)) {
    return `${prefix}${currentYear}${classCode}${sequenceNumber.toString().padStart(3, '0')}`;
  } else {
    return `${prefix}${currentYear}${classCode}${sequenceNumber.toString().padStart(4, '0')}`;
  }
};
