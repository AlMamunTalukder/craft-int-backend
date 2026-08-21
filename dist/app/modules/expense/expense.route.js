"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenseRoutes = void 0;
const express_1 = __importDefault(require("express"));
const expense_controller_1 = require("./expense.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const auth_1 = require("../../middlewares/auth");
const expense_validation_1 = require("./expense.validation");
const router = express_1.default.Router();
router.post('/', (0, validateRequest_1.validateRequest)(expense_validation_1.expenseSchema), expense_controller_1.expenseControllers.createExpense);
router.get('/', expense_controller_1.expenseControllers.getAllExpenses);
router.get('/total-expense-category', expense_controller_1.expenseControllers.getExpenseTotalsByCategory);
router.get('/:id', expense_controller_1.expenseControllers.getSingleExpense);
router.patch('/:id', expense_controller_1.expenseControllers.updateExpense);
router.delete('/:id', (0, auth_1.auth)('admin', 'super_admin'), expense_controller_1.expenseControllers.deleteExpense);
exports.expenseRoutes = router;
