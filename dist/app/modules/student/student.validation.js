"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStudentValidation = void 0;
const zod_1 = require("zod");
exports.createStudentValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'Student name is required' }),
        nameBangla: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        studentDepartment: zod_1.z.enum(['hifz', 'academic']).optional(),
        birthDate: zod_1.z.string().optional(),
        birthRegistrationNo: zod_1.z.string().optional(),
        gender: zod_1.z.enum(['male', 'female', 'other']).optional(),
        mobile: zod_1.z.string().optional(),
        bloodGroup: zod_1.z.string().optional(),
        studentPhoto: zod_1.z.string().optional(),
        fatherName: zod_1.z.string().optional(),
        fatherMobile: zod_1.z.string().optional(),
        fatherProfession: zod_1.z.string().optional(),
        motherName: zod_1.z.string().optional(),
        motherMobile: zod_1.z.string().optional(),
        motherProfession: zod_1.z.string().optional(),
        guardianInfo: zod_1.z
            .object({
            guardianName: zod_1.z.string().optional(),
            guardianMobile: zod_1.z.string().optional(),
            relation: zod_1.z.string().optional(),
            address: zod_1.z.string().optional(),
        })
            .optional(),
        presentAddress: zod_1.z
            .object({
            village: zod_1.z.string().optional(),
            postOffice: zod_1.z.string().optional(),
            postCode: zod_1.z.string().optional(),
            policeStation: zod_1.z.string().optional(),
            district: zod_1.z.string().optional(),
        })
            .optional(),
        permanentAddress: zod_1.z
            .object({
            village: zod_1.z.string().optional(),
            postOffice: zod_1.z.string().optional(),
            postCode: zod_1.z.string().optional(),
            policeStation: zod_1.z.string().optional(),
            district: zod_1.z.string().optional(),
        })
            .optional(),
        sameAsPermanent: zod_1.z.boolean().default(false),
        className: zod_1.z.array(zod_1.z.string()).optional(),
        section: zod_1.z.array(zod_1.z.string()).optional(),
        batch: zod_1.z.string().optional(),
        activeSession: zod_1.z.array(zod_1.z.string()).optional(),
        studentClassRoll: zod_1.z.string().optional(),
        studentType: zod_1.z.string().optional(),
        status: zod_1.z.string().optional(),
    }),
});
