import httpStatus from 'http-status';
import sendResponse from '../../../utils/sendResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { certificateServices } from './service';

const createCertificate = catchAsync(async (req, res) => {
  const result = await certificateServices.createCertificate(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Certificate issued successfully',
    data: result,
  });
});

const getAllCertificates = catchAsync(async (req, res) => {
  const result = await certificateServices.getAllCertificates(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Certificates retrieved successfully',
    data: result,
  });
});

const getSingleCertificate = catchAsync(async (req, res) => {
  const result = await certificateServices.getSingleCertificate(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Certificate retrieved successfully',
    data: result,
  });
});

const updateCertificate = catchAsync(async (req, res) => {
  const result = await certificateServices.updateCertificate(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Certificate updated successfully',
    data: result,
  });
});

const deleteCertificate = catchAsync(async (req, res) => {
  const result = await certificateServices.deleteCertificate(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Certificate deleted successfully',
    data: result,
  });
});

const getIdCards = catchAsync(async (req, res) => {
  const result = await certificateServices.getIdCards(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'ID card data retrieved successfully',
    data: result,
  });
});

export const certificateControllers = {
  createCertificate,
  getAllCertificates,
  getSingleCertificate,
  updateCertificate,
  deleteCertificate,
  getIdCards,
};
