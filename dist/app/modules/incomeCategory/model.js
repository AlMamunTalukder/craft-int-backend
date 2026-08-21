"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncomeCategory = void 0;
const mongoose_1 = require("mongoose");
const incomeCategorySchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true }
}, { timestamps: true });
exports.IncomeCategory = (0, mongoose_1.model)('IncomeCategory', incomeCategorySchema);
