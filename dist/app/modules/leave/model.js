"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Leave = void 0;
const mongoose_1 = require("mongoose");
const LeaveSchema = new mongoose_1.Schema({
    employeeType: { type: String, enum: ['teacher', 'staff'], required: true },
    employee: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    leaveType: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, default: 1 },
    reason: { type: String },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
}, { timestamps: true });
exports.Leave = (0, mongoose_1.model)('Leave', LeaveSchema);
LeaveSchema.index({ employeeType: 1, status: 1 });
