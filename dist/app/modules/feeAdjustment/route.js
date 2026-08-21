"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.feeAdjustmentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const controller_1 = require("./controller");
const router = express_1.default.Router();
router.post('/', controller_1.feeAdjustmentControllers.createFeeAdjustment);
router.post('/bulk/student', controller_1.feeAdjustmentControllers.applyBulkAdjustments);
router.get('/student/:studentId', controller_1.feeAdjustmentControllers.getStudentAdjustments);
router.get('/report/:studentId/:academicYear', controller_1.feeAdjustmentControllers.getFeeReport);
router.get('/', controller_1.feeAdjustmentControllers.getAllFeeAdjustments);
router.get('/:id', controller_1.feeAdjustmentControllers.getSingleFeeAdjustment);
router.patch('/:id', controller_1.feeAdjustmentControllers.updateFeeAdjustment);
router.delete('/:id', controller_1.feeAdjustmentControllers.deleteFeeAdjustment);
exports.feeAdjustmentRoutes = router;
