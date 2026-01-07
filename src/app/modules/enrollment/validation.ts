import { z } from 'zod';

export const enrollmentValidationSchema = z.object({
  body: z.object({
    studentPhoto: z.string().optional(),
    mobileNo: z.string().optional(),
    rollNumber: z.string().optional(),
    studentName: z.string().optional(),
    nameBangla: z.string().optional(),
    gender: z.string().optional(),
    birthDate: z.string().optional(),
    birthRegistrationNo: z.string().optional(),
    bloodGroup: z.string().optional(),
    nationality: z.string().default('Bangladesh'),
    roll: z.string().optional(),
    batch: z.string().optional(),
    studentType: z.string().optional(),
    className: z.array(z.string()).optional(),
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

    paymentStatus: z.enum(['pending', 'paid']).default('pending'),
    studentDepartment: z.enum(['hifz', 'academic']).optional(),

    fatherName: z.string().optional(),
    fatherNameBangla: z.string().optional(),
    fatherMobile: z.string().optional(),
    fatherNid: z.string().optional(),
    fatherProfession: z.string().optional(),
    fatherIncome: z.number().optional(),
    motherName: z.string().optional(),
    motherNameBangla: z.string().optional(),
    motherMobile: z.string().optional(),
    motherNid: z.string().optional(),
    motherProfession: z.string().optional(),
    motherIncome: z.number().optional(),
    guardianInfo: z
      .object({
        name: z.string().optional(),
        relation: z.string().optional(),
        mobile: z.string().optional(),
        address: z.string().optional(),
      })
      .optional(),
    documents: z
      .object({
        birthCertificate: z.boolean().default(false),
        transferCertificate: z.boolean().default(false),
        characterCertificate: z.boolean().default(false),
        markSheet: z.boolean().default(false),
        photographs: z.boolean().default(false),
      })
      .optional(),
    previousSchool: z
      .object({
        institution: z.string().optional(),
        address: z.string().optional(),
      })
      .optional(),
    termsAccepted: z.boolean().default(false),
    promotedFrom: z.string().optional(),
    promotedTo: z.string().optional(),
    admissionType: z.enum(['admission', 'promotion']).default('admission'),
    status: z.enum(['active', 'passed', 'failed', 'left']).default('active'),
  }),
});
