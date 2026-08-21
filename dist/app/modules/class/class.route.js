"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.classRoutes = void 0;
const express_1 = __importDefault(require("express"));
const class_controller_1 = require("./class.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const class_validation_1 = require("./class.validation");
const router = express_1.default.Router();
router.post('/', 
// auth('admin', 'super_admin','class_teacher'),
(0, validateRequest_1.validateRequest)(class_validation_1.ClassValidations.createClassValidation), class_controller_1.classControllers.createClass);
router.get('/', class_controller_1.classControllers.getAllClasses);
router.get('/:id', class_controller_1.classControllers.getSingleClass);
router.delete('/:id', 
// auth('admin', 'super_admin','class_teacher'),
class_controller_1.classControllers.deleteClass);
router.patch('/:id', 
// auth('admin', 'super_admin','class_teacher'),
(0, validateRequest_1.validateRequest)(class_validation_1.ClassValidations.updateClassValidation), class_controller_1.classControllers.updateClass);
exports.classRoutes = router;
