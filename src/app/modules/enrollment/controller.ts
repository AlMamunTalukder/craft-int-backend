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
  const { studentId, newClassId, session, rollNumber } = req.body;

  const result = await enrollmentServices.promoteEnrollment(
    studentId,
    newClassId,
    session,
    rollNumber,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});

const bulkPromoteEnrollments = catchAsync(async (req, res) => {
  const { promotions } = req.body;

  if (!promotions || !Array.isArray(promotions) || promotions.length === 0) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Promotions array and session are required',
      data: null,
    });
  }

  const result = await enrollmentServices.bulkPromoteEnrollments(promotions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});

const getPromotionHistory = catchAsync(async (req, res) => {
  const { studentId } = req.params;

  const result = await enrollmentServices.getPromotionHistory(studentId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Promotion history retrieved',
    data: result.data,
  });
});

const getPromotionEligibleStudents = catchAsync(async (req, res) => {
  const { classId } = req.query;
  console.log('this is class id ', classId);

  if (!classId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Class ID is required to find eligible students',
      data: null,
    });
  }

  const result = await enrollmentServices.getPromotionEligibleStudents(
    classId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Eligible students retrieved',
    data: result.data,
  });
});

const bulkRetainStudents = catchAsync(async (req, res) => {
  const { promotions } = req.body;

  if (!promotions || !Array.isArray(promotions) || promotions.length === 0) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Promotions array is required',
      data: null,
    });
  }

  const result = await enrollmentServices.bulkRetainEnrollments(promotions);

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
  getAllEnrollments,
  getSingleEnrollment,
  updateEnrollment,
  deleteEnrollment,
  getPromotionHistory,
  getPromotionEligibleStudents,
  bulkRetainStudents,
};
