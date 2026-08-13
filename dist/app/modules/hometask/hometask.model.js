"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeTask = void 0;
const mongoose_1 = require("mongoose");
const homeTaskSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    dueDate: {
        type: Date,
    },
    attachments: {
        type: [String],
        default: [],
    },
}, {
    timestamps: true,
});
exports.HomeTask = (0, mongoose_1.model)('HomeTask', homeTaskSchema);
