"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.investmentRoutes = void 0;
// investment/routes.ts
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const validation_1 = require("./validation");
const controller_1 = require("./controller");
const router = express_1.default.Router();
router.post('/', (0, validateRequest_1.validateRequest)(validation_1.InvestmentValidations.createInvestmentValidation), controller_1.investmentControllers.createInvestment);
router.get('/', controller_1.investmentControllers.getAllInvestments);
router.get('/:id', controller_1.investmentControllers.getSingleInvestment);
router.patch('/:id', (0, validateRequest_1.validateRequest)(validation_1.InvestmentValidations.updateInvestmentValidation), controller_1.investmentControllers.updateInvestment);
router.delete('/:id', controller_1.investmentControllers.deleteInvestment);
// New routes for investment management
router.post('/:id/returns', (0, validateRequest_1.validateRequest)(validation_1.InvestmentValidations.addReturnValidation), controller_1.investmentControllers.addReturn);
router.post('/:id/close', controller_1.investmentControllers.closeInvestment);
router.get('/:id/performance', controller_1.investmentControllers.getPerformance);
exports.investmentRoutes = router;
