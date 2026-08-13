"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("./user.controller");
const user_validation_1 = require("./user.validation");
const validateRequest_1 = require("../../middlewares/validateRequest");
const router = express_1.default.Router();
router.get('/', user_controller_1.UserController.getAllUser);
router.post('/', (0, validateRequest_1.validateRequest)(user_validation_1.userValidations.createUserValidation), user_controller_1.UserController.createUser);
router.get('/:id', user_controller_1.UserController.getSingleUser);
router.patch('/:id', 
// auth('admin', 'super_admin'),
user_controller_1.UserController.updateUser);
router.delete('/:id', 
// auth('admin', 'super_admin'),
user_controller_1.UserController.deleteUser);
exports.userRoutes = router;
