"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.announcementValidationSchema = void 0;
const zod_1 = require("zod");
exports.announcementValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        id: zod_1.z.number(),
        title: zod_1.z.string().min(1, 'Title is required'),
        content: zod_1.z.string().min(1, 'Content is required'),
        category: zod_1.z.string().min(1, 'Category is required'),
        author: zod_1.z.string().min(1, 'Author is required'),
        authorAvatar: zod_1.z.string().optional(),
        publishDate: zod_1.z.coerce.date(),
        isPinned: zod_1.z.boolean(),
        isStarred: zod_1.z.boolean(),
        views: zod_1.z.number().nonnegative(),
        attachments: zod_1.z.array(zod_1.z.string()).optional(),
        image: zod_1.z.string().optional(),
        priority: zod_1.z.enum(['low', 'medium', 'high']),
    }),
});
