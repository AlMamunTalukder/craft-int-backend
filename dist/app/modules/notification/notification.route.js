"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const notification_controller_1 = require("./notification.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const notification_validation_1 = require("./notification.validation");
const router = express_1.default.Router();
router.post('/', (0, validateRequest_1.validateRequest)(notification_validation_1.NotificationValidation.createNotification), notification_controller_1.notificationControllers.createNotification);
router.get('/', notification_controller_1.notificationControllers.getAllNotifications);
router.get('/:id', notification_controller_1.notificationControllers.getSingleNotification);
router.patch('/:id', (0, validateRequest_1.validateRequest)(notification_validation_1.NotificationValidation.updateNotification), notification_controller_1.notificationControllers.updateNotification);
router.delete('/:id', notification_controller_1.notificationControllers.deleteNotification);
exports.notificationRoutes = router;
