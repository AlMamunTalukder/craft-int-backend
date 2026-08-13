import { Schema, model } from 'mongoose';
import { IExam, IExamMark, IExamSubject } from './interface';

const ExamSubjectSchema = new Schema<IExamSubject>(
  {
    subject: { type: String, required: true },
    fullMarks: { type: Number, required: true, min: 1 },
    passMarks: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ExamSchema = new Schema<IExam>(
  {
    name: { type: String, required: true, trim: true },
    examType: { type: String, required: true },
    className: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    department: { type: String, default: 'academic' },
    academicYear: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    subjects: { type: [ExamSubjectSchema], default: [] },
    status: {
      type: String,
      enum: ['draft', 'published', 'completed'],
      default: 'draft',
    },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

const ExamMarkItemSchema = new Schema(
  {
    subject: { type: String, required: true },
    obtained: { type: Number, default: 0 },
    fullMarks: { type: Number, default: 100 },
    passMarks: { type: Number, default: 33 },
    grade: { type: String, default: 'F' },
    gradePoint: { type: Number, default: 0 },
    result: { type: String, enum: ['pass', 'fail'], default: 'fail' },
  },
  { _id: false }
);

const ExamMarkSchema = new Schema<IExamMark>(
  {
    exam: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    className: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    marks: { type: [ExamMarkItemSchema], default: [] },
    totalObtained: { type: Number, default: 0 },
    totalFull: { type: Number, default: 0 },
    gpa: { type: Number, default: 0 },
    grade: { type: String, default: 'F' },
    result: { type: String, enum: ['pass', 'fail'], default: 'fail' },
  },
  { timestamps: true }
);

ExamMarkSchema.index({ exam: 1, student: 1 }, { unique: true });

ExamSchema.index({ className: 1 });
ExamMarkSchema.index({ exam: 1, className: 1 });

export const Exam = model<IExam>('Exam', ExamSchema);
export const ExamMark = model<IExamMark>('ExamMark', ExamMarkSchema);
