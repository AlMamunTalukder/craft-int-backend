import { z } from 'zod';

const subjectSchema = z.object({
  subject: z.string().min(1, 'Subject name is required'),
  fullMarks: z.number().min(1),
  passMarks: z.number().min(0),
});

const createExamValidation = z.object({
  body: z.object({
    name: z.string().min(1, 'Exam name is required'),
    examType: z.string().min(1, 'Exam type is required'),
    className: z.string().min(1, 'Class is required'),
    department: z.string().optional(),
    academicYear: z.string().min(1, 'Academic year is required'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    subjects: z.array(subjectSchema).min(1, 'At least one subject is required'),
    status: z.string().optional(),
  }),
});

const updateExamValidation = z.object({
  body: z.object({
    name: z.string().optional(),
    examType: z.string().optional(),
    className: z.string().optional(),
    department: z.string().optional(),
    academicYear: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    subjects: z.array(subjectSchema).optional(),
    status: z.string().optional(),
  }),
});

const upsertMarksValidation = z.object({
  body: z.object({
    examId: z.string().min(1),
    className: z.string().min(1),
    entries: z
      .array(
        z.object({
          student: z.string().min(1),
          marks: z
            .array(
              z.object({
                subject: z.string().min(1),
                obtained: z.number().min(0),
              }),
            )
            .min(1),
        }),
      )
      .min(1),
  }),
});

const publishExamValidation = z.object({
  body: z.object({
    status: z.enum(['draft', 'published', 'completed']),
  }),
});

export const examValidations = {
  createExamValidation,
  updateExamValidation,
  upsertMarksValidation,
  publishExamValidation,
};
