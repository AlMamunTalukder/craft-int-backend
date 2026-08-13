"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodayTask = void 0;
const mongoose_1 = require("mongoose");
const todayTaskSchema = new mongoose_1.Schema({
    taskContent: {
        type: String,
        required: [true, "বাড়ির কাজের বিষয়বস্তু আবশ্যক!"],
        trim: true,
    },
    dueDate: {
        type: Date,
        required: [true, "জমা দেওয়ার তারিখ আবশ্যক!"],
    },
}, {
    timestamps: true,
});
exports.TodayTask = (0, mongoose_1.model)("TodayTask", todayTaskSchema);
