import httpStatus from 'http-status';
import sendResponse from '../../../utils/sendResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { assetServices } from './service';

const createAsset = catchAsync(async (req, res) => {
  const result = await assetServices.createAsset(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Asset added successfully',
    data: result,
  });
});

const getAllAssets = catchAsync(async (req, res) => {
  const result = await assetServices.getAllAssets(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Assets retrieved successfully',
    data: result,
  });
});

const getSingleAsset = catchAsync(async (req, res) => {
  const result = await assetServices.getSingleAsset(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Asset retrieved successfully',
    data: result,
  });
});

const updateAsset = catchAsync(async (req, res) => {
  const result = await assetServices.updateAsset(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Asset updated successfully',
    data: result,
  });
});

const deleteAsset = catchAsync(async (req, res) => {
  const result = await assetServices.deleteAsset(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Asset deleted successfully',
    data: result,
  });
});

const getSummary = catchAsync(async (req, res) => {
  const result = await assetServices.getSummary();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Asset summary retrieved successfully',
    data: result,
  });
});

export const assetControllers = {
  createAsset,
  getAllAssets,
  getSingleAsset,
  updateAsset,
  deleteAsset,
  getSummary,
};
