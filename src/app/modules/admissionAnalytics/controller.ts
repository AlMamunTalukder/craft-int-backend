import httpStatus from 'http-status';
import sendResponse from '../../../utils/sendResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { admissionAnalyticsServices } from './service';

const getAdmissionStats = catchAsync(async (req, res) => {
  const result = await admissionAnalyticsServices.getAdmissionStats(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admission analytics retrieved successfully',
    data: result,
  });
});

export const admissionAnalyticsControllers = { getAdmissionStats };
