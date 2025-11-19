/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import { Student } from './student.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { IStudent } from './student.interface';
import { studentSearchableFields } from './student.constant';
import { generateStudentId } from './student.utils';
import mongoose from 'mongoose';
import { User } from '../user/user.model';

const createStudent = async (payload: Partial<IStudent>): Promise<IStudent> => {
  const { name, studentDepartment, email } = payload;

  // Validate required fields
  if (!name) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Student name is required');
  }

  if (!studentDepartment) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Student department is required');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Generate unique student ID
    const studentId = await generateStudentId();

    // Check if the generated ID already exists
    const exists = await Student.exists({ studentId });
    if (exists) {
      throw new AppError(
        httpStatus.CONFLICT,
        'Generated Student ID already exists. Try again.',
      );
    }

    // Handle sameAsPermanent logic for addresses
    if (payload.sameAsPermanent && payload.permanentAddress) {
      payload.presentAddress = { ...payload.permanentAddress };
    }

    // Ensure arrays are properly formatted
    const processedPayload = {
      ...payload,
      studentId,
      className: Array.isArray(payload.className)
        ? payload.className
        : payload.className ? [payload.className] : [],
      section: Array.isArray(payload.section)
        ? payload.section
        : payload.section ? [payload.section] : [],
      activeSession: Array.isArray(payload.activeSession)
        ? payload.activeSession
        : payload.activeSession ? [payload.activeSession] : [],
    };

    // Create student with the processed payload
    const student = await Student.create([processedPayload], {
      session,
    });

    // Create user account for the student
    const userPayload = {
      email: email || `${studentId.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.com`,
      password: 'student123', // Default password, should be changed on first login
      name: name,
      role: 'student',
      studentId: studentId,
    };

    await User.create([userPayload], { session });

    // Commit the transaction
    await session.commitTransaction();

    // Populate the student document before returning
    const populatedStudent = await Student.findById(student[0]._id)
      .populate('className')
      .populate('section')
      .populate('fees');

    return populatedStudent as IStudent;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getAllStudents = async (query: Record<string, unknown>) => {
  const studentQuery = new QueryBuilder(
    Student.find()
      .populate({
        path: 'fees',
        model: 'Fees',
      })
      .populate({
        path: 'className',
      })
      .populate({
        path: 'section',
      }),
    query
  )
    .search(studentSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await studentQuery.countTotal();
  const data = await studentQuery.modelQuery;

  return {
    meta,
    data,
  };
};

export const getSingleStudent = async (id: string): Promise<IStudent> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid student ID');
  }

  const student = await Student.findById(id)
    .populate({
      path: 'fees',
    })
    .populate({
      path: 'className',
    })
    .populate({
      path: 'section',
    });

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, 'Student not found');
  }

  return student;
};

const updateStudent = async (
  id: string,
  payload: Partial<IStudent>,
): Promise<IStudent> => {
  // Validate ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid student ID');
  }

  // Check if student exists
  const existingStudent = await Student.findById(id);
  if (!existingStudent) {
    throw new AppError(httpStatus.NOT_FOUND, 'Student not found');
  }

  // Handle sameAsPermanent logic for addresses
  if (payload.sameAsPermanent && payload.permanentAddress) {
    payload.presentAddress = { ...payload.permanentAddress };
  }

  // Process arrays
  const processedPayload: any = { ...payload };

  if (payload.className) {
    processedPayload.className = Array.isArray(payload.className)
      ? payload.className
      : [payload.className];
  }

  if (payload.section) {
    processedPayload.section = Array.isArray(payload.section)
      ? payload.section
      : [payload.section];
  }

  if (payload.activeSession) {
    processedPayload.activeSession = Array.isArray(payload.activeSession)
      ? payload.activeSession
      : [payload.activeSession];
  }

  // Update student with new data
  const student = await Student.findByIdAndUpdate(
    id,
    processedPayload,
    {
      new: true,
      runValidators: true,
    }
  )
    .populate('className')
    .populate('section')
    .populate('fees');

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, 'Failed to update student');
  }

  // If email was updated, also update the user account
  if (payload.email) {
    await User.findOneAndUpdate(
      { studentId: student.studentId },
      { email: payload.email },
      { new: true, runValidators: true }
    );
  }

  return student;
};

const deleteStudent = async (id: string): Promise<IStudent> => {
  // Validate ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid student ID');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const student = await Student.findById(id);
    if (!student) {
      throw new AppError(httpStatus.NOT_FOUND, 'Student not found');
    }

    // Delete the student
    const deletedStudent = await Student.findByIdAndDelete(id, { session });

    // Delete the associated user account
    await User.findOneAndDelete({ studentId: student.studentId }, { session });

    await session.commitTransaction();
    return deletedStudent as IStudent;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const studentServices = {
  createStudent,
  getAllStudents,
  getSingleStudent,
  updateStudent,
  deleteStudent,
};