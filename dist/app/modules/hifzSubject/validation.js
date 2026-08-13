"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HifzSubjectValidations = void 0;
const zod_1 = require("zod");
const createHifzSubjectValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'HifzSubject name is required' }),
    }),
});
const updateHifzSubjectValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional()
    }),
});
exports.HifzSubjectValidations = {
    createHifzSubjectValidation,
    updateHifzSubjectValidation,
};
