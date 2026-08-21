"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationValidation = void 0;
const zod_1 = require("zod");
const notificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        id: zod_1.z.number(),
        type: zod_1.z.enum(['assignment', 'event', 'announcement']),
        title: zod_1.z.string(),
        message: zod_1.z.string(),
        sender: zod_1.z.string(),
        senderAvatar: zod_1.z.string().optional(),
        timestamp: zod_1.z.string(),
        isRead: zod_1.z.boolean().default(false),
        isStarred: zod_1.z.boolean().default(false),
        priority: zod_1.z.enum(['low', 'medium', 'high']).default('medium'),
        category: zod_1.z.enum(['Academic', 'Events', 'General']).default('General'),
    })
});
const updateNotificationSchema = notificationSchema.partial();
exports.NotificationValidation = {
    createNotification: notificationSchema,
    updateNotification: updateNotificationSchema,
};
