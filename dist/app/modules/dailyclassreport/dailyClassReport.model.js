"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyClassReport = void 0;
const mongoose_1 = require("mongoose");
const reportRowSchema = new mongoose_1.Schema({
    subject: {
        type: String,
        required: true,
    },
    class: {
        type: String,
        required: true,
    },
    fullyLearned: {
        type: Number,
        required: true,
    },
    partiallyLearned: {
        type: Number,
        required: true,
    },
    notLearned: {
        type: Number,
        required: true,
    },
    learningPercentage: {
        type: Number,
        required: true,
    },
    totalStudents: {
        type: Number,
        required: true,
    },
    lessonDetails: {
        type: String,
        required: true,
    },
    homework: {
        type: String,
        required: true,
    },
    diaryCompleted: {
        type: String,
        enum: ['হ্যাঁ', 'না'],
        required: true,
    },
}, {
    _id: false,
});
const dailyClassReportSchema = new mongoose_1.Schema({
    teacherName: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    classes: {
        type: [reportRowSchema],
        required: true,
    },
}, {
    timestamps: true,
});
exports.DailyClassReport = (0, mongoose_1.model)('DailyClassReport', dailyClassReportSchema);
