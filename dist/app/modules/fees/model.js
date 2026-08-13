"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fees = void 0;
const mongoose_1 = require("mongoose");
const FeesSchema = new mongoose_1.Schema({
    student: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Student', required: true },
    class: { type: String, required: true },
    month: { type: String },
    amount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    advanceUsed: { type: Number, default: 0 },
    dueAmount: { type: Number },
    discount: { type: Number, default: 0 },
    waiver: { type: Number, default: 0 },
    advanceMealAmount: { type: Number, default: 0 },
    dueMealAmount: { type: Number, default: 0 },
    futureMonthMealAmount: { type: Number },
    feeType: { type: String },
    status: {
        type: String,
        enum: ['paid', 'partial', 'unpaid'],
        default: 'unpaid',
    },
    paymentMethod: { type: String, enum: ['cash', 'bkash', 'bank', 'online'] },
    transactionId: { type: String },
    receiptNo: { type: String },
    paymentDate: { type: Date },
    academicYear: { type: String, required: true },
    isCurrentMonth: { type: Boolean, default: false },
    dueDate: { type: Date },
    mealCount: { type: Number, default: 0 },
    mealRate: { type: Number, default: 55 },
}, { timestamps: true });
FeesSchema.index({ student: 1, month: 1, academicYear: 1 });
FeesSchema.index({ status: 1 });
exports.Fees = (0, mongoose_1.model)('Fees', FeesSchema);
