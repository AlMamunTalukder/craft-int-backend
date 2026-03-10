import { catchAsync } from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import httpStatus from 'http-status';
import { lateFeeService } from './lateFeeService';
import { z } from 'zod';

// Config APIs
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
  const schema = z.object({
    enabled: z.boolean().optional(),
    dueDayOfMonth: z.number().min(1).max(31).optional(),
    defaultLateFeePerDay: z.number().min(0).optional(),
    maxLateFeePercentage: z.number().min(0).max(100).optional(),
    gracePeriodDays: z.number().min(0).optional(),
  });
  const validated = schema.parse(req.body);

  const config = lateFeeService.updateConfig(validated);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Late fee configuration updated successfully',
    data: config,
  });
});

// Manual daily late fee calculation
const calculateDailyLateFees = catchAsync(async (req, res) => {
  const result = await lateFeeService.applyDailyLateFees();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Daily late fees calculated successfully',
    data: result,
  });
});

// Customize single fee
const customizeLateFee = catchAsync(async (req, res) => {
  const schema = z.object({
    newLateFeeAmount: z.number().min(0),
    reason: z.string(),
    customizedBy: z.string(),
    perDayRate: z.number().optional(),
    notes: z.string().optional(),
  });
  const validated = schema.parse(req.body);
  const { feeId } = req.params;

  const result = await lateFeeService.customizeLateFee(
    feeId,
    validated.newLateFeeAmount,
    validated.reason,
    validated.customizedBy,
    validated.perDayRate,
    validated.notes,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

// Bulk customize student
const bulkCustomizeStudentLateFees = catchAsync(async (req, res) => {
  const schema = z.object({
    newLateFeeAmount: z.number().min(0),
    reason: z.string(),
    customizedBy: z.string(),
    month: z.string().optional(),
    academicYear: z.string().optional(),
  });
  const validated = schema.parse(req.body);
  const { studentId } = req.params;

  const result = await lateFeeService.bulkCustomizeStudentLateFees(
    studentId,
    validated.newLateFeeAmount,
    validated.reason,
    validated.customizedBy,
    validated.month,
    validated.academicYear,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

// History
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

// Fee summary
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

// Optional: student late fee list
const getStudentLateFees = catchAsync(async (req, res) => {
  const { studentId } = req.params;
  const result = await lateFeeService.getStudentLateFees(studentId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Student late fees retrieved successfully',
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
  getStudentLateFees,
};
