import { Schema, model } from 'mongoose';
import { TAdmissionApplication } from './interface';

const admissionSchema = new Schema<TAdmissionApplication>(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
    },

    academicYear: {
      type: String,
      required: true,
    },

    studentInfo: {
      nameBangla: { type: String, required: true },
      nameEnglish: { type: String, required: true },
      dateOfBirth: { type: Date, required: true },
      age: { type: Number, required: true },
      gender: {
        type: String,
        enum: ['male', 'female', 'other'],
      },
      department: { type: String, required: true },
      class: { type: String, required: true },
      session: { type: String, required: true },
      nidBirth: String,
      bloodGroup: String,
      nationality: String,
      studentPhoto: String,
    },

    academicInfo: {
      previousSchool: String,
      previousClass: String,
      gpa: String,
    },

    parentInfo: {
      father: {
        nameBangla: { type: String, required: true },
        nameEnglish: { type: String, required: true },
        profession: String,
        education: String,
        mobile: { type: String, required: true },
        whatsapp: String,
      },
      mother: {
        nameBangla: { type: String, required: true },
        nameEnglish: { type: String, required: true },
        profession: String,
        education: String,
        mobile: String,
        whatsapp: String,
      },
      guardian: {
        nameBangla: String,
        nameEnglish: String,
        relation: String,
        mobile: String,
        whatsapp: String,
        profession: String,
        address: String,
      },
    },

    familyEnvironment: {
      halalIncome: String,
      parentsPrayer: String,
      addiction: String,
      tv: String,
      quranRecitation: String,
      purdah: String,
    },

    behaviorSkills: {
      mobileUsage: String,
      generalBehavior: String,
      obedience: String,
      elderBehavior: String,
      youngerBehavior: String,
      lyingStubbornness: String,
      studyInterest: String,
      religiousInterest: String,
      angerControl: String,
    },

    address: {
      present: {
        village: String,
        postOffice: String,
        postCode: String,
        policeStation: String,
        district: String,
      },
      permanent: {
        village: { type: String, required: true },
        postOffice: { type: String, required: true },
        postCode: String,
        policeStation: { type: String, required: true },
        district: { type: String, required: true },
      },
    },

    documents: {
      photographs: Boolean,
      birthCertificate: Boolean,
      markSheet: Boolean,
      transferCertificate: Boolean,
      characterCertificate: Boolean,
    },

    termsAccepted: {
      type: Boolean,
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);

export const AdmissionApplication = model<TAdmissionApplication>(
  'AdmissionApplication',
  admissionSchema,
);
