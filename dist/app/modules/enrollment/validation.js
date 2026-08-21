"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollmentValidationSchema = exports.updateEnrollmentValidationSchema = exports.createEnrollmentValidationSchema = void 0;
const zod_1 = require("zod");
// ── Reusable sub-schemas ──────────────────────────────────────────────────────
const addressSchema = zod_1.z
    .object({
    village: zod_1.z.string().optional(),
    postOffice: zod_1.z.string().optional(),
    postCode: zod_1.z.string().optional(),
    policeStation: zod_1.z.string().optional(),
    district: zod_1.z.string().optional(),
})
    .optional();
const documentsSchema = zod_1.z
    .object({
    birthCertificate: zod_1.z.boolean().default(false),
    transferCertificate: zod_1.z.boolean().default(false),
    characterCertificate: zod_1.z.boolean().default(false),
    markSheet: zod_1.z.boolean().default(false),
    photographs: zod_1.z.boolean().default(false),
})
    .optional();
const guardianSchema = zod_1.z
    .object({
    name: zod_1.z.string().optional(),
    relation: zod_1.z.string().optional(),
    mobile: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
})
    .optional();
const previousSchoolSchema = zod_1.z
    .object({
    institution: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
})
    .optional();
// ── Fee item schema ───────────────────────────────────────────────────────────
// Each item inside a fee group (one row in the form table)
const feeItemSchema = zod_1.z.object({
    feeType: zod_1.z
        .union([
        zod_1.z.string(),
        zod_1.z.object({
            label: zod_1.z.string().optional(),
            value: zod_1.z.string().optional(),
        }),
    ])
        .optional(),
    amount: zod_1.z.number().optional().default(0),
    discount: zod_1.z.number().optional().default(0),
    advanceAmount: zod_1.z.number().optional().default(0),
    isMonthly: zod_1.z.boolean().optional().default(false),
    discountRangeStart: zod_1.z.string().optional().default(''),
    discountRangeEnd: zod_1.z.string().optional().default(''),
    discountRangeAmount: zod_1.z.number().optional().default(0),
    className: zod_1.z.string().optional().default(''),
});
// ── Fee group schema ──────────────────────────────────────────────────────────
// One "category block" in the form (can contain multiple feeItems)
const feeGroupSchema = zod_1.z.object({
    category: zod_1.z.string().optional().default(''),
    className: zod_1.z.string().optional().default(''),
    feeItems: zod_1.z.array(feeItemSchema).optional().default([]),
});
// ── Shared body fields ────────────────────────────────────────────────────────
// Used by both create and update so we keep them in one place.
const sharedEnrollmentBodyFields = {
    // Student info
    studentPhoto: zod_1.z.string().optional(),
    mobileNo: zod_1.z.string().optional(),
    rollNumber: zod_1.z.string().optional(),
    studentName: zod_1.z.string().optional(),
    nameBangla: zod_1.z.string().optional(),
    gender: zod_1.z.string().optional(),
    birthDate: zod_1.z.string().optional(),
    birthRegistrationNo: zod_1.z.string().optional(),
    bloodGroup: zod_1.z.string().optional(),
    nationality: zod_1.z.string().default('Bangladesh'),
    roll: zod_1.z.string().optional(),
    batch: zod_1.z.string().optional(),
    studentType: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    section: zod_1.z.string().optional(),
    session: zod_1.z.string().optional(),
    group: zod_1.z.string().optional(),
    shift: zod_1.z.string().optional(),
    optionalSubject: zod_1.z.string().optional(),
    studentDepartment: zod_1.z.enum(['hifz', 'academic']).optional(),
    // className: array of ObjectId strings sent from the frontend
    className: zod_1.z.array(zod_1.z.string()).optional(),
    // Parent info
    fatherName: zod_1.z.string().optional(),
    fatherNameBangla: zod_1.z.string().optional(),
    fatherMobile: zod_1.z.string().optional(),
    fatherNid: zod_1.z.string().optional(),
    fatherProfession: zod_1.z.string().optional(),
    fatherIncome: zod_1.z.number().optional(),
    motherName: zod_1.z.string().optional(),
    motherNameBangla: zod_1.z.string().optional(),
    motherMobile: zod_1.z.string().optional(),
    motherNid: zod_1.z.string().optional(),
    motherProfession: zod_1.z.string().optional(),
    motherIncome: zod_1.z.number().optional(),
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
    termsAccepted: zod_1.z.boolean().default(false),
    promotedFrom: zod_1.z.string().optional(),
    promotedTo: zod_1.z.string().optional(),
    admissionType: zod_1.z.enum(['admission', 'promotion']).default('admission'),
    status: zod_1.z.enum(['active', 'passed', 'failed', 'left']).default('active'),
    // ── Fee fields (THE MISSING ONES) ─────────────────────────────────────────
    fees: zod_1.z.array(feeGroupSchema).optional().default([]),
    paidAmount: zod_1.z.number().optional().default(0),
    totalAmount: zod_1.z.number().optional().default(0),
    totalDiscount: zod_1.z.number().optional().default(0),
    dueAmount: zod_1.z.number().optional().default(0),
    netPayable: zod_1.z.number().optional().default(0),
    monthlyAmount: zod_1.z.number().optional().default(0),
    advanceBalance: zod_1.z.number().optional().default(0),
    // paymentMethod: frontend sends { label, value } object OR a plain string
    paymentMethod: zod_1.z
        .union([
        zod_1.z.string(),
        zod_1.z.object({
            label: zod_1.z.string().optional(),
            value: zod_1.z.string().optional(),
        }),
    ])
        .optional(),
    collectedBy: zod_1.z.string().optional(),
};
// ── CREATE schema ─────────────────────────────────────────────────────────────
exports.createEnrollmentValidationSchema = zod_1.z.object({
    body: zod_1.z.object(Object.assign(Object.assign({}, sharedEnrollmentBodyFields), { 
        // studentName is required on create
        studentName: zod_1.z.string({ required_error: 'Student name is required' }), mobileNo: zod_1.z.string({ required_error: 'Mobile number is required' }) })),
});
// ── UPDATE schema ─────────────────────────────────────────────────────────────
// Everything is optional on update — only send what changed.
exports.updateEnrollmentValidationSchema = zod_1.z.object({
    body: zod_1.z.object(sharedEnrollmentBodyFields),
});
// Keep the old export name so the router import doesn't break
exports.enrollmentValidationSchema = exports.updateEnrollmentValidationSchema;
