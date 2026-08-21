"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QaidaDailyReport = void 0;
const mongoose_1 = require("mongoose");
const dayEntrySchema = new mongoose_1.Schema({
    hadithNumber: { type: String, default: "" },
    duaNumber: { type: String, default: "" },
    tajweedSubject: { type: String, default: "" },
    qaidaPage: { type: String, default: "" },
    pageAmount: { type: String, default: "" },
    hadithDuaRevision: { type: String, default: "" },
    duaRevision: { type: String, default: "" },
    tajweedRevision: { type: String, default: "" },
    qaidaRevision: { type: String, default: "" },
    teacherSignature: { type: String, default: "" },
    comment: { type: String, default: "" },
    mask: { type: String, default: "" },
});
const dailyEntriesSchema = new mongoose_1.Schema({
    saturday: { type: dayEntrySchema, default: () => ({}) },
    sunday: { type: dayEntrySchema, default: () => ({}) },
    monday: { type: dayEntrySchema, default: () => ({}) },
    tuesday: { type: dayEntrySchema, default: () => ({}) },
    wednesday: { type: dayEntrySchema, default: () => ({}) },
    thursday: { type: dayEntrySchema, default: () => ({}) },
    friday: { type: dayEntrySchema, default: () => ({}) },
});
const qaidaDailyReportSchema = new mongoose_1.Schema({
    studentName: { type: String, required: true },
    teacherName: { type: String, required: true },
    reportDate: { type: Date, required: true },
    month: { type: String, required: true },
    weeklyTarget: { type: String, default: "" },
    dailyEntries: { type: dailyEntriesSchema, required: true },
}, {
    timestamps: true,
});
exports.QaidaDailyReport = (0, mongoose_1.model)("QaidaDailyReport", qaidaDailyReportSchema);
