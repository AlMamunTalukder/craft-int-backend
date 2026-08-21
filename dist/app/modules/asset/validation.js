"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetValidations = void 0;
const zod_1 = require("zod");
const createAssetValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Asset name is required'),
        category: zod_1.z.string().min(1, 'Category is required'),
        quantity: zod_1.z.number().min(0),
        unitPrice: zod_1.z.number().min(0),
        purchaseDate: zod_1.z.string().optional(),
        vendor: zod_1.z.string().optional(),
        location: zod_1.z.string().optional(),
        condition: zod_1.z.string().optional(),
        warrantyTill: zod_1.z.string().optional(),
        note: zod_1.z.string().optional(),
    }),
});
const updateAssetValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        category: zod_1.z.string().optional(),
        quantity: zod_1.z.number().min(0).optional(),
        unitPrice: zod_1.z.number().min(0).optional(),
        purchaseDate: zod_1.z.string().optional(),
        vendor: zod_1.z.string().optional(),
        location: zod_1.z.string().optional(),
        condition: zod_1.z.string().optional(),
        warrantyTill: zod_1.z.string().optional(),
        note: zod_1.z.string().optional(),
    }),
});
exports.assetValidations = {
    createAssetValidation,
    updateAssetValidation,
};
