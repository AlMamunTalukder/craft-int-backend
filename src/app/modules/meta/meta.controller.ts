import sendResponse from '../../../utils/sendResponse';
import httpStatus from 'http-status';

import { catchAsync } from '../../../utils/catchAsync';
import { metaServices } from './metService';

const getAllMeta = catchAsync(async (req, res, next) => {
  try {
    const result = await metaServices.getAllMetaFromDB();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'All meta data fetched successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

const getAccountingReport = catchAsync(async (req, res) => {
  const result = await metaServices.getAccountingReport();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Accounting report fetched successfully.',
    data: result,
  });
});

const getClassWiseStudentCount = catchAsync(async (req, res) => {
  const result = await metaServices.getClassWiseStudentCountOnly();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class wise student count fetched successfully.',
    data: result,
  });
});

export const metaController = {
  getAllMeta,
  getAccountingReport,
  getClassWiseStudentCount,
};
