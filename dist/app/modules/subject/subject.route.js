"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subjectRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const subject_validation_1 = require("./subject.validation");
const subject_controller_1 = require("./subject.controller");
const router = express_1.default.Router();
router.post('/', 
// auth('admin', 'super_admin'),
(0, validateRequest_1.validateRequest)(subject_validation_1.subjectValidation.createSubjectSchema), subject_controller_1.subjectControllers.createSubject);
router.get('/', subject_controller_1.subjectControllers.getAllSubjects);
router.get('/:id', subject_controller_1.subjectControllers.getSingleSubject);
router.patch('/:id', 
// auth('admin', 'super_admin'),
(0, validateRequest_1.validateRequest)(subject_validation_1.subjectValidation.updateSubjectSchema), subject_controller_1.subjectControllers.updateSubject);
router.delete('/:id', 
// auth('admin', 'super_admin'),
subject_controller_1.subjectControllers.deleteSubject);
exports.subjectRoutes = router;
