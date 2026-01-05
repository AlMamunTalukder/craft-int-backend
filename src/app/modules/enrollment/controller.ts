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

const promoteEnrollment = catchAsync(async (req, res) => {
  const { studentId, newClassId, session, rollNumber, section } = req.body;

  const result = await enrollmentServices.promoteEnrollment(
    studentId,
    newClassId,
    session,
    rollNumber,
    section,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});

// Bulk promote students
const bulkPromoteEnrollments = catchAsync(async (req, res) => {
  const { promotions, session } = req.body;

  if (!promotions || !Array.isArray(promotions) || promotions.length === 0) {
    sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Promotions array and session are required',
      data: null,
    });
    return;
  }

  const result = await enrollmentServices.bulkPromoteEnrollments(
    promotions,
    session,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

// Get promotion history
const getPromotionHistory = catchAsync(async (req, res) => {
  const { studentId } = req.params;

  const result = await enrollmentServices.getPromotionHistory(studentId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});

// Get eligible students for promotion
const getPromotionEligibleStudents = catchAsync(async (req, res) => {
  const { session } = req.query;

  const result = await enrollmentServices.getPromotionEligibleStudents(
    (session as string) ||
      `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});

// Get promotion summary
const getPromotionSummary = catchAsync(async (req, res) => {
  const result = await enrollmentServices.getPromotionSummary();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});

export const enrollmentControllers = {
  createEnrollment,
  promoteEnrollment,
  bulkPromoteEnrollments,
  getPromotionHistory,
  getPromotionEligibleStudents,
  getPromotionSummary,
  getAllEnrollments,
  getSingleEnrollment,
  updateEnrollment,
  deleteEnrollment,
};
