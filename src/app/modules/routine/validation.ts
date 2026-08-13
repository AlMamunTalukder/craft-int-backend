import { z } from 'zod';

const periodSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  teacher: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  room: z.string().optional(),
  isBreak: z.boolean().optional(),
});

const createRoutineValidation = z.object({
  body: z.object({
    className: z.string().min(1, 'Class is required'),
    section: z.string().optional(),
    day: z.string().min(1, 'Day is required'),
    academicYear: z.string().min(1, 'Academic year is required'),
    periods: z.array(periodSchema).default([]),
  }),
});

const updateRoutineValidation = z.object({
  body: z.object({
    className: z.string().optional(),
    section: z.string().optional(),
    day: z.string().optional(),
    academicYear: z.string().optional(),
    periods: z.array(periodSchema).optional(),
  }),
});

export const routineValidations = {
  createRoutineValidation,
  updateRoutineValidation,
};
