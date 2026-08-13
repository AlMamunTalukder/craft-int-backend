"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loanRoutes = void 0;
// loan/routes.ts
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const validation_1 = require("./validation");
const controller_1 = require("./controller");
const router = express_1.default.Router();
router.post('/', (0, validateRequest_1.validateRequest)(validation_1.LoanValidations.createLoanValidation), controller_1.loanControllers.createLoan);
router.get('/', controller_1.loanControllers.getAllLoans);
router.get('/:id', controller_1.loanControllers.getSingleLoan);
router.patch('/:id', (0, validateRequest_1.validateRequest)(validation_1.LoanValidations.updateLoanValidation), controller_1.loanControllers.updateLoan);
router.delete('/:id', controller_1.loanControllers.deleteLoan);
// New routes for loan management
router.post('/:id/repayments', (0, validateRequest_1.validateRequest)(validation_1.LoanValidations.addRepaymentValidation), controller_1.loanControllers.addRepayment);
router.post('/:id/transfer', (0, validateRequest_1.validateRequest)(validation_1.LoanValidations.transferLoanValidation), controller_1.loanControllers.transferLoan);
router.get('/:id/amortization', controller_1.loanControllers.getAmortization);
exports.loanRoutes = router;
