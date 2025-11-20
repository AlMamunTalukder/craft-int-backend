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
  studentId?: string;
  smartIdCard?: string;
  name: string;
  nameBangla?: string;
  email?: string;
  studentDepartment: 'hifz' | 'academic';
  birthDate?: string;
  birthRegistrationNo?: string;
  gender?: Gender;
  mobile?: string;
  advanceBalance: number;
  bloodGroup?: string;
  studentPhoto?: string;
  fatherName?: string;
  fatherMobile?: string;
  fatherProfession?: string;
  motherName?: string;
  motherMobile?: string;
  motherProfession?: string;
  sameAsPermanent?: boolean;

  className?: Types.ObjectId[];
  section?: string[];
  batch?: string;
  activeSession?: string[];
  studentClassRoll?: string;
  studentType: string;
  status?: StudentStatus;
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
  }
  fees?: Types.ObjectId[];
}
