import mongoose, { Schema } from "mongoose";
import { IIncome } from "./income.interface";

export interface IIncomeItem {
  source: string;
  description?: string;
  amount: number;
}

const IncomeItemSchema = new Schema<IIncomeItem>(
  {
    source: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const IncomeSchema = new Schema<IIncome>(
  {
    category: { type: Schema.Types.ObjectId, ref:'IncomeCategory' },
    note: { type: String },
    incomeDate: { type: Date},
    paymentMethod: { type: String },
    status: { type: String,default:'Pending'  },
    incomeItems: { type: [IncomeItemSchema]},
    totalAmount: { type: Number   },
    student: { type: Schema.Types.ObjectId, ref: 'Student' },
    studentName: { type: String },
    studentId: { type: String },
    studentRoll: { type: String },
    accountNo: { type: String },
    transactionId: { type: String },
    referenceNo: { type: String },
  },
  { timestamps: true }
);

export const Income = mongoose.model<IIncome>("Income", IncomeSchema);