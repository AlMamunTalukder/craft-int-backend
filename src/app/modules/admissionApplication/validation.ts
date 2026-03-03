// import { z } from 'zod';

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
import { z } from 'zod';

const studentInfoSchema = z.object({
  nameBangla: z.string().min(1, 'Required'),
  nameEnglish: z.string().min(1, 'Required'),
  dateOfBirth: z.coerce.date(),
  age: z.number().min(0),
  gender: z.enum(['male', 'female', 'other']).optional(),
  department: z.string().min(1, 'Required'),
  class: z.string().min(1, 'Required'),
  session: z.string().min(1, 'Required'),
  nidBirth: z.string().optional(),
  bloodGroup: z.string().optional(),
  nationality: z.string().optional(),
  studentPhoto: z.string().optional(),
});

const parentInfoSchema = z.object({
  father: z.object({
    nameBangla: z.string().min(1, 'Required'),
    nameEnglish: z.string().min(1, 'Required'),
    profession: z.string().optional(),
    education: z.string().optional(),
   mobile: z.string().length(11, 'মোবাইল নম্বর ১১ ডিজিট হতে হবে'),
    whatsapp: z.string().optional(),
  }),
  mother: z.object({
    nameBangla: z.string().min(1, 'Required'),
    nameEnglish: z.string().min(1, 'Required'),
    profession: z.string().optional(),
    education: z.string().optional(),
   mobile: z.string().length(11, 'মোবাইল নম্বর ১১ ডিজিট হতে হবে'),
    whatsapp: z.string().optional(),
  }),
  guardian: z.object({
    nameBangla: z.string().optional(),
    nameEnglish: z.string().optional(),
    relation: z.string().optional(),
    mobile: z.string().length(11, 'মোবাইল নম্বর ১১ ডিজিট হতে হবে').optional(),
    whatsapp: z.string().optional(),
    profession: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
});

const addressSchema = z.object({
  present: z.object({
    village: z.string().optional(),
    postOffice: z.string().optional(),
    postCode: z.string().optional(),
    policeStation: z.string().optional(),
    district: z.string().optional(),
  }),
  permanent: z.object({
    village: z.string().min(1, 'Required'),
    postOffice: z.string().min(1, 'Required'),
    postCode: z.string().optional(),
    policeStation: z.string().min(1, 'Required'),
    district: z.string().min(1, 'Required'),
  }),
});

export const createAdmissionApplicationValidation = z.object({
  body: z.object({
    academicYear: z.string().min(1, 'Required'),
    studentInfo: studentInfoSchema,
    academicInfo: z
      .object({
        previousSchool: z.string().optional(),
        previousClass: z.string().optional(),
        gpa: z.string().optional(),
      })
      .optional(),
    parentInfo: parentInfoSchema,
    familyEnvironment: z
      .object({
        halalIncome: z.string().optional(),
        parentsPrayer: z.string().optional(),
        addiction: z.string().optional(),
        tv: z.string().optional(),
        quranRecitation: z.string().optional(),
        purdah: z.string().optional(),
      })
      .optional(),
    behaviorSkills: z
      .object({
        mobileUsage: z.string().optional(),
        generalBehavior: z.string().optional(),
        obedience: z.string().optional(),
        elderBehavior: z.string().optional(),
        youngerBehavior: z.string().optional(),
        lyingStubbornness: z.string().optional(),
        studyInterest: z.string().optional(),
        religiousInterest: z.string().optional(),
        angerControl: z.string().optional(),
      })
      .optional(),
    address: addressSchema,
    documents: z
      .object({
        photographs: z.boolean().optional(),
        birthCertificate: z.boolean().optional(),
        markSheet: z.boolean().optional(),
        transferCertificate: z.boolean().optional(),
        characterCertificate: z.boolean().optional(),
      })
      .optional(),
    termsAccepted: z.literal(true),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
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