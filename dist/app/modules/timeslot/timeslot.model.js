"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeSlot = void 0;
const mongoose_1 = require("mongoose");
const timeSlotSchema = new mongoose_1.Schema({
    title: {
        type: String,
    },
    day: {
        type: String,
        required: true,
        enum: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
    startTime: {
        type: String,
        required: true,
    },
    endTime: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
exports.TimeSlot = (0, mongoose_1.model)('TimeSlot', timeSlotSchema);
