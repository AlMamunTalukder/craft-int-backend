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
import { Class } from '../class/class.model';

const createStudent = async (payload: Partial<IStudent>): Promise<IStudent> => {
  const { name, studentDepartment, email } = payload;

  // Validate required fields
  if (!name) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Student name is required');
  }

  if (!studentDepartment) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Student department is required',
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
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
        : payload.className
          ? [payload.className]
          : [],
      section: Array.isArray(payload.section)
        ? payload.section
        : payload.section
          ? [payload.section]
          : [],
      activeSession: Array.isArray(payload.activeSession)
        ? payload.activeSession
        : payload.activeSession
          ? [payload.activeSession]
          : [],
    };

    const student = await Student.create([processedPayload], {
      session,
    });
    const userPayload = {
      email:
        email ||
        `${studentId.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.com`,
      password: 'student123',
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
  const { className, ...otherQuery } = query;

  const processedQuery = { ...otherQuery };

  // Handle className filter
  if (className) {
    const classValue = className as string;

    // Check if it's a valid ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(classValue)) {
      // It's an ObjectId, keep it as is for QueryBuilder
      processedQuery.className = classValue;
    } else {
      // It's a class name string, we need to find the Class document first
      try {
        // Find the Class document by name
        const classDoc = await Class.findOne({
          className: { $regex: new RegExp(`^${classValue}$`, 'i') },
        });

        if (classDoc) {
          // Use the ObjectId in the query
          processedQuery.className = classDoc._id.toString();
        } else {
          // If class not found, return empty results
          return {
            meta: {
              page: Number(query.page) || 1,
              limit: Number(query.limit) || 10000,
              total: 0,
              totalPage: 0,
            },
            data: [],
          };
        }
      } catch (error) {
        console.error('Error finding class:', error);
        // Return empty results on error
        return {
          meta: {
            page: Number(query.page) || 1,
            limit: Number(query.limit) || 10000,
            total: 0,
            totalPage: 0,
          },
          data: [],
        };
      }
    }
  }

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
      })
      .populate({
        path: 'payments',
        model: 'Payment',
      })
      .populate({
        path: 'mealAttendances',
        model: 'MealAttendance',
      }),
    processedQuery,
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
export const getSingleStudent = async (id: string): Promise<any> => {
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
    })
    .populate({
      path: 'payments',
      model: 'Payment',
    })
    .populate({
      path: 'receipts',
      model: 'Receipt',
    })
    .populate({
      path: 'mealAttendances',
      model: 'MealAttendance',
      options: { sort: { date: -1 } }
    });

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, 'Student not found');
  }

  const mealAttendances = student.mealAttendances || [];
  const totalMeals = mealAttendances.reduce((sum: number, att: any) => sum + (att.totalMeals || 0), 0);
  const totalCost = mealAttendances.reduce((sum: number, att: any) => sum + (att.mealCost || 0), 0);
  const totalBreakfast = mealAttendances.filter((att: any) => att.breakfast).length;
  const totalLunch = mealAttendances.filter((att: any) => att.lunch).length;
  const totalDinner = mealAttendances.filter((att: any) => att.dinner).length;
  const totalPresentDays = mealAttendances.filter((att: any) => att.totalMeals > 0).length
  const studentObject = student.toObject();

  return {
    ...studentObject,
    mealStatistics: {
      totalMeals,
      totalCost,
      totalBreakfast,
      totalLunch,
      totalDinner,
      totalPresentDays,
      totalAbsentDays: mealAttendances.length - totalPresentDays,
      attendanceRate: mealAttendances.length > 0
        ? ((totalPresentDays / mealAttendances.length) * 100).toFixed(2)
        : '0',
    },
  };
};

const updateStudent = async (
  id: string,
  payload: Partial<IStudent>,
): Promise<IStudent> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid student ID');
  }

  const existingStudent = await Student.findById(id);
  if (!existingStudent) {
    throw new AppError(httpStatus.NOT_FOUND, 'Student not found');
  }

  if (payload.sameAsPermanent && payload.permanentAddress) {
    payload.presentAddress = { ...payload.permanentAddress };
  }

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


  const student = await Student.findByIdAndUpdate(id, processedPayload, {
    new: true,
    runValidators: true,
  })
    .populate('className')
    .populate('section')
    .populate('fees');

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, 'Failed to update student');
  }

  if (payload.email) {
    await User.findOneAndUpdate(
      { studentId: student.studentId },
      { email: payload.email },
      { new: true, runValidators: true },
    );
  }

  return student;
};

const deleteStudent = async (id: string): Promise<IStudent> => {
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
    const deletedStudent = await Student.findByIdAndDelete(id, { session });
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
