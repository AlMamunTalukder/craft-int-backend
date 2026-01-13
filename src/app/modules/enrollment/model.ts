import { Schema, model } from 'mongoose';
import { IEnrollment } from './interface';

const enrollmentSchema = new Schema<IEnrollment>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'Student' },
    studentPhoto: {
      type: String,
    },
    studentId: { type: String },
    mobileNo: { type: String },
    rollNumber: { type: String },
    studentName: { type: String },
    nameBangla: { type: String },
    gender: { type: String },
    birthDate: { type: String },
    birthRegistrationNo: { type: String },
    bloodGroup: { type: String },
    nationality: { type: String, default: 'Bangladesh' },
    className: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
    section: { type: String },
    roll: { type: String },
    session: { type: String },
    batch: { type: String },
    studentType: {
      type: String,
    },
    fees: [{ type: Schema.Types.ObjectId, ref: 'Fees' }],
    paymentStatus: { type: String, default: 'pending' },
    fatherName: { type: String },
    fatherNameBangla: { type: String },
    fatherMobile: { type: String },
    fatherNid: { type: String },
    fatherProfession: { type: String },
    fatherIncome: { type: Number },
    motherName: { type: String },
    motherNameBangla: { type: String },
    motherMobile: { type: String },
    motherNid: { type: String },
    motherProfession: { type: String },
    motherIncome: { type: Number },
    studentDepartment: {
      type: String,
    },
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

    termsAccepted: { type: Boolean, default: false },

    promotedFrom: { type: Schema.Types.ObjectId, ref: 'Enrollment' },
    promotedTo: { type: Schema.Types.ObjectId, ref: 'Enrollment' },
    admissionType: {
      type: String,
      enum: ['admission', 'promotion'],
      default: 'admission',
    },
    status: {
      type: String,
      enum: ['active', 'passed', 'failed', 'left'],
      default: 'active',
    },
  },
  { timestamps: true },
);

export const Enrollment = model<IEnrollment>('Enrollment', enrollmentSchema);
