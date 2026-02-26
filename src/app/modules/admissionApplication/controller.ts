import httpStatus from 'http-status';
import sendResponse from '../../../utils/sendResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { admissionApplicationServices } from './service';

const createAdmissionApplication = catchAsync(async (req, res) => {
  const result = await admissionApplicationServices.createAdmissionApplication(
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Application submitted successfully',
    data: result,
  });
});

const getAllAdmissionApplications = catchAsync(async (req, res) => {
  const result = await admissionApplicationServices.getAllAdmissionApplications(
    req.query,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Applications retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleAdmissionApplication = catchAsync(async (req, res) => {
  const result =
    await admissionApplicationServices.getSingleAdmissionApplication(
      req.params.id,
    );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Application retrieved successfully',
    data: result,
  });
});

const updateAdmissionApplication = catchAsync(async (req, res) => {
  const result = await admissionApplicationServices.updateAdmissionApplication(
    req.params.id,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Application updated successfully',
    data: result,
  });
});

const deleteAdmissionApplication = catchAsync(async (req, res) => {
  const result = await admissionApplicationServices.deleteAdmissionApplication(
    req.params.id,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Application deleted successfully',
    data: result,
  });
});

export const admissionApplicationControllers = {
  createAdmissionApplication,
  getAllAdmissionApplications,
  getSingleAdmissionApplication,
  updateAdmissionApplication,
  deleteAdmissionApplication,
};
