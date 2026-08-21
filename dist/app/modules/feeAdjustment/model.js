"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeAdjustment = void 0;
const mongoose_1 = require("mongoose");
const FeeAdjustmentSchema = new mongoose_1.Schema({
    student: { type: mongoose_1.Schema.ObjectId, ref: 'Student', required: true },
    fee: { type: mongoose_1.Schema.ObjectId, ref: 'Fees', required: true },
    enrollment: { type: mongoose_1.Schema.ObjectId, ref: 'Enrollment' },
    type: { type: String, enum: ['discount', 'waiver'] },
    adjustmentType: {
        type: String,
        enum: ['percentage', 'flat'],
        required: true,
    },
    value: { type: Number, required: true },
    reason: { type: String, default: '' },
    approvedBy: { type: mongoose_1.Types.ObjectId, ref: 'User', default: null },
    approvedDate: { type: Date, default: null },
    startMonth: { type: String, required: true },
    endMonth: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    isRecurring: { type: Boolean, default: false },
    academicYear: { type: String, required: true },
}, { timestamps: true });
FeeAdjustmentSchema.index({
    student: 1,
    fee: 1,
    type: 1,
    academicYear: 1,
});
exports.FeeAdjustment = (0, mongoose_1.model)('FeeAdjustment', FeeAdjustmentSchema);
