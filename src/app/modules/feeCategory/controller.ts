import httpStatus from 'http-status';
import sendResponse from '../../../utils/sendResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { feeCategoryServices } from './service';

const createFeeCategory = catchAsync(async (req, res) => {
  let result;
  if (Array.isArray(req.body)) {
    result = await feeCategoryServices.createFeeCategory(req.body);
  } else {
    result = await feeCategoryServices.createFeeCategory(req.body);
  }

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: Array.isArray(req.body)
      ? 'Fee categories created successfully'
      : 'Fee category created successfully',
    data: result,
  });
});

const getAllFeeCategories = catchAsync(async (req, res) => {
  const result = await feeCategoryServices.getAllFeeCategories(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Fee categories retrieved successfully',
    data: result,
  });
});

const getSingleFeeCategory = catchAsync(async (req, res) => {
  const result = await feeCategoryServices.getSingleFeeCategory(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Fee category retrieved successfully',
    data: result,
  });
});

const updateFeeCategory = catchAsync(async (req, res) => {
  const result = await feeCategoryServices.updateFeeCategory(
    req.params.id,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Fee category updated successfully',
    data: result,
  });
});

const deleteFeeCategory = catchAsync(async (req, res) => {
  const result = await feeCategoryServices.deleteFeeCategory(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Fee category deleted successfully',
    data: result,
  });
});

export const feeCategoryControllers = {
  createFeeCategory,
  getAllFeeCategories,
  getSingleFeeCategory,
  updateFeeCategory,
  deleteFeeCategory,
};
