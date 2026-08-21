"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Announcement = void 0;
const mongoose_1 = require("mongoose");
const announcementSchema = new mongoose_1.Schema({
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
    author: { type: String, required: true },
    authorAvatar: { type: String },
    publishDate: { type: Date, required: true },
    isPinned: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    attachments: [{ type: String }],
    image: { type: String },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
    },
}, { timestamps: true });
exports.Announcement = (0, mongoose_1.model)("Announcement", announcementSchema);
