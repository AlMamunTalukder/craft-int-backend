import { z } from 'zod';

const createCertificateValidation = z.object({
  body: z.object({
    certificateType: z.string().min(1, 'Certificate type is required'),
    student: z.string().min(1, 'Student is required'),
    academicYear: z.string().optional(),
    issueDate: z.string().optional(),
    issuedBy: z.string().optional(),
    data: z.record(z.string(), z.any()).optional(),
  }),
});

const updateCertificateValidation = z.object({
  body: z.object({
    certificateType: z.string().optional(),
    student: z.string().optional(),
    academicYear: z.string().optional(),
    issueDate: z.string().optional(),
    issuedBy: z.string().optional(),
    data: z.record(z.string(), z.any()).optional(),
  }),
});

export const certificateValidations = {
  createCertificateValidation,
  updateCertificateValidation,
};
