// feeAdjustment/controller.ts
import httpStatus from "http-status";
import sendResponse from "../../../utils/sendResponse";
import { catchAsync } from "../../../utils/catchAsync";
import { feeAdjustmentServices } from "./service";

const createFeeAdjustment = catchAsync(async (req, res) => {
  const result = await feeAdjustmentServices.createFeeAdjustment(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Fee Adjustment created and applied successfully",
    data: result,
  });
});

const applyBulkAdjustments = catchAsync(async (req, res) => {
  const { studentId, ...adjustmentData } = req.body;
  const result = await feeAdjustmentServices.applyAdjustmentToStudentFees(studentId, adjustmentData);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Fee Adjustments applied to all student fees successfully",
    data: result,
  });
});

const getStudentAdjustments = catchAsync(async (req, res) => {
  const { studentId } = req.params;
  const { academicYear } = req.query;

  const result = await feeAdjustmentServices.getStudentActiveAdjustments(
    studentId,
    academicYear as string
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Student fee adjustments retrieved successfully",
    data: result,
  });
});

const getFeeReport = catchAsync(async (req, res) => {
  const { studentId, academicYear } = req.params;

  const result = await feeAdjustmentServices.getFeeReportWithAdjustments(
    studentId,
    academicYear
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Fee report with adjustments retrieved successfully",
    data: result,
  });
});

// আগের controller functions গুলো একই থাকবে
const getAllFeeAdjustments = catchAsync(async (req, res) => {
  const result = await feeAdjustmentServices.getAllFeeAdjustments(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "FeeAdjustments retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleFeeAdjustment = catchAsync(async (req, res) => {
  const result = await feeAdjustmentServices.getSingleFeeAdjustment(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "FeeAdjustment retrieved successfully",
    data: result,
  });
});

const updateFeeAdjustment = catchAsync(async (req, res) => {
  const result = await feeAdjustmentServices.updateFeeAdjustment(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "FeeAdjustment updated successfully",
    data: result,
  });
});

const deleteFeeAdjustment = catchAsync(async (req, res) => {
  const result = await feeAdjustmentServices.deleteFeeAdjustment(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "FeeAdjustment deleted successfully",
    data: result,
  });
});

export const feeAdjustmentControllers = {
  createFeeAdjustment,
  getAllFeeAdjustments,
  getSingleFeeAdjustment,
  updateFeeAdjustment,
  deleteFeeAdjustment,
  applyBulkAdjustments,
  getStudentAdjustments,
  getFeeReport,
};