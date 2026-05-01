/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from 'http-status';
import { catchAsync } from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import { AuthServices } from './auth.service';
import config from '../../config';

// In your backend auth.controller.ts
// const loginUser = catchAsync(async (req, res) => {
//   const result = await AuthServices.loginUser(req.body);
//   const { accessToken, refreshToken } = result;

//   // Set cookies for the main domain - THIS IS THE KEY FIX
//   res.cookie('accessToken', accessToken, {
//     httpOnly: true,
//     secure: true,
//     sameSite: 'lax',
//     maxAge: 1000 * 60 * 15,
//     path: '/',
//     domain: '.craftinternationalinstitute.com',
//   });

//   res.cookie('refreshToken', refreshToken, {
//     httpOnly: true,
//     secure: true,
//     sameSite: 'lax',
//     maxAge: 1000 * 60 * 60 * 24 * 7,
//     path: '/',
//     domain: '.craftinternationalinstitute.com',
//   });

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Login successfully!',
//     data: result,
//   });
// });

const loginUser = catchAsync(async (req, res) => {
  const result = await AuthServices.loginUser(req.body);
  const { accessToken, refreshToken } = result;

  // httpOnly: true prevents JS from reading/clearing cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: '/',
    domain: 'localhost',
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: '/',
    domain: 'localhost',
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Login successfully!',
    data: result,
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const result = await AuthServices.refreshToken(req.cookies?.refreshToken);

  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 15,
    path: '/',
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Token refreshed successfully!',
    data: { accessToken: result.accessToken },
  });
});

const logoutUser = catchAsync(async (req, res) => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Logged out successfully!',
    data: null,
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

const getMe = catchAsync(async (req, res) => {
  if (!req.user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'User not authenticated',
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User info retrieved successfully!',
    data: {
      userId: req.user.userId,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      _id: req.user._id,
    },
  });
});
export const AuthController = {
  loginUser,
  changePassword,
  getMe,
  refreshToken,
  logoutUser,
};
