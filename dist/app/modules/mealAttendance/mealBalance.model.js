"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MealBalance = void 0;
const mongoose_1 = require("mongoose");
const mealBalanceHistorySchema = new mongoose_1.Schema({
    month: { type: String, required: true },
    monthName: { type: String, required: true },
    academicYear: { type: String, required: true },
    openingBalance: { type: Number, required: true, default: 0 },
    advanceBill: { type: Number, required: true, default: 0 },
    actualCost: { type: Number, required: true, default: 0 },
    closingBalance: { type: Number, required: true, default: 0 },
    feeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Fees' },
    createdAt: { type: Date, default: Date.now },
}, { _id: false });
const mealBalanceSchema = new mongoose_1.Schema({
    student: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
    currentBalance: { type: Number, required: true, default: 0 },
    history: { type: [mealBalanceHistorySchema], default: [] },
}, { timestamps: true });
exports.MealBalance = (0, mongoose_1.model)('MealBalance', mealBalanceSchema);
