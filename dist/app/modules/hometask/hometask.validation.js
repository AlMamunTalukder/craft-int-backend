"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeTaskValidations = void 0;
const zod_1 = require("zod");
const createHomeTaskValidation = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z
            .string({
            required_error: 'Title is required',
        })
            .min(1, 'Title cannot be empty'),
        description: zod_1.z
            .string({
            required_error: 'Description is required',
        })
            .min(1, 'Description cannot be empty'),
        dueDate: zod_1.z
            .string()
            .datetime({ message: 'Invalid date format' })
            .optional(),
        attachments: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
const updateHomeTaskValidation = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        dueDate: zod_1.z.string().datetime().optional(),
        attachments: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
exports.HomeTaskValidations = {
    createHomeTaskValidation,
    updateHomeTaskValidation,
};
