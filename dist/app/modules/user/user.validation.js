"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userValidations = void 0;
const zod_1 = require("zod");
const createUserValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        userId: zod_1.z.string({ required_error: 'user id is required' }),
        email: zod_1.z.string({ required_error: 'Email is required' }).optional(),
        password: zod_1.z
            .string({
            required_error: 'Password is required',
        })
            .optional(),
        role: zod_1.z
            .enum([
            'admin',
            'user',
            'super_visor',
            'teacher',
            'super_admin',
            'accountant',
            'staff'
        ])
            .default('user'),
        status: zod_1.z.enum(['active', 'inactive']).default('active'),
        isDeleted: zod_1.z.boolean().default(false),
    }),
});
exports.userValidations = {
    createUserValidation,
};
