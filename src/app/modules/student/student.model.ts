
import { model, Schema } from 'mongoose';
import { IStudent } from './student.interface';

const studentSchema = new Schema<IStudent>(
  {
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
    documents: {
      birthCertificate: { type: Boolean, default: false },
      transferCertificate: { type: Boolean, default: false },
      characterCertificate: { type: Boolean, default: false },
      markSheet: { type: Boolean, default: false },
      photographs: { type: Boolean, default: false },
    },
    previousSchool: {
      institution: { type: String },
      address: { type: String },
    },
    className: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
    section: [{ type: String }],
    batch: { type: String },
    activeSession: [{ type: String }],
    category: {
      type: String
    },
    studentClassRoll: { type: String },
    studentType: { type: String },
    status: { type: String },
    user: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    applicationId: { type: String, unique: true, sparse: true },
    academicYear: { type: String },
    age: { type: Number },
    department: { type: String },
    class: { type: String },
    session: { type: String },
    nidBirth: { type: String },
    nationality: { type: String },
    academicInfo: {
      previousSchool: { type: String },
      previousClass: { type: String },
      gpa: { type: String },
    },
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
    familyEnvironment: {
      halalIncome: { type: String },
      parentsPrayer: { type: String },
      addiction: { type: String },
      tv: { type: String },
      quranRecitation: { type: String },
      purdah: { type: String },
    },
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
    termsAccepted: { type: Boolean },
    admissionStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'enrolled'],
      default: 'pending',
    },

    mealAttendances: {
      type: [{ type: Schema.Types.ObjectId, ref: 'MealAttendance' }],
      select: false,
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

studentSchema.virtual('mealAttendanceList', {
  ref: 'MealAttendance',
  localField: '_id',
  foreignField: 'student',
  justOne: false,
});

export const Student = model<IStudent>('Student', studentSchema);