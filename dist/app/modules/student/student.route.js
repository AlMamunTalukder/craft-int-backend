"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentRoutes = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const express_1 = __importDefault(require("express"));
const student_controller_1 = require("./student.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const student_validation_1 = require("./student.validation");
const router = express_1.default.Router();
router.post('/', (0, validateRequest_1.validateRequest)(student_validation_1.createStudentValidation), student_controller_1.studentControllers.createStudent);
router.get('/', student_controller_1.studentControllers.getAllStudents);
router.get('/by-user/:userId', student_controller_1.studentControllers.getStudentByUserId);
router.get('/:id', student_controller_1.studentControllers.getSingleStudent);
router.delete('/:id', student_controller_1.studentControllers.deleteStudent);
router.patch('/:id', student_controller_1.studentControllers.updateStudent);
exports.studentRoutes = router;
