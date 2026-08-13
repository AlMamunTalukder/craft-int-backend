"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Complaint = void 0;
const mongoose_1 = require("mongoose");
const updateSchema = new mongoose_1.Schema({
    date: { type: Date, required: true },
    message: { type: String, required: true },
    author: { type: String, required: true },
}, { _id: false });
const complaintSchema = new mongoose_1.Schema({
    id: { type: Number, required: true, unique: true },
    type: { type: String, enum: ['complaint', 'suggestion'], required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    submitter: { type: String, required: true },
    submitterAvatar: { type: String },
    submitterRole: { type: String, required: true },
    submitDate: { type: Date, required: true },
    status: {
        type: String,
        enum: ['pending', 'under_review', 'resolved', 'rejected'],
        default: 'pending',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    assignedTo: { type: String },
    estimatedResolution: { type: String },
    attachments: [{ type: String }],
    updates: [updateSchema],
}, { timestamps: true });
exports.Complaint = (0, mongoose_1.model)('Complaint', complaintSchema);
