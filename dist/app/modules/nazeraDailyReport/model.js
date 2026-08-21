"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NazeraDailyReportModel = void 0;
const mongoose_1 = require("mongoose");
const DailyEntrySchema = new mongoose_1.Schema({
    sobok: {
        para: { type: String, default: '' },
        page: { type: String, default: '' },
        amount: { type: String, default: '' },
        wrong: { type: String, default: '' }
    },
    sabakSeven: {
        para: { type: String, default: '' },
        page: { type: String, default: '' },
        amount: { type: String, default: '' },
    },
    sabakAmukta: {
        para: { type: String, default: '' },
        page: { type: String, default: '' },
        wrong: { type: String, default: '' }
    },
    satSobok: {
        para: { type: String, default: '' },
        page: { type: String, default: '' },
        amount: { type: String, default: '' },
        wrong: { type: String, default: '' }
    },
    tilawaAmount: { type: String, default: '' },
    mashq: { type: String, default: '' },
    tajweed: { type: String, default: '' },
    teacherSignature: { type: String, default: '' },
    thursdayWeeklyRevision: { type: String, default: '' }
});
const NazeraDailyReportSchema = new mongoose_1.Schema({
    teacherName: { type: String, required: true },
    studentName: { type: String, required: true },
    reportDate: { type: String, required: true },
    month: { type: String, required: true },
    weeklyTarget: { type: String, default: '' },
    dailyEntries: {
        saturday: { type: DailyEntrySchema, default: () => ({}) },
        sunday: { type: DailyEntrySchema, default: () => ({}) },
        monday: { type: DailyEntrySchema, default: () => ({}) },
        tuesday: { type: DailyEntrySchema, default: () => ({}) },
        wednesday: { type: DailyEntrySchema, default: () => ({}) },
        thursday: { type: DailyEntrySchema, default: () => ({}) },
        friday: { type: DailyEntrySchema, default: () => ({}) }
    },
    weeklySummary: {
        totalSobok: { type: Number, default: 0 },
        totalSatSobok: { type: Number, default: 0 },
        totalSabakAmukta: { type: Number, default: 0 },
        totalTilawat: { type: Number, default: 0 },
        totalRevision: { type: Number, default: 0 }
    },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true,
});
exports.NazeraDailyReportModel = (0, mongoose_1.model)('NazeraDailyReport', NazeraDailyReportSchema);
