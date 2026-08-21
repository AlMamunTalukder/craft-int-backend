"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectionValidations = void 0;
const zod_1 = require("zod");
const createSectionValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'Section name is required' }),
    }),
});
const updateSectionValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional()
    }),
});
exports.SectionValidations = {
    createSectionValidation,
    updateSectionValidation,
};
