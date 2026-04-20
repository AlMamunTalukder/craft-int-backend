/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */

import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { catchAsync } from '../../utils/catchAsync';
import { AppError } from '../error/AppError';
import config from '../config';
import { TUserRole } from '../modules/user/user.interface';
import { User } from '../modules/user/user.model';
import mongoose from 'mongoose';

export const auth = (...requiredRoles: TUserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken;
    const authHeaderToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;

    const finalToken = token || authHeaderToken;

    if (!finalToken) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        'You are not authorized! Please login to get access',
      );
    }

    try {
      const decoded = jwt.verify(
        finalToken,
        config.jwt_access_secret as string,
      ) as JwtPayload;

      console.log('Decoded token:', decoded);

      const { role, userId, iat, email } = decoded;

      let user = await User.findOne({
        $or: [{ userId: userId }, { email: email }],
      });

      if (!user && mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId);
      }

      console.log(
        'User found:',
        user
          ? { email: user.email, role: user.role, userId: user.userId }
          : 'Not found',
      );

      if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'This user is not found');
      }

      const isDeleted = user?.isDeleted;
      if (isDeleted) {
        throw new AppError(httpStatus.NOT_FOUND, 'This user is deleted!');
      }

      const userStatus = user?.status;
      if (userStatus === 'inactive') {
        throw new AppError(httpStatus.NOT_FOUND, 'This user is blocked!');
      }

      if (
        user.passwordChangeAt &&
        User.isJWTIssuedBeforePasswordChanged(
          user.passwordChangeAt,
          iat as number,
        )
      ) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
      }

      if (requiredRoles.length > 0 && !requiredRoles.includes(role)) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          'You are not authorized user!',
        );
      }
      req.user = {
        userId: user.userId,
        _id: user._id,
        role: user.role,
        email: user.email,
        name: user.name,
      };

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid token!');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Token expired!');
      }
      throw error;
    }
  });
};
