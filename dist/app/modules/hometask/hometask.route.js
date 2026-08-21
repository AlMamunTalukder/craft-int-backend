"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.homeTaskRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const auth_1 = require("../../middlewares/auth");
const hometask_validation_1 = require("./hometask.validation");
const hometask_controller_1 = require("./hometask.controller");
const router = express_1.default.Router();
router.post('/', (0, auth_1.auth)('admin', 'teacher'), (0, validateRequest_1.validateRequest)(hometask_validation_1.HomeTaskValidations.createHomeTaskValidation), hometask_controller_1.homeTaskControllers.createHomeTask);
router.get('/', hometask_controller_1.homeTaskControllers.getAllHomeTasks);
router.get('/:id', hometask_controller_1.homeTaskControllers.getSingleHomeTask);
router.patch('/:id', (0, auth_1.auth)('admin', 'teacher'), (0, validateRequest_1.validateRequest)(hometask_validation_1.HomeTaskValidations.updateHomeTaskValidation), hometask_controller_1.homeTaskControllers.updateHomeTask);
router.delete('/:id', (0, auth_1.auth)('admin', 'teacher'), hometask_controller_1.homeTaskControllers.deleteHomeTask);
exports.homeTaskRoutes = router;
