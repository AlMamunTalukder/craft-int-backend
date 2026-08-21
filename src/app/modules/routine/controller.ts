import httpStatus from 'http-status';
import sendResponse from '../../../utils/sendResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { routineServices } from './service';

const createRoutine = catchAsync(async (req, res) => {
  const result = await routineServices.createRoutine(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Class routine created successfully',
    data: result,
  });
});

const getAllRoutines = catchAsync(async (req, res) => {
  const result = await routineServices.getAllRoutines(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class routines retrieved successfully',
    data: result,
  });
});

const getSingleRoutine = catchAsync(async (req, res) => {
  const result = await routineServices.getSingleRoutine(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class routine retrieved successfully',
    data: result,
  });
});

const updateRoutine = catchAsync(async (req, res) => {
  const result = await routineServices.updateRoutine(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class routine updated successfully',
    data: result,
  });
});

const deleteRoutine = catchAsync(async (req, res) => {
  const result = await routineServices.deleteRoutine(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class routine deleted successfully',
    data: result,
  });
});

const getWeekRoutine = catchAsync(async (req, res) => {
  const result = await routineServices.getWeekRoutine(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Weekly routine retrieved successfully',
    data: result,
  });
});

export const routineControllers = {
  createRoutine,
  getAllRoutines,
  getSingleRoutine,
  updateRoutine,
  deleteRoutine,
  getWeekRoutine,
};
