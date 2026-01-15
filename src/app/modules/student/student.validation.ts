import { z } from 'zod';

export const createStudentValidation = z.object({
  body: z.object({
    name: z.string({ required_error: 'Student name is required' }),
    nameBangla: z.string().optional(),
    email: z.string().email().optional(),
    studentDepartment: z.enum(['hifz', 'academic']).optional(),
    birthDate: z.string().optional(),
    birthRegistrationNo: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    mobile: z.string().optional(),
    bloodGroup: z.string().optional(),
    studentPhoto: z.string().optional(),

    fatherName: z.string().optional(),
    fatherMobile: z.string().optional(),
    fatherProfession: z.string().optional(),
    motherName: z.string().optional(),
    motherMobile: z.string().optional(),
    motherProfession: z.string().optional(),

    guardianInfo: z
      .object({
        guardianName: z.string().optional(),
        guardianMobile: z.string().optional(),
        relation: z.string().optional(),
        address: z.string().optional(),
      })
      .optional(),

    presentAddress: z
      .object({
        village: z.string().optional(),
        postOffice: z.string().optional(),
        postCode: z.string().optional(),
        policeStation: z.string().optional(),
        district: z.string().optional(),
      })
      .optional(),

    permanentAddress: z
      .object({
        village: z.string().optional(),
        postOffice: z.string().optional(),
        postCode: z.string().optional(),
        policeStation: z.string().optional(),
        district: z.string().optional(),
      })
      .optional(),

    sameAsPermanent: z.boolean().default(false),

    className: z.array(z.string()).optional(),
    section: z.array(z.string()).optional(),
    batch: z.string().optional(),
    activeSession: z.array(z.string()).optional(),
    studentClassRoll: z.string().optional(),
    studentType: z.string().optional(),
    status: z.string().optional(),
  }),
});
