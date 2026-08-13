"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Asset = void 0;
const mongoose_1 = require("mongoose");
const AssetSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0, default: 1 },
    unitPrice: { type: Number, required: true, min: 0, default: 0 },
    totalPrice: { type: Number, default: 0 },
    purchaseDate: { type: Date },
    vendor: { type: String },
    location: { type: String },
    condition: { type: String, default: 'new' },
    warrantyTill: { type: Date },
    note: { type: String },
}, { timestamps: true });
exports.Asset = (0, mongoose_1.model)('Asset', AssetSchema);
AssetSchema.index({ category: 1, condition: 1 });
