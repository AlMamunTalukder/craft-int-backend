"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintValidation = void 0;
const zod_1 = require("zod");
const updateSchema = zod_1.z.object({
    date: zod_1.z.string(),
    message: zod_1.z.string(),
    author: zod_1.z.string(),
});
const complaintSchema = zod_1.z.object({
    body: zod_1.z.object({
        id: zod_1.z.number(),
        type: zod_1.z.enum(['complaint', 'suggestion']),
        title: zod_1.z.string(),
        description: zod_1.z.string(),
        category: zod_1.z.string(),
        submitter: zod_1.z.string(),
        submitterAvatar: zod_1.z.string().optional(),
        submitterRole: zod_1.z.string(),
        submitDate: zod_1.z.string(),
        status: zod_1.z.enum(['pending', 'under_review', 'resolved', 'rejected']).default('pending'),
        priority: zod_1.z.enum(['low', 'medium', 'high']).default('medium'),
        upvotes: zod_1.z.number().default(0),
        downvotes: zod_1.z.number().default(0),
        comments: zod_1.z.number().default(0),
        rating: zod_1.z.number().default(0),
        assignedTo: zod_1.z.string(),
        estimatedResolution: zod_1.z.string().optional(),
        attachments: zod_1.z.array(zod_1.z.string()).optional(),
        updates: zod_1.z.array(updateSchema).optional(),
    })
});
const updateComplaintSchema = complaintSchema.partial();
exports.ComplaintValidation = {
    createComplaint: complaintSchema,
    updateComplaint: updateComplaintSchema,
};
