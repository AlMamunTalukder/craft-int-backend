import httpStatus from 'http-status';

import sendResponse from '../../../utils/sendResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { paymentServices } from './service';

const createPayment = catchAsync(async (req, res) => {
  const result = await paymentServices.createPayment(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Payment created successfully',
    data: result,
  });
});

const getAllPayments = catchAsync(async (req, res) => {
  const result = await paymentServices.getAllPayments(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payments retrieved successfully',
    data: result,
  });
});

const getSinglePayment = catchAsync(async (req, res) => {
  const result = await paymentServices.getSinglePayment(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment retrieved successfully',
    data: result,
  });
});

const updatePayment = catchAsync(async (req, res) => {
  const result = await paymentServices.updatePayment(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment updated successfully',
    data: result,
  });
});

const deletePayment = catchAsync(async (req, res) => {
  const result = await paymentServices.deletePayment(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment deleted successfully',
    data: result,
  });
});

export const paymentControllers = {
  createPayment,
  getAllPayments,
  getSinglePayment,
  updatePayment,
  deletePayment,
};
