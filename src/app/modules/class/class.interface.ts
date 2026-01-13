import { ObjectId } from 'mongoose';

export interface IFeeStructure {
  feeType: string;
  amount: number;
  isMonthly: boolean;
}

export type TClass = {
  className: string;
  teacher: ObjectId;
  student: ObjectId;
  createdAt: Date;
  sections: ObjectId[];
  updatedAt: Date;
  feeStructure: IFeeStructure[];
};
