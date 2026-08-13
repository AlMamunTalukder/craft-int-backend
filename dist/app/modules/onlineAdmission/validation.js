"use strict";
// import { z } from 'zod';
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionApplicationValidations = exports.createAdmissionApplicationValidation = void 0;
// const studentInfoSchema = z.object({
//   nameBangla: z.string(),
//   nameEnglish: z.string(),
//   dateOfBirth: z.coerce.date(),
//   age: z.number(),
//   gender: z.enum(['male', 'female', 'other']).optional(),
//   department: z.string(),
//   class: z.string(),
//   session: z.string(),
//   nidBirth: z.string().optional(),
//   bloodGroup: z.string().optional(),
//   nationality: z.string().optional(),
//   studentPhoto: z.string().optional(),
// });
// const parentInfoSchema = z.object({
//   father: z.object({
//     nameBangla: z.string(),
//     nameEnglish: z.string(),
//     mobile: z.string(),
//     profession: z.string().optional(),
//     education: z.string().optional(),
//     whatsapp: z.string().optional(),
//   }),
//   mother: z.object({
//     nameBangla: z.string(),
//     nameEnglish: z.string(),
//     mobile: z.string().optional(),
//     profession: z.string().optional(),
//     education: z.string().optional(),
//     whatsapp: z.string().optional(),
//   }),
// });
// const createAdmissionApplicationValidation = z.object({
//   body: z.object({
//     academicYear: z.string(),
//     studentInfo: studentInfoSchema,
//     parentInfo: parentInfoSchema,
//     termsAccepted: z.literal(true),
//   }),
// });
// const updateAdmissionApplicationValidation = z.object({
//   body: z.object({
//     status: z.enum(['pending', 'approved', 'rejected']).optional(),
//   }),
// });
// export const AdmissionApplicationValidations = {
//   createAdmissionApplicationValidation,
//   updateAdmissionApplicationValidation,
// };
// admissionApplication/validation.ts
const zod_1 = require("zod");
const studentInfoSchema = zod_1.z.object({
    nameBangla: zod_1.z.string().min(1, 'Required'),
    nameEnglish: zod_1.z.string().min(1, 'Required'),
    dateOfBirth: zod_1.z.coerce.date(),
    age: zod_1.z.number().min(0),
    gender: zod_1.z.enum(['male', 'female', 'other']).optional(),
    department: zod_1.z.string().min(1, 'Required'),
    class: zod_1.z.string().min(1, 'Required'),
    session: zod_1.z.string().min(1, 'Required'),
    nidBirth: zod_1.z.string().optional(),
    bloodGroup: zod_1.z.string().optional(),
    nationality: zod_1.z.string().optional(),
    studentPhoto: zod_1.z.string().optional(),
});
const parentInfoSchema = zod_1.z.object({
    father: zod_1.z.object({
        nameBangla: zod_1.z.string().min(1, 'Required'),
        nameEnglish: zod_1.z.string().min(1, 'Required'),
        profession: zod_1.z.string().optional(),
        education: zod_1.z.string().optional(),
        mobile: zod_1.z.string().length(11, 'মোবাইল নম্বর ১১ ডিজিট হতে হবে'),
        whatsapp: zod_1.z.string().optional(),
    }),
    mother: zod_1.z.object({
        nameBangla: zod_1.z.string().min(1, 'Required'),
        nameEnglish: zod_1.z.string().min(1, 'Required'),
        profession: zod_1.z.string().optional(),
        education: zod_1.z.string().optional(),
        mobile: zod_1.z.string().length(11, 'মোবাইল নম্বর ১১ ডিজিট হতে হবে'),
        whatsapp: zod_1.z.string().optional(),
    }),
    guardian: zod_1.z.object({
        nameBangla: zod_1.z.string().optional(),
        nameEnglish: zod_1.z.string().optional(),
        relation: zod_1.z.string().optional(),
        mobile: zod_1.z.string().length(11, 'মোবাইল নম্বর ১১ ডিজিট হতে হবে').optional(),
        whatsapp: zod_1.z.string().optional(),
        profession: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
    }).optional(),
});
const addressSchema = zod_1.z.object({
    present: zod_1.z.object({
        village: zod_1.z.string().optional(),
        postOffice: zod_1.z.string().optional(),
        postCode: zod_1.z.string().optional(),
        policeStation: zod_1.z.string().optional(),
        district: zod_1.z.string().optional(),
    }),
    permanent: zod_1.z.object({
        village: zod_1.z.string().min(1, 'Required'),
        postOffice: zod_1.z.string().min(1, 'Required'),
        postCode: zod_1.z.string().optional(),
        policeStation: zod_1.z.string().min(1, 'Required'),
        district: zod_1.z.string().min(1, 'Required'),
    }),
});
exports.createAdmissionApplicationValidation = zod_1.z.object({
    body: zod_1.z.object({
        academicYear: zod_1.z.string().min(1, 'Required'),
        studentInfo: studentInfoSchema,
        academicInfo: zod_1.z
            .object({
            previousSchool: zod_1.z.string().optional(),
            previousClass: zod_1.z.string().optional(),
            gpa: zod_1.z.string().optional(),
        })
            .optional(),
        parentInfo: parentInfoSchema,
        familyEnvironment: zod_1.z
            .object({
            halalIncome: zod_1.z.string().optional(),
            parentsPrayer: zod_1.z.string().optional(),
            addiction: zod_1.z.string().optional(),
            tv: zod_1.z.string().optional(),
            quranRecitation: zod_1.z.string().optional(),
            purdah: zod_1.z.string().optional(),
        })
            .optional(),
        behaviorSkills: zod_1.z
            .object({
            mobileUsage: zod_1.z.string().optional(),
            generalBehavior: zod_1.z.string().optional(),
            obedience: zod_1.z.string().optional(),
            elderBehavior: zod_1.z.string().optional(),
            youngerBehavior: zod_1.z.string().optional(),
            lyingStubbornness: zod_1.z.string().optional(),
            studyInterest: zod_1.z.string().optional(),
            religiousInterest: zod_1.z.string().optional(),
            angerControl: zod_1.z.string().optional(),
        })
            .optional(),
        address: addressSchema,
        documents: zod_1.z
            .object({
            photographs: zod_1.z.boolean().optional(),
            birthCertificate: zod_1.z.boolean().optional(),
            markSheet: zod_1.z.boolean().optional(),
            transferCertificate: zod_1.z.boolean().optional(),
            characterCertificate: zod_1.z.boolean().optional(),
        })
            .optional(),
        termsAccepted: zod_1.z.literal(true),
        status: zod_1.z.enum(['pending', 'approved', 'rejected']).optional(),
    }),
});
const updateAdmissionApplicationValidation = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(['pending', 'approved', 'rejected', 'enrolled']).optional(),
    }),
});
exports.AdmissionApplicationValidations = {
    createAdmissionApplicationValidation: exports.createAdmissionApplicationValidation,
    updateAdmissionApplicationValidation,
};
