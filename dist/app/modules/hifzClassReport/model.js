"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HifzReport = void 0;
// hifzReport.model.ts
const mongoose_1 = require("mongoose");
const StudentInfoSchema = new mongoose_1.Schema({
    studentName: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, trim: true },
    class: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    day: { type: String, required: true },
}, { _id: false });
const ReportRowSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    section: { type: String },
    title: { type: String, required: true },
    lesson: { type: String, default: "" },
    dailyFoundation: { type: String, default: "" },
    weeklyFoundation: { type: String, default: "" },
    teacherSignature: { type: String, default: "" },
}, { _id: false });
const HifzReportSchema = new mongoose_1.Schema({
    studentInfo: { type: StudentInfoSchema, required: true },
    reportRows: { type: [ReportRowSchema], required: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });
exports.HifzReport = (0, mongoose_1.model)("HifzReport", HifzReportSchema);
