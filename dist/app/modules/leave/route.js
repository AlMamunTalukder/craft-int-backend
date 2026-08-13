"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const auth_1 = require("../../middlewares/auth");
const controller_1 = require("./controller");
const validation_1 = require("./validation");
const router = express_1.default.Router();
router.post('/', (0, auth_1.auth)('admin', 'super_admin'), (0, validateRequest_1.validateRequest)(validation_1.leaveValidations.createLeaveValidation), controller_1.leaveControllers.createLeave);
router.get('/', controller_1.leaveControllers.getAllLeaves);
router.patch('/:id/status', (0, auth_1.auth)('admin', 'super_admin'), (0, validateRequest_1.validateRequest)(validation_1.leaveValidations.updateLeaveStatusValidation), controller_1.leaveControllers.updateLeaveStatus);
router.get('/:id', controller_1.leaveControllers.getSingleLeave);
router.patch('/:id', (0, auth_1.auth)('admin', 'super_admin'), (0, validateRequest_1.validateRequest)(validation_1.leaveValidations.updateLeaveValidation), controller_1.leaveControllers.updateLeave);
router.delete('/:id', (0, auth_1.auth)('admin', 'super_admin'), controller_1.leaveControllers.deleteLeave);
exports.leaveRoutes = router;
