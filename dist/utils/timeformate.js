"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTimeSlot = void 0;
const date_fns_1 = require("date-fns");
const formatTimeSlot = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const formattedStart = (0, date_fns_1.format)(start, 'hh:mm a');
    const formattedEnd = (0, date_fns_1.format)(end, 'hh:mm a');
    return `${formattedStart} - ${formattedEnd}`;
};
exports.formatTimeSlot = formatTimeSlot;
