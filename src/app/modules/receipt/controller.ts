import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../../utils/catchAsync';
import { receiptServices } from './service';

const getCompleteReceipts = catchAsync(async (req: Request, res: Response) => {
  const { studentId } = req.params;

  const receipts = await receiptServices.getCompleteReceipts(studentId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'সম্পূর্ণ রিসিট ডাটা সফলভাবে লোড হয়েছে',
    data: receipts,
  });
});

const getStudentReceipts = catchAsync(async (req: Request, res: Response) => {
  const { studentId } = req.params;

  const receipts = await receiptServices.getStudentReceipts(studentId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'রিসিটগুলি সফলভাবে লোড হয়েছে',
    data: receipts,
  });
});

const getReceiptByNumber = catchAsync(async (req: Request, res: Response) => {
  const { receiptNo } = req.params;

  const receipt = await receiptServices.getReceiptByNumber(receiptNo);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'রিসিট সফলভাবে লোড হয়েছে',
    data: receipt,
  });
});

const getReceiptForPrint = catchAsync(async (req: Request, res: Response) => {
  const { receiptNo } = req.params;

  const receipt = await receiptServices.getReceiptForPrint(receiptNo);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'প্রিন্টের জন্য রিসিট ডেটা প্রস্তুত',
    data: receipt,
  });
});

const createManualReceipt = catchAsync(async (req: Request, res: Response) => {
  const receiptData = req.body;

  const receipt = await receiptServices.createManualReceipt(receiptData);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'রিসিট সফলভাবে তৈরি হয়েছে',
    data: receipt,
  });
});

export const receiptControllers = {
  getStudentReceipts,
  getCompleteReceipts, // ← নতুন কন্ট্রোলার যোগ করুন
  getReceiptByNumber,
  getReceiptForPrint,
  createManualReceipt,
};
