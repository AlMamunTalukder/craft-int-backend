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

  parentInfo?: {
    father?: {
      nameBangla?: string;
      nameEnglish?: string;
      profession?: string;
      education?: string;
      mobile?: string;
      whatsapp?: string;
      nid?: string;
      income?: number;
    };
    mother?: {
      nameBangla?: string;
      nameEnglish?: string;
      profession?: string;
      education?: string;
      mobile?: string;
      whatsapp?: string;
      nid?: string;
      income?: number;
    };
    guardian?: {
      nameBangla?: string;
      nameEnglish?: string;
      relation?: string;
      mobile?: string;
      whatsapp?: string;
      profession?: string;
      address?: string;
    };
  };

  mobileNo?: string;
  rollNumber?: string;

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
  totalAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
  totalDiscount?: number;
  advanceBalance?: number;
  payment?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  familyEnvironment?: {
    halalIncome?: string;
    parentsPrayer?: string;
    addiction?: string;
    tv?: string;
    quranRecitation?: string;
    purdah?: string;
  };
  behaviorSkills?: {
    mobileUsage?: string;
    generalBehavior?: string;
    obedience?: string;
    elderBehavior?: string;
    youngerBehavior?: string;
    lyingStubbornness?: string;
    studyInterest?: string;
    religiousInterest?: string;
    angerControl?: string;
  };
}
