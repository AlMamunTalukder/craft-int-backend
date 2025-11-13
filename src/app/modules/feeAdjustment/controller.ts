import httpStatus from "http-status";
import sendResponse from "../../../utils/sendResponse";
import { catchAsync } from "../../../utils/catchAsync";
import { feeAdjustmentServices } from "./service";

const createFeeAdjustment = catchAsync(async (req, res) => {
  const result = await feeAdjustmentServices.createFeeAdjustment(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "FeeAdjustment created successfully",
    data: result,
  });
});

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
};
