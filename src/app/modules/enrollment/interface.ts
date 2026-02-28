import { Types } from 'mongoose';

export interface IEnrollment {
  studentId: string;
  student: Types.ObjectId;
  studentName: string;
  nameBangla?: string;
  studentPhoto: string;
  gender?: string;
  birthDate?: string;
  birthRegistrationNo?: string;
  bloodGroup?: string;
  nationality?: string;
  studentDepartment: string;
  className: Types.ObjectId;
  section?: string;
  roll?: string;
  session: string;
  batch?: string;
  studentType?: string;
  paymentStatus?: 'pending' | 'partial' | 'paid' | string;

  fatherName?: string;
  fatherNameBangla?: string;
  fatherMobile?: string;
  fatherNid?: string;
  fatherProfession?: string;
  fatherIncome?: number;

  motherName?: string;
  motherNameBangla?: string;
  motherMobile?: string;
  motherNid?: string;
  motherProfession?: string;
  motherIncome?: number;
  mobileNo?: string;
  rollNumber?: string;
  guardianInfo?: {
    name?: string;
    relation?: string;
    mobile?: string;
    address?: string;
  };

  presentAddress?: {
    village?: string;
    postOffice?: string;
    postCode?: string;
    policeStation?: string;
    district?: string;
  };

  permanentAddress?: {
    village?: string;
    postOffice?: string;
    postCode?: string;
    policeStation?: string;
    district?: string;
  };

  documents?: {
    birthCertificate?: boolean;
    transferCertificate?: boolean;
    characterCertificate?: boolean;
    markSheet?: boolean;
    photographs?: boolean;
  };

  previousSchool?: {
    institution?: string;
    address?: string;
  };

  termsAccepted?: boolean;
  promotedFrom?: Types.ObjectId;
  promotedTo?: Types.ObjectId;
  fees?: Types.ObjectId[];
  admissionType?: 'admission' | 'promotion';
  status?: 'active' | 'passed' | 'failed' | 'left';

  // --- MISSING FIELDS ADDED HERE ---
  totalAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
  totalDiscount?: number;
  advanceBalance?: number;
  payment?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}
