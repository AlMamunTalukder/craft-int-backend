"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    id: { type: Number, required: true, unique: true },
    type: {
        type: String,
        enum: ['assignment', 'event', 'announcement'],
        required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    sender: { type: String, required: true },
    senderAvatar: { type: String },
    timestamp: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    category: {
        type: String,
        enum: ['Academic', 'Events', 'General'],
        default: 'General',
    },
}, { timestamps: true });
exports.Notification = (0, mongoose_1.model)('Notification', notificationSchema);
