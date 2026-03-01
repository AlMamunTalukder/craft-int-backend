// modules/fees/controllers/lateFee.controller.ts
import { catchAsync } from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import httpStatus from 'http-status';
import { lateFeeService } from './lateFeeService';

const getConfig = catchAsync(async (req, res) => {
  const config = lateFeeService.getConfig();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Late fee configuration retrieved successfully',
    data: config,
  });
});

const updateConfig = catchAsync(async (req, res) => {
  const config = lateFeeService.updateConfig(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Late fee configuration updated successfully',
    data: config,
  });
});

const calculateDailyLateFees = catchAsync(async (req, res) => {
  const result = await lateFeeService.applyDailyLateFees();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Daily late fees calculated successfully',
    data: result,
  });
});

const customizeLateFee = catchAsync(async (req, res) => {
  const { feeId } = req.params;
  const { newLateFeeAmount, reason, customizedBy, perDayRate, notes } =
    req.body;

  const result = await lateFeeService.customizeLateFee(
    feeId,
    newLateFeeAmount,
    reason,
    customizedBy,
    perDayRate,
    notes,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const bulkCustomizeStudentLateFees = catchAsync(async (req, res) => {
  const { studentId } = req.params;
  const { newLateFeeAmount, reason, customizedBy, month, academicYear } =
    req.body;

  const result = await lateFeeService.bulkCustomizeStudentLateFees(
    studentId,
    newLateFeeAmount,
    reason,
    customizedBy,
    month,
    academicYear,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const getCustomizationHistory = catchAsync(async (req, res) => {
  const { feeId } = req.params;
  const result = await lateFeeService.getCustomizationHistory(feeId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Customization history retrieved successfully',
    data: result,
  });
});

const getFeeDueSummary = catchAsync(async (req, res) => {
  const { feeId } = req.params;
  const result = await lateFeeService.getFeeDueSummary(feeId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Fee due summary retrieved successfully',
    data: result,
  });
});

export const lateFeeControllers = {
  getConfig,
  updateConfig,
  calculateDailyLateFees,
  customizeLateFee,
  bulkCustomizeStudentLateFees,
  getCustomizationHistory,
  getFeeDueSummary,
};
