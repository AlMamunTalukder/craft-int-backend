import httpStatus from 'http-status';
import sendResponse from '../../../utils/sendResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { examServices } from './service';

const createExam = catchAsync(async (req, res) => {
  const result = await examServices.createExam(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Exam created successfully',
    data: result,
  });
});

const getAllExams = catchAsync(async (req, res) => {
  const result = await examServices.getAllExams(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Exams retrieved successfully',
    data: result,
  });
});

const getSingleExam = catchAsync(async (req, res) => {
  const result = await examServices.getSingleExam(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Exam retrieved successfully',
    data: result,
  });
});

const updateExam = catchAsync(async (req, res) => {
  const result = await examServices.updateExam(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Exam updated successfully',
    data: result,
  });
});

const deleteExam = catchAsync(async (req, res) => {
  const result = await examServices.deleteExam(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Exam deleted successfully',
    data: result,
  });
});

const publishExam = catchAsync(async (req, res) => {
  const result = await examServices.publishExam(req.params.id, req.body.status);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Exam status updated successfully',
    data: result,
  });
});

const getMarks = catchAsync(async (req, res) => {
  const result = await examServices.getMarks(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Marks retrieved successfully',
    data: result,
  });
});

const upsertMarks = catchAsync(async (req, res) => {
  const result = await examServices.upsertMarks(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Marks saved successfully',
    data: result,
  });
});

const getResults = catchAsync(async (req, res) => {
  const result = await examServices.getResults({
    ...req.query,
    examId: req.params.examId,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Results retrieved successfully',
    data: result,
  });
});

export const examControllers = {
  createExam,
  getAllExams,
  getSingleExam,
  updateExam,
  deleteExam,
  publishExam,
  getMarks,
  upsertMarks,
  getResults,
};
