/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import { TUser } from './user.interface';
import { User } from './user.model';
import { createToken } from '../Auth/auth.utils';
import config from '../../config';
import bcrypt from 'bcrypt';

const createUser = async (payload: TUser) => {
  // Check if email already exists
  const existingEmail = await User.findOne({ email: payload.email });
  if (existingEmail) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Email is already registered!');
  }

  // Check if userId already exists
  const existingUserId = await User.findOne({ userId: payload.userId });
  if (existingUserId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User ID is already taken!');
  }

  // Generate a unique userId if not provided
  if (!payload.userId) {
    const lastUser = await User.findOne().sort({ createdAt: -1 });
    const lastId = lastUser?.userId || '0';
    const nextId = (parseInt(lastId) + 1).toString().padStart(6, '0');
    payload.userId = nextId;
  }

  // Ensure password exists
  if (!payload.password) {
    payload.password = (config.default_pass as string) || 'default123';
  }

  // Create the user
  const result = await User.create(payload);

  // Create JWT payload
  const JwtPayload = {
    userId: result.userId,
    role: result.role,
    email: result.email,
    name: result.name,
  };

  // Generate tokens
  const accessToken = createToken(
    JwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  const refreshToken = createToken(
    JwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string,
  );

  return {
    accessToken,
    refreshToken,
    user: {
      userId: result.userId,
      email: result.email,
      name: result.name,
      role: result.role,
    },
  };
};

const getAllUser = async () => {
  const result = await User.find();
  return result;
};
const getSingleUser = async (id: string) => {
  const result = await User.findById(id);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  return result;
};
const deleteUser = async (id: string) => {
  const result = await User.deleteOne({ _id: id });

  return result;
};
const updateUser = async (id: string, payload: Partial<TUser>) => {
  if (payload.password) {
    // Manually hash the new password
    payload.password = await bcrypt.hash(
      payload.password,
      Number(config.bcrypt_salt_round),
    );
  }

  const result = await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Failed to update user');
  }

  return result;
};
export const UserServices = {
  createUser,
  getAllUser,
  deleteUser,
  updateUser,
  getSingleUser,
};
