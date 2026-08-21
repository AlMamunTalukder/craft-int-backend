import { Schema, model } from 'mongoose';
import { ICertificate } from './interface';

const CertificateSchema = new Schema<ICertificate>(
  {
    certificateType: { type: String, required: true },
    certificateNo: { type: String, required: true, unique: true },
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    academicYear: { type: String },
    issueDate: { type: Date, default: Date.now },
    issuedBy: { type: String },
    data: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Certificate = model<ICertificate>(
  'Certificate',
  CertificateSchema,
);

CertificateSchema.index({ student: 1 });
CertificateSchema.index({ certificateType: 1 });
