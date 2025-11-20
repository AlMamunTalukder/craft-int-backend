// controller.ts
import { catchAsync } from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import httpStatus from 'http-status';
import { feesServices } from './service';

const createMonthlyFees = catchAsync(async (req, res) => {
  const { studentId, enrollmentId, studentClass, yearlyFee, startYear } = req.body;
  const result = await feesServices.generateMonthlyFees(
    studentId,
    enrollmentId,
    studentClass,
    yearlyFee,
    startYear
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Monthly fees created successfully',
    data: result,
  });
});

const createBulkMonthlyFees = catchAsync(async (req, res) => {
  const { feeData } = req.body;
  const result = await feesServices.generateBulkMonthlyFees(feeData);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Bulk monthly fees created successfully',
    data: result,
  });
});

const payFee = catchAsync(async (req, res) => {
  const { feeId, amountPaid, paymentMethod, transactionId, receiptNo } = req.body;
  const result = await feesServices.payFee(
    feeId,
    amountPaid,
    paymentMethod,
    transactionId,
    receiptNo
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Fee payment processed successfully',
    data: result,
  });
});

const payFeeWithAdvance = catchAsync(async (req, res) => {
  const { feeId, cashPaid, advanceUsed, paymentMethod, transactionId, receiptNo } = req.body;
  const result = await feesServices.payFeeWithAdvance(
    feeId,
    cashPaid,
    advanceUsed,
    paymentMethod,
    transactionId,
    receiptNo
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Fee payment with advance processed successfully',
    data: result,
  });
});

const getStudentDueFees = catchAsync(async (req, res) => {
  const { studentId } = req.params;
  const { year } = req.query;
  const result = await feesServices.getStudentDueFees(
    studentId,
    year ? parseInt(year as string) : undefined
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Student due fees retrieved successfully',
    data: result,
  });
});

const getMonthlyFeeStatus = catchAsync(async (req, res) => {
  const { studentId, month, year } = req.params;
  const result = await feesServices.getMonthlyFeeStatus(
    studentId,
    month,
    parseInt(year)
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Monthly fee status retrieved successfully',
    data: result,
  });
});

// আগের কন্ট্রোলারগুলো একই থাকবে
const getAllFees = catchAsync(async (req, res) => {
  const result = await feesServices.getAllFees(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Fee records retrieved successfully',
    data: result,
  });
});

const getSingleFee = catchAsync(async (req, res) => {
  const result = await feesServices.getSingleFee(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Fee record retrieved successfully',
    data: result,
  });
});

const updateFee = catchAsync(async (req, res) => {
  const result = await feesServices.updateFee(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Fee record updated successfully',
    data: result,
  });
});

const deleteFee = catchAsync(async (req, res) => {
  const result = await feesServices.deleteFee(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Fee record deleted successfully',
    data: result,
  });
});

export const feesControllers = {
  createMonthlyFees,
  createBulkMonthlyFees,
  payFee,
  payFeeWithAdvance,
  getStudentDueFees,
  getMonthlyFeeStatus,
  getAllFees,
  getSingleFee,
  updateFee,
  deleteFee,
};