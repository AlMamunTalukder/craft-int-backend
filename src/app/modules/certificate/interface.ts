import { ObjectId } from 'mongoose';

export type TCertificateType =
  | 'testimonial'
  | 'character'
  | 'transfer'
  | 'hifz'
  | 'other';

export interface ICertificate {
  certificateType: TCertificateType;
  certificateNo: string;
  student: ObjectId;
  academicYear?: string;
  issueDate: Date;
  issuedBy?: string;
  data: Record<string, unknown>;
}
