import httpStatus from 'http-status';
import sendResponse from '../../../utils/sendResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { payslipServices } from './service';

const generatePayslips = catchAsync(async (req, res) => {
  const result = await payslipServices.generatePayslips(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Payslips generated successfully',
    data: result,
  });
});

const getAllPayslips = catchAsync(async (req, res) => {
  const result = await payslipServices.getAllPayslips(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payslips retrieved successfully',
    data: result,
  });
});

const getSinglePayslip = catchAsync(async (req, res) => {
  const result = await payslipServices.getSinglePayslip(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payslip retrieved successfully',
    data: result,
  });
});

const markPaid = catchAsync(async (req, res) => {
  const result = await payslipServices.markPaid(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payslip marked as paid',
    data: result,
  });
});

const deletePayslip = catchAsync(async (req, res) => {
  const result = await payslipServices.deletePayslip(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payslip deleted successfully',
    data: result,
  });
});

const getSummary = catchAsync(async (req, res) => {
  const result = await payslipServices.getSummary();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payslip summary retrieved successfully',
    data: result,
  });
});

export const payslipControllers = {
  generatePayslips,
  getAllPayslips,
  getSinglePayslip,
  markPaid,
  deletePayslip,
  getSummary,
};
