import { Schema, model, Types } from 'mongoose';

export interface IMealBalanceHistory {
    month: string;
    monthName: string;
    academicYear: string;
    openingBalance: number;
    advanceBill: number;
    actualCost: number;
    closingBalance: number;
    feeId?: Types.ObjectId;
    createdAt: Date;
}

export interface IMealBalance {
    student: Types.ObjectId;
    currentBalance: number;
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