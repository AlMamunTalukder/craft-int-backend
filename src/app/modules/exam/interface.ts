import { ObjectId } from 'mongoose';

export interface IExamSubject {
  subject: string;
  fullMarks: number;
  passMarks: number;
}

export interface IExam {
  name: string;
  examType: string;
  className: ObjectId;
  department: string;
  academicYear: string;
  startDate?: Date;
  endDate?: Date;
  subjects: IExamSubject[];
  status: 'draft' | 'published' | 'completed';
  publishedAt?: Date;
}

export interface IExamMarkItem {
  subject: string;
  obtained: number;
  fullMarks: number;
  passMarks: number;
  grade: string;
  gradePoint: number;
  result: 'pass' | 'fail';
}

export interface IExamMark {
  exam: ObjectId;
  student: ObjectId;
  className: ObjectId;
  marks: IExamMarkItem[];
  totalObtained: number;
  totalFull: number;
  gpa: number;
  grade: string;
  result: 'pass' | 'fail';
}
