"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackValidations = void 0;
const zod_1 = require("zod");
const createFeedbackValidation = zod_1.z.object({
    body: zod_1.z.object({
        type: zod_1.z.enum(['complaint', 'idea', 'suggestion']).optional(),
        category: zod_1.z.string().optional(),
        priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        title: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        department: zod_1.z.string().optional(),
        attachments: zod_1.z.string().optional(),
    }),
});
const updateFeedbackValidation = zod_1.z.object({
    body: zod_1.z.object({
        type: zod_1.z.enum(['complaint', 'idea', 'suggestion']).optional(),
        category: zod_1.z.string().optional(),
        priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        title: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        department: zod_1.z.string().optional(),
        attachments: zod_1.z.string().optional(),
    }),
});
exports.FeedbackValidations = {
    createFeedbackValidation,
    updateFeedbackValidation,
};
