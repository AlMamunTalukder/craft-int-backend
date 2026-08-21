"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherRoutes = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const express_1 = __importDefault(require("express"));
const teacher_controller_1 = require("./teacher.controller");
const router = express_1.default.Router();
router.post('/', 
// auth('admin', 'super_admin', 'teacher', 'student'),
// validateRequest(TeacherValidations.createTeacherValidation),
teacher_controller_1.teacherControllers.createTeacher);
router.get('/', teacher_controller_1.teacherControllers.getAllTeachers);
router.get('/:id', teacher_controller_1.teacherControllers.getSingleTeacher);
router.delete('/:id', 
// auth('admin', 'super_admin'),
teacher_controller_1.teacherControllers.deleteTeacher);
router.patch('/:id', 
// auth('admin', 'super_admin', 'teacher'),
// validateRequest(TeacherValidations.updateTeacherValidation),
teacher_controller_1.teacherControllers.updateTeacher);
// teacher.route.ts
router.post('/sync-users', teacher_controller_1.teacherControllers.syncTeacherUsers);
exports.teacherRoutes = router;
