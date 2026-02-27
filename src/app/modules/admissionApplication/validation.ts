import { z } from 'zod';

const studentInfoSchema = z.object({
  nameBangla: z.string(),
  nameEnglish: z.string(),
  dateOfBirth: z.coerce.date(),
  age: z.number(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  department: z.string(),
  class: z.string(),
  session: z.string(),
  nidBirth: z.string().optional(),
  bloodGroup: z.string().optional(),
  nationality: z.string().optional(),
  studentPhoto: z.string().optional(),
});

const parentInfoSchema = z.object({
  father: z.object({
    nameBangla: z.string(),
    nameEnglish: z.string(),
    mobile: z.string(),
    profession: z.string().optional(),
    education: z.string().optional(),
    whatsapp: z.string().optional(),
  }),
  mother: z.object({
    nameBangla: z.string(),
    nameEnglish: z.string(),
    mobile: z.string().optional(),
    profession: z.string().optional(),
    education: z.string().optional(),
    whatsapp: z.string().optional(),
  }),
});

const createAdmissionApplicationValidation = z.object({
  body: z.object({
    academicYear: z.string(),
    studentInfo: studentInfoSchema,
    parentInfo: parentInfoSchema,
    termsAccepted: z.literal(true),
  }),
});

const updateAdmissionApplicationValidation = z.object({
  body: z.object({
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
  }),
});

export const AdmissionApplicationValidations = {
  createAdmissionApplicationValidation,
  updateAdmissionApplicationValidation,
};
