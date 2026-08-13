"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.incomeCategoryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const validation_1 = require("./validation");
const controller_1 = require("./controller");
const router = express_1.default.Router();
router.post('/', 
// auth('admin', 'super_admin'),
(0, validateRequest_1.validateRequest)(validation_1.IncomeCategoryValidations.createIncomeCategoryValidation), controller_1.incomeCategoryControllers.createIncomeCategory);
router.get('/', controller_1.incomeCategoryControllers.getAllIncomeCategorys);
router.get('/:id', controller_1.incomeCategoryControllers.getSingleIncomeCategory);
router.patch('/:id', 
// auth('admin', 'super_admin'),
(0, validateRequest_1.validateRequest)(validation_1.IncomeCategoryValidations.updateIncomeCategoryValidation), controller_1.incomeCategoryControllers.updateIncomeCategory);
router.delete('/:id', 
// auth('admin', 'super_admin'), 
controller_1.incomeCategoryControllers.deleteIncomeCategory);
exports.incomeCategoryRoutes = router;
