import httpStatus from 'http-status';
import sendResponse from '../../../utils/sendResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { leaveServices } from './service';

const createLeave = catchAsync(async (req, res) => {
  const result = await leaveServices.createLeave(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Leave application submitted',
    data: result,
  });
});

const getAllLeaves = catchAsync(async (req, res) => {
  const result = await leaveServices.getAllLeaves(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Leave records retrieved successfully',
    data: result,
  });
});

const getSingleLeave = catchAsync(async (req, res) => {
  const result = await leaveServices.getSingleLeave(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Leave retrieved successfully',
    data: result,
  });
});

const updateLeave = catchAsync(async (req, res) => {
  const result = await leaveServices.updateLeave(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Leave updated successfully',
    data: result,
  });
});

const updateLeaveStatus = catchAsync(async (req, res) => {
  const result = await leaveServices.updateLeaveStatus(
    req.params.id,
    req.body.status,
    (req as any).user?._id,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Leave ${req.body.status} successfully`,
    data: result,
  });
});

const deleteLeave = catchAsync(async (req, res) => {
  const result = await leaveServices.deleteLeave(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Leave deleted successfully',
    data: result,
  });
});

export const leaveControllers = {
  createLeave,
  getAllLeaves,
  getSingleLeave,
  updateLeave,
  updateLeaveStatus,
  deleteLeave,
};
