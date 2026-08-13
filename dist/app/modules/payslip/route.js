"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.payslipRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const auth_1 = require("../../middlewares/auth");
const controller_1 = require("./controller");
const validation_1 = require("./validation");
const router = express_1.default.Router();
router.get('/summary', controller_1.payslipControllers.getSummary);
router.post('/generate', (0, auth_1.auth)('admin', 'super_admin'), (0, validateRequest_1.validateRequest)(validation_1.payslipValidations.generatePayslipsValidation), controller_1.payslipControllers.generatePayslips);
router.get('/', controller_1.payslipControllers.getAllPayslips);
router.patch('/:id/paid', (0, auth_1.auth)('admin', 'super_admin'), controller_1.payslipControllers.markPaid);
router.get('/:id', controller_1.payslipControllers.getSinglePayslip);
router.delete('/:id', (0, auth_1.auth)('admin', 'super_admin'), controller_1.payslipControllers.deletePayslip);
exports.payslipRoutes = router;
