"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.salaryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const salary_controller_1 = require("./salary.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const auth_1 = require("../../middlewares/auth");
const salary_validation_1 = require("./salary.validation");
const router = express_1.default.Router();
router.post('/', (0, validateRequest_1.validateRequest)(salary_validation_1.createSalarySchema), salary_controller_1.salaryControllers.createSalary);
router.get('/', salary_controller_1.salaryControllers.getAllSalaries);
router.get('/:id', salary_controller_1.salaryControllers.getSingleSalary);
router.patch('/:id', salary_controller_1.salaryControllers.updateSalary);
router.delete('/:id', (0, auth_1.auth)('admin', 'super_admin'), salary_controller_1.salaryControllers.deleteSalary);
exports.salaryRoutes = router;
