"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.feeCategoryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
// import { auth } from '../../middlewares/auth';
const controller_1 = require("./controller");
const validation_1 = require("./validation");
const router = express_1.default.Router();
router.post('/', 
// auth('admin', 'super_admin'),
(0, validateRequest_1.validateRequest)(validation_1.createFeeCategoryValidation), controller_1.feeCategoryControllers.createFeeCategory);
router.get('/', controller_1.feeCategoryControllers.getAllFeeCategories);
router.get('/:id', controller_1.feeCategoryControllers.getSingleFeeCategory);
router.patch('/:id', 
// auth('admin', 'super_admin'),
(0, validateRequest_1.validateRequest)(validation_1.updateFeeCategoryValidation), controller_1.feeCategoryControllers.updateFeeCategory);
router.delete('/:id', 
// auth('admin', 'super_admin'),
controller_1.feeCategoryControllers.deleteFeeCategory);
exports.feeCategoryRoutes = router;
