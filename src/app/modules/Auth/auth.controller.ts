/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from 'http-status';
import { catchAsync } from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import { AuthServices } from './auth.service';
import config from '../../config';

// In your backend auth.controller.ts
const loginUser = catchAsync(async (req, res) => {
  const result = await AuthServices.loginUser(req.body);
  const { accessToken, refreshToken } = result;

  // Set cookies for the main domain - THIS IS THE KEY FIX
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true, // Your site uses HTTPS
    sameSite: 'lax', // Change from 'none' to 'lax' for same-site requests
    maxAge: 1000 * 60 * 15, // 15 minutes
    path: '/',
    domain: '.craftinternationalinstitute.com', // Note the dot at the beginning
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax', // Change from 'none' to 'lax'
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    path: '/',
    domain: '.craftinternationalinstitute.com', // Same domain
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Login successfully!',
    data: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const user = req.user;
  const { ...passwordData } = req.body;
  const result = await AuthServices.changePassword(user, passwordData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password change successfully!',
    data: result,
  });
});

// ✅ NEW: Get current user info
const getMe = catchAsync(async (req, res) => {
  const user = req.user; // This comes from auth middleware

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User info retrieved successfully!',
    data: user,
  });
});

export const AuthController = {
  loginUser,
  changePassword,
  getMe, // Export the new method
};
