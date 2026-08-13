"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassRoutine = void 0;
const mongoose_1 = require("mongoose");
const RoutinePeriodSchema = new mongoose_1.Schema({
    subject: { type: String, required: true },
    teacher: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Teacher' },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    room: { type: String },
    isBreak: { type: Boolean, default: false },
}, { _id: false });
const ClassRoutineSchema = new mongoose_1.Schema({
    className: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Class', required: true },
    section: { type: String },
    day: { type: String, required: true },
    academicYear: { type: String, required: true },
    periods: { type: [RoutinePeriodSchema], default: [] },
}, { timestamps: true });
ClassRoutineSchema.index({ className: 1, section: 1, day: 1, academicYear: 1 }, { unique: true, sparse: true });
exports.ClassRoutine = (0, mongoose_1.model)('ClassRoutine', ClassRoutineSchema);
