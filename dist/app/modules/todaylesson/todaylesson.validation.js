"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodayLessonValidations = exports.createTodayLessonValidation = void 0;
const zod_1 = require("zod");
exports.createTodayLessonValidation = zod_1.z.object({
    body: zod_1.z.object({
        lessonContent: zod_1.z
            .string({
            required_error: "আজকের পাঠের বিষয়বস্তু আবশ্যক।",
        })
    })
});
const updateTodayLessonValidation = zod_1.z.object({
    body: zod_1.z.object({
        lessonContent: zod_1.z
            .string().optional(),
    })
});
exports.TodayLessonValidations = {
    createTodayLessonValidation: exports.createTodayLessonValidation,
    updateTodayLessonValidation,
};
