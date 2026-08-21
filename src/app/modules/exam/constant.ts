export const EXAM_TYPES = [
  'class_test',
  'first_term',
  'half_yearly',
  'final',
] as const;

export const EXAM_STATUS = ['draft', 'published', 'completed'] as const;

export const gradeOf = (marks: number): { grade: string; gradePoint: number } => {
  if (marks >= 80) return { grade: 'A+', gradePoint: 5 };
  if (marks >= 70) return { grade: 'A', gradePoint: 4 };
  if (marks >= 60) return { grade: 'A-', gradePoint: 3.5 };
  if (marks >= 50) return { grade: 'B', gradePoint: 3 };
  if (marks >= 40) return { grade: 'C', gradePoint: 2 };
  if (marks >= 33) return { grade: 'D', gradePoint: 1 };
  return { grade: 'F', gradePoint: 0 };
};

export const gpaGradeOf = (
  gpa: number,
): { grade: string; remark: string } => {
  if (gpa >= 5) return { grade: 'A+', remark: 'Outstanding' };
  if (gpa >= 4) return { grade: 'A', remark: 'Excellent' };
  if (gpa >= 3.5) return { grade: 'A-', remark: 'Very Good' };
  if (gpa >= 3) return { grade: 'B', remark: 'Good' };
  if (gpa >= 2) return { grade: 'C', remark: 'Average' };
  if (gpa >= 1) return { grade: 'D', remark: 'Pass' };
  return { grade: 'F', remark: 'Failed' };
};
