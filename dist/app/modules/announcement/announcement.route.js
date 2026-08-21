"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.announcementRoutes = void 0;
const express_1 = __importDefault(require("express"));
const announcement_controller_1 = require("./announcement.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const announcement_validation_1 = require("./announcement.validation");
const router = express_1.default.Router();
router.post('/', 
// auth('admin', 'super_admin'),
(0, validateRequest_1.validateRequest)(announcement_validation_1.announcementValidationSchema), announcement_controller_1.announcementControllers.createAnnouncement);
router.get('/', announcement_controller_1.announcementControllers.getAllAnnouncements);
router.get('/:id', announcement_controller_1.announcementControllers.getSingleAnnouncement);
router.delete('/:id', 
// auth('admin', 'super_admin'),
announcement_controller_1.announcementControllers.deleteAnnouncement);
router.patch('/:id', 
// auth('admin', 'super_admin'),
(0, validateRequest_1.validateRequest)(announcement_validation_1.announcementValidationSchema), announcement_controller_1.announcementControllers.updateAnnouncement);
exports.announcementRoutes = router;
