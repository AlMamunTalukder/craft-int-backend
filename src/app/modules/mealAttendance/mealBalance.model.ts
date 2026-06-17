import { Schema, model, Types } from 'mongoose';

export interface IMealBalanceHistory {
    month: string;        // 'YYYY-MM'
    monthName: string;    // 'January'
    academicYear: string;
    openingBalance: number;   // balance carried from previous month
    advanceBill: number;      // amount billed at start of month
    actualCost: number;       // real meal cost from attendance
    closingBalance: number;   // advanceBill - actualCost (carried to next month)
    feeId?: Types.ObjectId;    // reference to Fees record for that month
    createdAt: Date;
}

export interface IMealBalance {
    student: Types.ObjectId;
    currentBalance: number; // >0 = credit (surplus), <0 = due
    history: IMealBalanceHistory[];
}

const mealBalanceHistorySchema = new Schema<IMealBalanceHistory>(
    {
        month: { type: String, required: true },
        monthName: { type: String, required: true },
        academicYear: { type: String, required: true },
        openingBalance: { type: Number, required: true, default: 0 },
        advanceBill: { type: Number, required: true, default: 0 },
        actualCost: { type: Number, required: true, default: 0 },
        closingBalance: { type: Number, required: true, default: 0 },
        feeId: { type: Schema.Types.ObjectId, ref: 'Fees' },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const mealBalanceSchema = new Schema<IMealBalance>(
    {
        student: { type: Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
        currentBalance: { type: Number, required: true, default: 0 },
        history: { type: [mealBalanceHistorySchema], default: [] },
    },
    { timestamps: true }
);

export const MealBalance = model<IMealBalance>('MealBalance', mealBalanceSchema);