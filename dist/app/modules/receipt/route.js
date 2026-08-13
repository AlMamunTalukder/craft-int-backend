"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.receiptRoutes = void 0;
const express_1 = __importDefault(require("express"));
const controller_1 = require("./controller");
const router = express_1.default.Router();
router.get('/student/:studentId', controller_1.receiptControllers.getStudentReceipts);
router.get('/student/:studentId/complete', controller_1.receiptControllers.getCompleteReceipts);
router.get('/:receiptNo', controller_1.receiptControllers.getReceiptByNumber);
router.get('/:receiptNo/print', controller_1.receiptControllers.getReceiptForPrint);
router.post('/', controller_1.receiptControllers.createManualReceipt);
exports.receiptRoutes = router;
