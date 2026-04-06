import httpStatus from 'http-status';
import { teacherServices } from './teacher.service';
import sendResponse from '../../../utils/sendResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { Request, Response } from 'express';
import { syncTeachersWithUsers } from '../../../scripts/syncTeachersWithUsers';

// Create new teacher
const createTeacher = catchAsync(async (req: Request, res: Response) => {
  const teacher = await teacherServices.createTeacher(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Teacher created successfully',
    data: teacher,
  });
});

// Get all teachers
const getAllTeachers = catchAsync(async (req: Request, res: Response) => {
  const result = await teacherServices.getAllTeachers(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Teachers retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

// Get single teacher
const getSingleTeacher = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const teacher = await teacherServices.getSingleTeacher(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Teacher retrieved successfully',
    data: teacher,
  });
});

// Update teacher
const updateTeacher = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(id, req.body);
  const updatedTeacher = await teacherServices.updateTeacher(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Teacher updated successfully',
    data: updatedTeacher,
  });
});

// Delete teacher
const deleteTeacher = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const deletedTeacher = await teacherServices.deleteTeacher(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Teacher deleted successfully',
    data: deletedTeacher,
  });
});
const syncTeacherUsers = catchAsync(async (req: Request, res: Response) => {
  // ব্যাকগ্রাউন্ডে সিন্ক রান করুন
  syncTeachersWithUsers()
    .then(() => {
      console.log('Teacher sync completed');
    })
    .catch((error) => {
      console.error('Teacher sync failed:', error);
    });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Teacher sync started in background. Check console for details.',
    data: null,
  });
});
export const teacherControllers = {
  createTeacher,
  getAllTeachers,
  getSingleTeacher,
  updateTeacher,
  deleteTeacher,
  syncTeacherUsers,
};
