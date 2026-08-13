"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseCategory = void 0;
const mongoose_1 = require("mongoose");
const expenseCategorySchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true }
}, { timestamps: true });
exports.ExpenseCategory = (0, mongoose_1.model)('ExpenseCategory', expenseCategorySchema);
