"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassReport = void 0;
const mongoose_1 = require("mongoose");
const getCurrentAcademicYear_1 = require("../../../utils/getCurrentAcademicYear");
const studentEvaluationSchema = new mongoose_1.Schema({
    studentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Student',
    },
    lessonEvaluation: {
        type: String,
        enum: [
            'পড়া শিখেছে',
            'আংশিক শিখেছে',
            'পড়া শিখেনি',
            'অনুপস্থিত',
            'পাঠ নেই',
        ],
    },
    handwriting: {
        type: String,
        enum: ['লিখেছে', 'আংশিক লিখেছে', 'লিখেনি', 'কাজ নেই', 'অনুপস্থিত'],
    },
    attendance: {
        type: String,
        enum: ['উপস্থিত', 'অনুপস্থিত', 'ছুটি'],
    },
    parentSignature: {
        type: Boolean,
    },
    comments: {
        type: String,
        index: true,
    },
    hasComments: {
        type: Boolean,
        default: false,
    },
}, { _id: false });
const classReportSchema = new mongoose_1.Schema({
    teachers: {
        type: String,
        required: true,
    },
    classes: {
        type: String,
        required: true,
    },
    subjects: {
        type: String,
        required: true,
    },
    hour: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    studentEvaluations: {
        type: [studentEvaluationSchema],
        required: true,
    },
    todayLesson: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'TodayLesson',
    },
    homeTask: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'TodayTask',
    },
    noTaskForClass: {
        type: Boolean,
    },
    lessonEvaluationTask: {
        type: Boolean,
    },
    handwrittenTask: {
        type: Boolean,
    },
    hasComments: {
        type: mongoose_1.Schema.Types.Mixed,
        default: false,
    },
    academicYear: {
        type: String,
        required: true,
        default: () => (0, getCurrentAcademicYear_1.getCurrentAcademicYear)(),
    },
}, {
    timestamps: true,
});
classReportSchema.index({ teachers: 1, classes: 1, subjects: 1 });
classReportSchema.index({ date: 1, hour: 1 });
classReportSchema.index({ createdAt: -1 });
// Add compound indexes for better query performance
classReportSchema.index({ teachers: 1, classes: 1, subjects: 1 });
classReportSchema.index({ date: 1, hour: 1 });
classReportSchema.index({ createdAt: -1 });
// Add index for comments filtering
classReportSchema.index({ 'studentEvaluations.comments': 1 });
// Add text index for better text search
classReportSchema.index({
    teachers: 'text',
    classes: 'text',
    subjects: 'text',
    hour: 'text',
});
exports.ClassReport = (0, mongoose_1.model)('ClassReport', classReportSchema);
