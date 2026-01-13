/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import { Receipt } from './model';

const createReceipt = async (
  paymentData: any,
  studentData: any,
  feeDetails: any[],
) => {
  try {
    const receiptNo = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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
        subtotal: feeDetails.reduce((sum, fee) => sum + fee.originalAmount, 0),
        totalDiscount: feeDetails.reduce(
          (sum, fee) => sum + (fee.discount || 0),
          0,
        ),
        totalWaiver: feeDetails.reduce(
          (sum, fee) => sum + (fee.waiver || 0),
          0,
        ),
        totalNetAmount: feeDetails.reduce((sum, fee) => sum + fee.netAmount, 0),
        amountPaid: paymentData.totalAmount,
      },
    };

    const receipt = await Receipt.create(receiptData);

    return receipt;
  } catch (error: any) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'রিসিট তৈরি করতে সমস্যা হয়েছে',
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
    throw new AppError(httpStatus.NOT_FOUND, 'রিসিট পাওয়া যায়নি');
  }

  return receipt;
};

const getReceiptForPrint = async (receiptNo: string) => {
  const receipt = await Receipt.findOne({ receiptNo }).lean();

  if (!receipt) {
    throw new AppError(httpStatus.NOT_FOUND, 'রিসিট পাওয়া যায়নি');
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
  getCompleteReceipts, // ← নতুন ফাংশন যোগ করুন
  getReceiptByNumber,
  getReceiptForPrint,
  createManualReceipt, // ← নতুন ফাংশন যোগ করুন
};
