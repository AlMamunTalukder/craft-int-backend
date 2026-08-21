"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.incomeRoutes = void 0;
const express_1 = __importDefault(require("express"));
const income_controller_1 = require("./income.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const auth_1 = require("../../middlewares/auth");
const income_validation_1 = require("./income.validation");
const router = express_1.default.Router();
router.post('/', (0, validateRequest_1.validateRequest)(income_validation_1.incomeSchema), income_controller_1.incomeControllers.createIncome);
router.get('/', income_controller_1.incomeControllers.getAllIncomes);
router.get("/total-income-category", income_controller_1.incomeControllers.getIncomeTotalsByCategory);
router.get('/:id', income_controller_1.incomeControllers.getSingleIncome);
router.patch('/:id', income_controller_1.incomeControllers.updateIncome);
router.delete('/:id', (0, auth_1.auth)('admin', 'super_admin'), income_controller_1.incomeControllers.deleteIncome);
exports.incomeRoutes = router;
