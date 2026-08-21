"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomRoutes = void 0;
const express_1 = __importDefault(require("express"));
const room_controller_1 = require("./room.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const auth_1 = require("../../middlewares/auth");
const room_validation_1 = require("./room.validation");
const router = express_1.default.Router();
router.post('/', (0, auth_1.auth)('admin', 'super_admin'), (0, validateRequest_1.validateRequest)(room_validation_1.RoomValidations.createRoomValidation), room_controller_1.roomControllers.createRoom);
router.get('/', room_controller_1.roomControllers.getAllRooms);
router.get('/:id', room_controller_1.roomControllers.getSingleRoom);
router.delete('/:id', (0, auth_1.auth)('admin', 'super_admin'), room_controller_1.roomControllers.deleteRoom);
router.patch('/:id', (0, auth_1.auth)('admin', 'super_admin'), (0, validateRequest_1.validateRequest)(room_validation_1.RoomValidations.updateRoomValidation), room_controller_1.roomControllers.updateRoom);
exports.roomRoutes = router;
