"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Class = void 0;
const mongoose_1 = require("mongoose");
const mongoose_2 = require("mongoose");
const feeStructureSchema = new mongoose_1.Schema({
    feeType: { type: String, required: true },
    amount: { type: Number, required: true },
    isMonthly: { type: Boolean, default: false },
}, { _id: false });
const classSchema = new mongoose_1.Schema({
    className: { type: String, required: true, unique: true },
    sections: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Section',
        },
    ],
    department: {
        type: String
    },
    feeStructure: {
        type: [feeStructureSchema],
        default: [],
    },
}, { timestamps: true });
exports.Class = (0, mongoose_2.model)('Class', classSchema);
