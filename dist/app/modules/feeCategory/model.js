"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeCategory = void 0;
const mongoose_1 = require("mongoose");
const feeCategorySchema = new mongoose_1.Schema({
    categoryName: {
        type: String,
        enum: [
            '',
            'Residential',
            'Non-Residential',
            'Day Care',
            'Non-Residential One Meal',
            'Day Care One Meal',
            'Residential No Meal'
        ],
        default: '',
    },
    className: {
        type: String,
        required: true,
        trim: true,
    },
    feeItems: [
        {
            feeType: {
                type: String,
                required: true,
                trim: true,
            },
            amount: {
                type: Number,
                required: true,
                min: 0,
            },
        },
    ],
}, { timestamps: true });
feeCategorySchema.index({ className: 1, categoryName: 1 }, { unique: true });
exports.FeeCategory = (0, mongoose_1.model)('FeeCategory', feeCategorySchema);
