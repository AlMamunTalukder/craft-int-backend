import { z } from 'zod';

// ── Reusable sub-schemas ──────────────────────────────────────────────────────

const addressSchema = z
  .object({
    village: z.string().optional(),
    postOffice: z.string().optional(),
    postCode: z.string().optional(),
    policeStation: z.string().optional(),
    district: z.string().optional(),
  })
  .optional();

const documentsSchema = z
  .object({
    birthCertificate: z.boolean().default(false),
    transferCertificate: z.boolean().default(false),
    characterCertificate: z.boolean().default(false),
    markSheet: z.boolean().default(false),
    photographs: z.boolean().default(false),
  })
  .optional();

const guardianSchema = z
  .object({
    name: z.string().optional(),
    relation: z.string().optional(),
    mobile: z.string().optional(),
    address: z.string().optional(),
  })
  .optional();

const previousSchoolSchema = z
  .object({
    institution: z.string().optional(),
    address: z.string().optional(),
  })
  .optional();

// ── Fee item schema ───────────────────────────────────────────────────────────
// Each item inside a fee group (one row in the form table)
const feeItemSchema = z.object({
  feeType: z
    .union([
      z.string(),
      z.object({
        label: z.string().optional(),
        value: z.string().optional(),
      }),
    ])
    .optional(),
  amount: z.number().optional().default(0),
  discount: z.number().optional().default(0),
  advanceAmount: z.number().optional().default(0),
  isMonthly: z.boolean().optional().default(false),
  discountRangeStart: z.string().optional().default(''),
  discountRangeEnd: z.string().optional().default(''),
  discountRangeAmount: z.number().optional().default(0),
  className: z.string().optional().default(''),
});

// ── Fee group schema ──────────────────────────────────────────────────────────
// One "category block" in the form (can contain multiple feeItems)
const feeGroupSchema = z.object({
  category: z.string().optional().default(''),
  className: z.string().optional().default(''),
  feeItems: z.array(feeItemSchema).optional().default([]),
});

// ── Shared body fields ────────────────────────────────────────────────────────
// Used by both create and update so we keep them in one place.
const sharedEnrollmentBodyFields = {
  // Student info
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
  category: z.string().optional(),
  section: z.string().optional(),
  session: z.string().optional(),
  group: z.string().optional(),
  shift: z.string().optional(),
  optionalSubject: z.string().optional(),
  studentDepartment: z.enum(['hifz', 'academic']).optional(),

  // className: array of ObjectId strings sent from the frontend
  className: z.array(z.string()).optional(),

  // Parent info
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

  // Address
  presentAddress: addressSchema,
  permanentAddress: addressSchema,

  // Guardian
  guardianInfo: guardianSchema,

  // Documents
  documents: documentsSchema,

  // Previous school
  previousSchool: previousSchoolSchema,

  // Misc
  termsAccepted: z.boolean().default(false),
  promotedFrom: z.string().optional(),
  promotedTo: z.string().optional(),
  admissionType: z.enum(['admission', 'promotion']).default('admission'),
  status: z.enum(['active', 'passed', 'failed', 'left']).default('active'),

  // ── Fee fields (THE MISSING ONES) ─────────────────────────────────────────
  fees: z.array(feeGroupSchema).optional().default([]),
  paidAmount: z.number().optional().default(0),
  totalAmount: z.number().optional().default(0),
  totalDiscount: z.number().optional().default(0),
  dueAmount: z.number().optional().default(0),
  netPayable: z.number().optional().default(0),
  monthlyAmount: z.number().optional().default(0),
  advanceBalance: z.number().optional().default(0),

  // paymentMethod: frontend sends { label, value } object OR a plain string
  paymentMethod: z
    .union([
      z.string(),
      z.object({
        label: z.string().optional(),
        value: z.string().optional(),
      }),
    ])
    .optional(),

  collectedBy: z.string().optional(),
};

// ── CREATE schema ─────────────────────────────────────────────────────────────
export const createEnrollmentValidationSchema = z.object({
  body: z.object({
    ...sharedEnrollmentBodyFields,
    // studentName is required on create
    studentName: z.string({ required_error: 'Student name is required' }),
    mobileNo: z.string({ required_error: 'Mobile number is required' }),
  }),
});

// ── UPDATE schema ─────────────────────────────────────────────────────────────
// Everything is optional on update — only send what changed.
export const updateEnrollmentValidationSchema = z.object({
  body: z.object(sharedEnrollmentBodyFields),
});

// Keep the old export name so the router import doesn't break
export const enrollmentValidationSchema = updateEnrollmentValidationSchema;
