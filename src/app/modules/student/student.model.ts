import { model, Schema } from 'mongoose';
import { IStudent } from './student.interface';

const studentSchema = new Schema<IStudent>(
  {
    // ========== Core fields (unchanged) ==========
    studentId: { type: String },
    smartIdCard: { type: String },
    name: { type: String, required: true },
    nameBangla: { type: String },
    email: { type: String },
    studentDepartment: { type: String, enum: ['hifz', 'academic'] },
    birthDate: { type: String },
    birthRegistrationNo: { type: String },
    gender: { type: String },
    mobile: { type: String },
    fees: [{ type: Schema.Types.ObjectId, ref: 'Fees' }],
    payments: [{ type: Schema.Types.ObjectId, ref: 'Payment' }],
    receipts: [{ type: Schema.Types.ObjectId, ref: 'Receipt' }],
    advanceBalance: { type: Number, default: 0 },
    bloodGroup: { type: String },
    studentPhoto: { type: String },

    // --- Flat parent fields removed (now part of parentInfo) ---
    // fatherName, fatherMobile, fatherProfession, motherName, motherMobile, motherProfession, guardianInfo

    // Addresses
    presentAddress: {
      village: { type: String },
      postOffice: { type: String },
      postCode: { type: String },
      policeStation: { type: String },
      district: { type: String },
    },
    permanentAddress: {
      village: { type: String },
      postOffice: { type: String },
      postCode: { type: String },
      policeStation: { type: String },
      district: { type: String },
    },
    sameAsPermanent: { type: Boolean, default: false },

    // Documents (unchanged)
    documents: {
      birthCertificate: { type: Boolean, default: false },
      transferCertificate: { type: Boolean, default: false },
      characterCertificate: { type: Boolean, default: false },
      markSheet: { type: Boolean, default: false },
      photographs: { type: Boolean, default: false },
    },

    // Previous school (unchanged)
    previousSchool: {
      institution: { type: String },
      address: { type: String },
    },

    // Academic references
    className: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
    section: [{ type: String }],
    batch: { type: String },
    activeSession: [{ type: String }],
    studentClassRoll: { type: String },
    studentType: { type: String },
    status: { type: String },
    user: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    // ========== New fields from AdmissionApplication ==========
    // Application reference
    applicationId: { type: String, unique: true, sparse: true },

    // Academic year of admission
    academicYear: { type: String },

    // Age at admission (can be computed, but stored for history)
    age: { type: Number },

    // Department (e.g., 'science') – distinct from studentDepartment
    department: { type: String },

    // Class (e.g., 'Six') – distinct from className (which is ObjectId ref)
    class: { type: String },

    // Session (e.g., '2024-2025')
    session: { type: String },

    // National ID or birth registration number (alternative)
    nidBirth: { type: String },

    // Nationality
    nationality: { type: String },

    // Academic background (from admission form)
    academicInfo: {
      previousSchool: { type: String },
      previousClass: { type: String },
      gpa: { type: String },
    },

    // New structured parent information (replaces flat parent fields)
    parentInfo: {
      father: {
        nameBangla: { type: String },
        nameEnglish: { type: String },
        profession: { type: String },
        education: { type: String },
        mobile: { type: String },
        whatsapp: { type: String },
      },
      mother: {
        nameBangla: { type: String },
        nameEnglish: { type: String },
        profession: { type: String },
        education: { type: String },
        mobile: { type: String },
        whatsapp: { type: String },
      },
      guardian: {
        nameBangla: { type: String },
        nameEnglish: { type: String },
        relation: { type: String },
        mobile: { type: String },
        whatsapp: { type: String },
        profession: { type: String },
        address: { type: String },
      },
    },

    // Family environment questionnaire
    familyEnvironment: {
      halalIncome: { type: String },
      parentsPrayer: { type: String },
      addiction: { type: String },
      tv: { type: String },
      quranRecitation: { type: String },
      purdah: { type: String },
    },

    // Behavior & skills questionnaire
    behaviorSkills: {
      mobileUsage: { type: String },
      generalBehavior: { type: String },
      obedience: { type: String },
      elderBehavior: { type: String },
      youngerBehavior: { type: String },
      lyingStubbornness: { type: String },
      studyInterest: { type: String },
      religiousInterest: { type: String },
      angerControl: { type: String },
    },

    // Terms acceptance flag
    termsAccepted: { type: Boolean },

    // Admission status (separate from general student status)
    admissionStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'enrolled'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

export const Student = model<IStudent>('Student', studentSchema);
