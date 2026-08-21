"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomValidations = void 0;
const zod_1 = require("zod");
const createRoomValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string({
            required_error: 'Room name is required',
        })
            .min(1, 'Room name must not be empty'),
        capacity: zod_1.z.number().optional(),
        location: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
const updateRoomValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        capacity: zod_1.z.number().optional(),
        location: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
exports.RoomValidations = {
    createRoomValidation,
    updateRoomValidation,
};
