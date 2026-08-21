"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenseCategoryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const auth_1 = require("../../middlewares/auth");
const validation_1 = require("./validation");
const controller_1 = require("./controller");
const router = express_1.default.Router();
router.post('/', (0, auth_1.auth)('admin', 'super_admin'), (0, validateRequest_1.validateRequest)(validation_1.ExpenseCategoryValidations.createExpenseCategoryValidation), controller_1.expenseCategoryControllers.createExpenseCategory);
router.get('/', controller_1.expenseCategoryControllers.getAllExpenseCategorys);
router.get('/:id', controller_1.expenseCategoryControllers.getSingleExpenseCategory);
router.patch('/:id', (0, auth_1.auth)('admin', 'super_admin'), (0, validateRequest_1.validateRequest)(validation_1.ExpenseCategoryValidations.updateExpenseCategoryValidation), controller_1.expenseCategoryControllers.updateExpenseCategory);
router.delete('/:id', (0, auth_1.auth)('admin', 'super_admin'), controller_1.expenseCategoryControllers.deleteExpenseCategory);
exports.expenseCategoryRoutes = router;
