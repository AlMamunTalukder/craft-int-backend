"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassValidations = void 0;
const zod_1 = require("zod");
const createClassValidation = zod_1.z.object({
    body: zod_1.z.object({
        className: zod_1.z.string({
            required_error: 'Class name is required',
        }),
    }),
});
const updateClassValidation = zod_1.z.object({
    body: zod_1.z.object({
        className: zod_1.z.string().optional(),
    }),
});
exports.ClassValidations = {
    createClassValidation,
    updateClassValidation,
};
