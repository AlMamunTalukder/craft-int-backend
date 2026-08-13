"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAdmissionSchema = void 0;
const zod_1 = require("zod");
// Address Schema (all optional, allow null)
const AddressSchema = zod_1.z.object({
    village: zod_1.z.string().nullable().optional(),
    postOffice: zod_1.z.string().nullable().optional(),
    postCode: zod_1.z.string().nullable().optional(),
    policeStation: zod_1.z.string().nullable().optional(),
    district: zod_1.z.string().nullable().optional(),
});
exports.CreateAdmissionSchema = zod_1.z.object({
    body: zod_1.z.object({
        // Student Information
        studentNameBangla: zod_1.z.string().nullable().optional(),
        fatherNameBangla: zod_1.z.string().nullable().optional(),
        motherNameBangla: zod_1.z.string().nullable().optional(),
        studentName: zod_1.z.string().nullable().optional(),
        mobileNo: zod_1.z.string().nullable().optional(),
        class: zod_1.z.array(zod_1.z.string().nullable()).nullable().optional(),
        session: zod_1.z.string().nullable().optional(),
        category: zod_1.z.string().nullable().optional(),
        dateOfBirth: zod_1.z.coerce.date().nullable().optional(),
        nidBirth: zod_1.z.string().nullable().optional(),
        bloodGroup: zod_1.z.string().nullable().optional(),
        nationality: zod_1.z.string().nullable().optional(),
        paymentStatus: zod_1.z.string().optional(),
        admissionFee: zod_1.z.number().optional(),
        monthlyFee: zod_1.z.number().optional(),
        // Parent Information
        fatherName: zod_1.z.string().nullable().optional(),
        fatherMobile: zod_1.z.string().nullable().optional(),
        fatherNid: zod_1.z.string().nullable().optional(),
        fatherProfession: zod_1.z.string().nullable().optional(),
        fatherIncome: zod_1.z.number().nullable().optional(),
        motherName: zod_1.z.string().nullable().optional(),
        motherMobile: zod_1.z.string().nullable().optional(),
        motherNid: zod_1.z.string().nullable().optional(),
        motherProfession: zod_1.z.string().nullable().optional(),
        motherIncome: zod_1.z.number().nullable().optional(),
        // Addresses
        presentAddress: AddressSchema.nullable().optional(),
        permanentAddress: AddressSchema.nullable().optional(),
        // Guardian Information
        guardianInfo: zod_1.z
            .object({
            name: zod_1.z.string().nullable().optional(),
            relation: zod_1.z.string().nullable().optional(),
            mobile: zod_1.z.string().nullable().optional(),
            address: zod_1.z.string().nullable().optional(),
        })
            .nullable()
            .optional(),
        // Previous School
        previousSchool: zod_1.z
            .object({
            institution: zod_1.z.string().nullable().optional(),
            address: zod_1.z.string().nullable().optional(),
        })
            .nullable()
            .optional(),
        // Documents
        documents: zod_1.z
            .object({
            birthCertificate: zod_1.z.boolean().nullable().optional(),
            transferCertificate: zod_1.z.boolean().nullable().optional(),
            characterCertificate: zod_1.z.boolean().nullable().optional(),
            markSheet: zod_1.z.boolean().nullable().optional(),
            photographs: zod_1.z.boolean().nullable().optional(),
        })
            .nullable()
            .optional(),
        // Terms
        termsAccepted: zod_1.z.boolean().nullable().optional(),
    }),
});
