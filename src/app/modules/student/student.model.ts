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
    gender: { type: String, },
    mobile: { type: String },
    fees: [{ type: Schema.Types.ObjectId, ref: 'Fees' }],
    bloodGroup: { type: String },
    studentPhoto: { type: String },
    fatherName: { type: String },
    fatherMobile: { type: String },
    fatherProfession: { type: String },
    motherName: { type: String },
    motherMobile: { type: String },
    motherProfession: { type: String },
    guardianInfo: {
      name: { type: String },
      relation: { type: String },
      mobile: { type: String },
      address: { type: String },
    },
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
    sameAsPermanent: { type: Boolean, default: false },
    className: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
    section: [{ type: String }],
    batch: { type: String },
    activeSession: [{ type: String }],
    studentClassRoll: { type: String },

    studentType: {
      type: String,
    },
    status: {
      type: String,
      // enum: ['active', 'passed', 'failed', 'left'],
      // default: 'active',
    },

    admissionFee: { type: Number, default: 0 },
    monthlyFee: { type: Number, default: 0 },
    sessionFee: { type: Number, default: 0 },
    residenceFee: { type: Number, default: 0 },
    transportFee: { type: Number, default: 0 },
    otherFee: { type: Number, default: 0 },
    previousDues: { type: Number, default: 0 },
    sendAdmissionSMS: { type: Boolean, default: false },
    sendAttendanceSMS: { type: Boolean, default: false },
    studentSerial: { type: String },
    additionalNote: { type: String },
  },
  { timestamps: true },
);

export const Student = model<IStudent>('Student', studentSchema);
