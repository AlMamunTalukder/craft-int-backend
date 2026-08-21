"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodayLesson = void 0;
const mongoose_1 = require("mongoose");
const TodayLessonSchema = new mongoose_1.Schema({
    lessonContent: {
        type: String,
        required: [true, "Lesson content is required"],
        trim: true,
    },
}, {
    timestamps: true,
});
exports.TodayLesson = (0, mongoose_1.model)("TodayLesson", TodayLessonSchema);
