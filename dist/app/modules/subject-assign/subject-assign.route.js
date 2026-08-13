"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subjectAssignRoute = void 0;
const express_1 = __importDefault(require("express"));
const subject_assign_controller_1 = require("./subject-assign.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const auth_1 = require("../../middlewares/auth");
const subject_assign_validation_1 = require("./subject-assign.validation");
const router = express_1.default.Router();
router.post('/', (0, auth_1.auth)('admin', 'super_admin'), (0, validateRequest_1.validateRequest)(subject_assign_validation_1.SubjectValidations.createSubjectValidation), subject_assign_controller_1.subjectControllers.createSubject);
router.get('/', subject_assign_controller_1.subjectControllers.getAllSubjects);
router.get('/:id', subject_assign_controller_1.subjectControllers.getSingleSubject);
router.patch('/:id', (0, auth_1.auth)('admin', 'super_admin'), (0, validateRequest_1.validateRequest)(subject_assign_validation_1.SubjectValidations.updateSubjectValidation), subject_assign_controller_1.subjectControllers.updateSubject);
router.delete('/:id', (0, auth_1.auth)('admin', 'super_admin'), subject_assign_controller_1.subjectControllers.deleteSubject);
exports.subjectAssignRoute = router;
