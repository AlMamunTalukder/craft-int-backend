"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routineRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const auth_1 = require("../../middlewares/auth");
const controller_1 = require("./controller");
const validation_1 = require("./validation");
const router = express_1.default.Router();
router.get('/week', controller_1.routineControllers.getWeekRoutine);
router.post('/', (0, auth_1.auth)('admin', 'super_admin'), (0, validateRequest_1.validateRequest)(validation_1.routineValidations.createRoutineValidation), controller_1.routineControllers.createRoutine);
router.get('/', controller_1.routineControllers.getAllRoutines);
router.get('/:id', controller_1.routineControllers.getSingleRoutine);
router.patch('/:id', (0, auth_1.auth)('admin', 'super_admin'), (0, validateRequest_1.validateRequest)(validation_1.routineValidations.updateRoutineValidation), controller_1.routineControllers.updateRoutine);
router.delete('/:id', (0, auth_1.auth)('admin', 'super_admin'), controller_1.routineControllers.deleteRoutine);
exports.routineRoutes = router;
