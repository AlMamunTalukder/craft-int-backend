"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeSlotRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const auth_1 = require("../../middlewares/auth");
const timeslot_controller_1 = require("./timeslot.controller");
const timeslot_validation_1 = require("./timeslot.validation");
const router = express_1.default.Router();
router.post('/', (0, auth_1.auth)('admin', 'super_admin'), (0, validateRequest_1.validateRequest)(timeslot_validation_1.TimeSlotValidations.createTimeSlotValidation), timeslot_controller_1.timeSlotControllers.createTimeSlot);
router.get('/', timeslot_controller_1.timeSlotControllers.getAllTimeSlots);
router.get('/:id', timeslot_controller_1.timeSlotControllers.getSingleTimeSlot);
router.delete('/:id', 
// auth('admin', 'super_admin'),
timeslot_controller_1.timeSlotControllers.deleteTimeSlot);
router.patch('/:id', (0, auth_1.auth)('admin', 'super_admin'), (0, validateRequest_1.validateRequest)(timeslot_validation_1.TimeSlotValidations.updateTimeSlotValidation), timeslot_controller_1.timeSlotControllers.updateTimeSlot);
exports.timeSlotRoutes = router;
