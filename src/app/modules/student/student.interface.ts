/* eslint-disable @typescript-eslint/no-explicit-any */
import { Document, Types } from 'mongoose';
import { Gender, StudentStatus } from './student.utils';

export interface IGuardianInfo {
  guardianName?: string;
  guardianMobile?: string;
  relation?: string;
  address?: string;
}

export interface IAddress {
  village?: string;
  postOffice?: string;
  postCode?: string;
  policeStation?: string;
  district?: string;
}

export interface IStudent extends Document {
  _id: Types.ObjectId;

  // Core identifiers
  studentId?: string;
  smartIdCard?: string;
  applicationId?: string; // NEW: reference to admission application
  academicYear?: string; // NEW: year of admission

  // Student personal info
  name: string;
  nameBangla?: string;
  email?: string;
  studentDepartment: 'hifz' | 'academic';
  birthDate?: string;
  birthRegistrationNo?: string;
  age?: number; // NEW: age at admission
  gender?: Gender;
  mobile?: string;
  bloodGroup?: string;
  studentPhoto?: string;
  nationality?: string; // NEW
  nidBirth?: string; // NEW (alternative to birthRegistrationNo)

  // Academic details
  department?: string; // NEW (e.g., science, commerce)
  class?: string; // NEW (e.g., "Six") – distinct from className (ObjectId[] ref)
  session?: string; // NEW (e.g., "2024-2025")
  className?: Types.ObjectId[] | any;
  section?: string[];
  batch?: string;
  activeSession?: string[];
  studentClassRoll?: string;
  studentType: string;
  status?: StudentStatus;

  // Financial
  advanceBalance: number;
  fees?: Types.ObjectId[];
  payments?: Types.ObjectId[];
  receipts: Types.ObjectId[];

  // Parent/Guardian – NEW structured replacement for flat fields
  parentInfo?: {
    father?: {
      nameBangla?: string;
      nameEnglish?: string;
      profession?: string;
      education?: string;
      mobile?: string;
      whatsapp?: string;
    };
    mother?: {
      nameBangla?: string;
      nameEnglish?: string;
      profession?: string;
      education?: string;
      mobile?: string;
      whatsapp?: string;
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

  // Addresses (unchanged)
  presentAddress?: IAddress;
  permanentAddress?: IAddress;
  sameAsPermanent?: boolean;

  // Documents (unchanged)
  documents?: {
    birthCertificate?: boolean;
    transferCertificate?: boolean;
    characterCertificate?: boolean;
    markSheet?: boolean;
    photographs?: boolean;
  };

  // Previous school (existing object)
  previousSchool?: {
    institution?: string;
    address?: string;
  };

  // Academic background from admission – NEW
  academicInfo?: {
    previousSchool?: string; // name of previous school (string, not object)
    previousClass?: string;
    gpa?: string;
  };

  // Family environment – NEW
  familyEnvironment?: {
    halalIncome?: string;
    parentsPrayer?: string;
    addiction?: string;
    tv?: string;
    quranRecitation?: string;
    purdah?: string;
  };

  // Behavior & skills – NEW
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

  // Terms acceptance – NEW
  termsAccepted?: boolean;

  // Admission specific status – NEW
  admissionStatus?: 'pending' | 'approved' | 'rejected' | 'enrolled';

  // User reference (unchanged)
  user?: Types.ObjectId;
}
