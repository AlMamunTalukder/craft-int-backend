import httpStatus from 'http-status';
import { studentServices } from './student.service';
import sendResponse from '../../../utils/sendResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { Request, Response } from 'express';
import { Student } from './student.model';
import { AppError } from '../../error/AppError';
import { User } from '../user/user.model';

const createStudent = catchAsync(async (req: Request, res: Response) => {
  const student = await studentServices.createStudent(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Student created successfully',
    data: student,
  });
});

const getAllStudents = catchAsync(async (req: Request, res: Response) => {
  const result = await studentServices.getAllStudents(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Students retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

//client side user data show 
const getStudentByUserId = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  // First find the user
  const user = await User.findOne({ userId: userId });
  
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  
  // Then find the student linked to this user
  const student = await Student.findOne({ 
    user: user._id 
  })
  .populate('className')
  .populate('fees')
  .populate('payments')
  .populate('receipts');
  
  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, 'Student not found for this user');
  }
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Student retrieved successfully',
    data: student,
  });
});
const getSingleStudent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const student = await studentServices.getSingleStudent(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Student retrieved successfully',
    data: student,
  });
});

const updateStudent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(id);
  const updatedStudent = await studentServices.updateStudent(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Student updated successfully',
    data: updatedStudent,
  });
});

const deleteStudent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const deletedStudent = await studentServices.deleteStudent(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Student deleted successfully',
    data: deletedStudent,
  });
});

export const studentControllers = {
  createStudent,
  getAllStudents,
  getSingleStudent,
  updateStudent,
  deleteStudent,
  getStudentByUserId
};
