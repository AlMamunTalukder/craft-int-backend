"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodayTaskValidations = exports.createTodayTaskValidation = void 0;
const zod_1 = require("zod");
exports.createTodayTaskValidation = zod_1.z.object({
    body: zod_1.z.object({
        taskContent: zod_1.z
            .string({
            required_error: "বাড়ির কাজের বিষয়বস্তু আবশ্যক।",
        })
            .min(5, "বাড়ির কাজের বিষয়বস্তু কমপক্ষে ৫ অক্ষরের হতে হবে।"),
        dueDate: zod_1.z
            .string()
    }),
});
const updateTodayTaskValidation = zod_1.z.object({
    body: zod_1.z.object({
        taskContent: zod_1.z
            .string()
            .optional(),
        dueDate: zod_1.z
            .string()
            .optional(),
    }),
});
exports.TodayTaskValidations = {
    createTodayTaskValidation: exports.createTodayTaskValidation,
    updateTodayTaskValidation,
};
