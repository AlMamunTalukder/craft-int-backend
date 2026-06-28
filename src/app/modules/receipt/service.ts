/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import { Receipt } from './model';
import { numberToWords } from '../../../utils/numberToWords';

const createReceipt = async (
  paymentData: any,
  studentData: any,
  feeDetails: any[],
) => {
  try {
    const receiptNo = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Calculate summary values
    const subtotal = feeDetails.reduce((sum, fee) => sum + fee.originalAmount, 0);
    const totalDiscount = feeDetails.reduce((sum, fee) => sum + (fee.discount || 0), 0);
    const totalWaiver = feeDetails.reduce((sum, fee) => sum + (fee.waiver || 0), 0);
    const totalNetAmount = feeDetails.reduce((sum, fee) => sum + fee.netAmount, 0);
    const amountPaid = paymentData.totalAmount;

    const receiptData = {
      receiptNo,
      student: paymentData.studentId,
      studentName: studentData.name,
      studentId: studentData.studentId,
      className: studentData.className || 'N/A',
      paymentId: paymentData._id,
      totalAmount: paymentData.totalAmount,
      paymentMethod: paymentData.paymentMethod,
      paymentDate: paymentData.paymentDate || new Date(),
      collectedBy: paymentData.collectedBy,
      transactionId: paymentData.transactionId,
      note: paymentData.note,
      fees: feeDetails.map((fee) => ({
        feeType: fee.feeType,
        month: fee.month,
        originalAmount: fee.originalAmount,
        discount: fee.discount || 0,
        waiver: fee.waiver || 0,
        netAmount: fee.netAmount,
        paidAmount: fee.paidAmount,
      })),
      summary: {
        totalItems: feeDetails.length,
        subtotal: subtotal,
        totalDiscount: totalDiscount,
        totalWaiver: totalWaiver,
        totalNetAmount: totalNetAmount,
        amountPaid: amountPaid,
        subtotalWord: numberToWords(subtotal),
        totalNetAmountWord: numberToWords(totalNetAmount),
        amountPaidWord: numberToWords(amountPaid)
      },
    };

    const receipt = await Receipt.create(receiptData);
    return receipt;
  } catch (error: any) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to make receipt',
    );
  }
};

const getStudentReceipts = async (studentId: string) => {
  const receipts = await Receipt.find({ student: studentId })
    .sort({ paymentDate: -1 })
    .populate('student', 'name studentId className')
    .lean();

  return receipts;
};

const getCompleteReceipts = async (studentId: string) => {
  const receipts = await Receipt.find({ student: studentId })
    .sort({ paymentDate: -1 })
    .populate('student', 'name studentId className email phone')
    .populate('generatedBy', 'name email')
    .lean();

  return receipts;
};

const getReceiptByNumber = async (receiptNo: string) => {
  const receipt = await Receipt.findOne({ receiptNo })
    .populate('student', 'name studentId className email phone')
    .populate('generatedBy', 'name email')
    .lean();

  if (!receipt) {
    throw new AppError(httpStatus.NOT_FOUND, 'Do not found money receipt!');
  }

  return receipt;
};

const getReceiptForPrint = async (receiptNo: string) => {
  const receipt = await Receipt.findOne({ receiptNo }).lean();

  if (!receipt) {
    throw new AppError(httpStatus.NOT_FOUND, 'Do not found money receipt!');
  }

  const formattedReceipt = {
    ...receipt,
    formattedDate: new Date(receipt.paymentDate).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    formattedTime: new Date(receipt.paymentDate).toLocaleTimeString('bn-BD', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  return formattedReceipt;
};

const createManualReceipt = async (receiptData: any) => {
  const receipt = await Receipt.create(receiptData);
  return receipt;
};

export const receiptServices = {
  createReceipt,
  getStudentReceipts,
  getCompleteReceipts,
  getReceiptByNumber,
  getReceiptForPrint,
  createManualReceipt,
};
