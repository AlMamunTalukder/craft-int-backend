import express from 'express';
import { receiptControllers } from './controller';

const router = express.Router();
router.get('/student/:studentId', receiptControllers.getStudentReceipts);
router.get(
  '/student/:studentId/complete',
  receiptControllers.getCompleteReceipts,
);
router.get('/:receiptNo', receiptControllers.getReceiptByNumber);
router.get('/:receiptNo/print', receiptControllers.getReceiptForPrint);
router.post('/', receiptControllers.createManualReceipt);
export const receiptRoutes = router;
