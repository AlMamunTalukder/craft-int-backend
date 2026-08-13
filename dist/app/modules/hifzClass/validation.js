"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HifzClassValidations = void 0;
const zod_1 = require("zod");
const createHifzClassValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'HifzClass name is required' }),
    }),
});
const updateHifzClassValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional()
    }),
});
exports.HifzClassValidations = {
    createHifzClassValidation,
    updateHifzClassValidation,
};
