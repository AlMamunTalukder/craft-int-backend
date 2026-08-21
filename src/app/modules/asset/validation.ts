import { z } from 'zod';

const createAssetValidation = z.object({
  body: z.object({
    name: z.string().min(1, 'Asset name is required'),
    category: z.string().min(1, 'Category is required'),
    quantity: z.number().min(0),
    unitPrice: z.number().min(0),
    purchaseDate: z.string().optional(),
    vendor: z.string().optional(),
    location: z.string().optional(),
    condition: z.string().optional(),
    warrantyTill: z.string().optional(),
    note: z.string().optional(),
  }),
});

const updateAssetValidation = z.object({
  body: z.object({
    name: z.string().optional(),
    category: z.string().optional(),
    quantity: z.number().min(0).optional(),
    unitPrice: z.number().min(0).optional(),
    purchaseDate: z.string().optional(),
    vendor: z.string().optional(),
    location: z.string().optional(),
    condition: z.string().optional(),
    warrantyTill: z.string().optional(),
    note: z.string().optional(),
  }),
});

export const assetValidations = {
  createAssetValidation,
  updateAssetValidation,
};
