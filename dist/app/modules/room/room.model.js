"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const mongoose_1 = require("mongoose");
const roomSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    capacity: {
        type: Number,
    },
    location: {
        type: String,
    },
    description: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
exports.Room = (0, mongoose_1.model)('Room', roomSchema);
