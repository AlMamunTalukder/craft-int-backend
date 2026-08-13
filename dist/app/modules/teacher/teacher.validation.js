"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherValidations = void 0;
const zod_1 = require("zod");
const objectIdOrArrayOrNull = zod_1.z.union([
    zod_1.z.string().min(1),
    zod_1.z.array(zod_1.z.string().min(1)),
    zod_1.z.null(),
]);
const addressSchema = zod_1.z.object({
    address: zod_1.z.string().optional(),
    village: zod_1.z.string().optional(),
    postOffice: zod_1.z.string().optional(),
    thana: zod_1.z.string().optional(),
    district: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    zipCode: zod_1.z.string().optional(),
});
const educationSchema = zod_1.z.object({
    degree: zod_1.z.string(),
    institution: zod_1.z.string(),
    year: zod_1.z.string(),
    specialization: zod_1.z.string().optional(),
});
const certificationSchema = zod_1.z.object({
    certificateName: zod_1.z.string(),
    issuedBy: zod_1.z.string(),
    year: zod_1.z.string(),
    description: zod_1.z.string().optional(),
});
const experienceSchema = zod_1.z.object({
    organization: zod_1.z.string(),
    position: zod_1.z.string(),
    from: zod_1.z.string(),
    to: zod_1.z.string(),
    description: zod_1.z.string().optional(),
});
const createTeacherValidation = zod_1.z.object({
    body: zod_1.z.object({
        teacherSerial: zod_1.z.number().optional(),
        smartIdCard: zod_1.z.string().optional(),
        name: zod_1.z.string({
            required_error: 'Name is required',
        }),
        phone: zod_1.z.string(),
        email: zod_1.z
            .string()
            .email('Invalid email format').optional(),
        dateOfBirth: zod_1.z.coerce.date().optional(),
        bloodGroup: zod_1.z.string().optional(),
        gender: zod_1.z
            .union([zod_1.z.enum(['Male', 'Female', 'Other']), zod_1.z.literal(''), zod_1.z.null()])
            .optional(),
        maritalStatus: zod_1.z
            .union([
            zod_1.z.enum(['Single', 'Married', 'Divorced', 'Widowed']),
            zod_1.z.literal(''),
            zod_1.z.null(),
        ])
            .optional(),
        nationality: zod_1.z.string().optional(),
        religion: zod_1.z.string().optional(),
        teacherPhoto: zod_1.z.string().optional(),
        // Address Information
        permanentAddress: addressSchema,
        currentAddress: addressSchema.optional(),
        sameAsPermanent: zod_1.z.boolean().optional(),
        // Professional Information
        designation: zod_1.z.string({
            required_error: 'Designation is required',
        }),
        department: zod_1.z.string({
            required_error: 'Department is required',
        }),
        joiningDate: zod_1.z.coerce.date({
            required_error: 'Joining date is required',
        }),
        monthlySalary: zod_1.z.number({
            required_error: 'Monthly salary is required',
        }),
        staffType: zod_1.z.enum(['Teacher', 'Staff', 'Other'], {
            required_error: 'Staff type is required',
        }),
        // Educational Information
        educationalQualifications: zod_1.z.array(educationSchema).optional(),
        certifications: zod_1.z.array(certificationSchema).optional(),
        workExperience: zod_1.z.array(experienceSchema).optional(),
        section: objectIdOrArrayOrNull.optional(),
        class: objectIdOrArrayOrNull.optional(),
        schedule: objectIdOrArrayOrNull.optional(),
        assignment: objectIdOrArrayOrNull.optional(),
        attendance: objectIdOrArrayOrNull.optional(),
        room: objectIdOrArrayOrNull.optional(),
        // Additional Information
        status: zod_1.z
            .enum(['Active', 'Inactive'], {
            required_error: 'Status is required',
        })
            .default('Active'),
        language: zod_1.z.enum(['Bangla', 'English', 'Other']).optional(),
        activeSession: zod_1.z.string().optional(),
    }),
});
const updateTeacherValidation = zod_1.z.object({
    body: zod_1.z.object({
        // Basic Information
        teacherId: zod_1.z.string().optional(),
        teacherSerial: zod_1.z.number().optional(),
        smartIdCard: zod_1.z.string().optional(),
        name: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        email: zod_1.z.string().email('Invalid email format').optional(),
        dateOfBirth: zod_1.z.coerce.date().optional(),
        bloodGroup: zod_1.z.string().optional(),
        nationality: zod_1.z.string().optional(),
        religion: zod_1.z.string().optional(),
        teacherPhoto: zod_1.z.string().optional(),
        gender: zod_1.z
            .union([zod_1.z.enum(['Male', 'Female', 'Other']), zod_1.z.literal(''), zod_1.z.null()])
            .optional(),
        maritalStatus: zod_1.z
            .union([
            zod_1.z.enum(['Single', 'Married', 'Divorced', 'Widowed']),
            zod_1.z.literal(''),
            zod_1.z.null(),
        ])
            .optional(),
        // Address Information
        permanentAddress: addressSchema.optional(),
        currentAddress: addressSchema.optional(),
        sameAsPermanent: zod_1.z.boolean().optional(),
        // Professional Information
        designation: zod_1.z.string().optional(),
        department: zod_1.z.string().optional(),
        joiningDate: zod_1.z.coerce.date().optional(),
        monthlySalary: zod_1.z.number().optional(),
        staffType: zod_1.z.enum(['Teacher', 'Staff', 'Other']).optional(),
        // Educational Information
        educationalQualifications: zod_1.z.array(educationSchema).optional(),
        certifications: zod_1.z.array(certificationSchema).optional(),
        workExperience: zod_1.z.array(experienceSchema).optional(),
        section: objectIdOrArrayOrNull.optional(),
        class: objectIdOrArrayOrNull.optional(),
        schedule: objectIdOrArrayOrNull.optional(),
        assignment: objectIdOrArrayOrNull.optional(),
        attendance: objectIdOrArrayOrNull.optional(),
        room: objectIdOrArrayOrNull.optional(),
        // Additional Information
        status: zod_1.z.enum(['Active', 'Inactive']).optional(),
        language: zod_1.z.enum(['Bangla', 'English', 'Other']).optional(),
        activeSession: zod_1.z.string().optional(),
    }),
});
exports.TeacherValidations = {
    createTeacherValidation,
    updateTeacherValidation,
};
