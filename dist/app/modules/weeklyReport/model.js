"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeeklyReport = void 0;
// models/weeklyReport.model.ts
const mongoose_1 = require("mongoose");
const ReportRowSchema = new mongoose_1.Schema({
    label: { type: String, required: true },
    values: { type: [String], required: true, default: [] },
});
const WeeklyReportSchema = new mongoose_1.Schema({
    studentName: { type: String, required: true },
    date: { type: Date, required: true },
    month: { type: String, required: true },
    reportType: {
        type: String,
        enum: ["nazera", "ampara", "hifz", "qaida"],
        required: true,
    },
    rows: { type: [ReportRowSchema], required: true },
}, { timestamps: true });
exports.WeeklyReport = (0, mongoose_1.model)("WeeklyReport", WeeklyReportSchema);
