"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const controller_1 = require("./controller");
const router = express_1.default.Router();
router.get('/', controller_1.paymentControllers.getAllPayments);
router.post('/bulk', controller_1.paymentControllers.createBulkPayment);
router.get('/receipt/:paymentId', controller_1.paymentControllers.generateReceipt);
router.post('/', controller_1.paymentControllers.createPayment);
router.get('/:id', controller_1.paymentControllers.getSinglePayment);
router.patch('/:id', controller_1.paymentControllers.updatePayment);
router.delete('/:id', controller_1.paymentControllers.deletePayment);
exports.paymentRoutes = router;
