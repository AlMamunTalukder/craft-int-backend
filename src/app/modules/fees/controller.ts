import httpStatus from 'http-status';
import sendResponse from '../../../utils/sendResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { feesServices } from './service';

const createFees = catchAsync(async (req, res) => {
  const result = await feesServices.createFees(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Fee record created successfully',
    data: result,
  });
});

const getAllFees = catchAsync(async (req, res) => {
  const result = await feesServices.getAllFees(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Fee records retrieved successfully',
    data: result,
  });
});

const getSingleFees = catchAsync(async (req, res) => {
  const result = await feesServices.getSingleFees(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Fee record retrieved successfully',
    data: result,
  });
});

const updateFees = catchAsync(async (req, res) => {
  const result = await feesServices.updateFees(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Fee record updated successfully',
    data: result,
  });
});

const deleteFees = catchAsync(async (req, res) => {
  const result = await feesServices.deleteFees(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Fee record deleted successfully',
    data: result,
  });
});

export const feesControllers = {
  createFees,
  getAllFees,
  getSingleFees,
  updateFees,
  deleteFees,
};
