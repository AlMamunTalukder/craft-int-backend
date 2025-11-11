import httpStatus from 'http-status';
import sendResponse from '../../../utils/sendResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { enrollmentServices } from './service';

const createEnrollment = catchAsync(async (req, res) => {
  const result = await enrollmentServices.createEnrollment(req.body);
  console.log('body check this ', req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Enrollment created successfully',
    data: result,
  });
});

const promoteEnrollment = catchAsync(async (req, res) => {
  const { studentId, classId, session } = req.body;
  const result = await enrollmentServices.promoteEnrollment(
    studentId,
    classId,
    session,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Student promoted successfully',
    data: result,
  });
});

const getAllEnrollments = catchAsync(async (req, res) => {
  const result = await enrollmentServices.getAllEnrollments(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Enrollments retrieved successfully',
    data: result,
  });
});

const getSingleEnrollment = catchAsync(async (req, res) => {
  const result = await enrollmentServices.getSingleEnrollment(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Enrollment retrieved successfully',
    data: result,
  });
});

const updateEnrollment = catchAsync(async (req, res) => {
  const result = await enrollmentServices.updateEnrollment(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Enrollment updated successfully',
    data: result,
  });
});

const deleteEnrollment = catchAsync(async (req, res) => {
  const result = await enrollmentServices.deleteEnrollment(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Enrollment deleted successfully',
    data: result,
  });
});

export const enrollmentControllers = {
  createEnrollment,
  promoteEnrollment,
  getAllEnrollments,
  getSingleEnrollment,
  updateEnrollment,
  deleteEnrollment,
};
