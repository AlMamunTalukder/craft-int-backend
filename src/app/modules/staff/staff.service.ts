import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import { Staff } from './staff.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { IStaff } from './staff.interface';
import { generateStaffId, getStaffPopulations } from './staff.utils';
import { staffSearchableFields } from './staff.constant';
import mongoose from 'mongoose';
import { User } from '../user/user.model';

const createStaff = async (payload: Partial<IStaff>): Promise<IStaff> => {
  const { email, name } = payload;
  console.log(payload);
  if (!email || !name) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Required fields are missing');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const staffId = await generateStaffId();

    const existingStaff = await Staff.findOne({ staffId });
    if (existingStaff) {
      throw new AppError(
        httpStatus.CONFLICT,
        'Generated Staff ID already exists. Try again.',
      );
    }

    const staff = await Staff.create([{ ...payload, staffId }], {
      session,
    });

    await User.create(
      [
        {
          email,
          password: 'staff123',
          name,
          role: 'staff',
        },
      ],
      { session },
    );

    await session.commitTransaction();
    return staff[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
// Helper function for staff populations (reusable)


const getAllStaffs = async (query: Record<string, unknown>) => {
  // If no sort parameter is provided, default to -updatedAt
  if (!query.sort) {
    query.sort = '-updatedAt';
  }

  // Parse populate parameters from query
  // Usage: ?populate=meals or ?populateAll=true
  const populateOptions = {
    withMeals: query.populate === 'meals' || query.withMeals === 'true',
    withAll: query.populateAll === 'true',
    limit: query.populateLimit ? Number(query.populateLimit) : 30,
    selectFields: {
      mealAttendances: query.mealFields as string
    }
  };

  // Get population configurations
  const populations = getStaffPopulations(populateOptions);

  const staffQuery = new QueryBuilder(Staff.find(), query)
    .search(staffSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  // Apply all populations
  populations.forEach(populateConfig => {
    staffQuery.modelQuery = staffQuery.modelQuery.populate(populateConfig);
  });

  const meta = await staffQuery.countTotal();
  const data = await staffQuery.modelQuery;

  return {
    meta,
    data,
  };
};

const getSingleStaff = async (id: string, options?: {
  populateMeals?: boolean;
  mealLimit?: number;
}): Promise<IStaff> => {
  let query = Staff.findById(id);

  const { populateMeals = true, mealLimit = 30 } = options || {};

  // Populate meal attendances if requested
  if (populateMeals) {
    query = query.populate({
      path: 'mealAttendances',
      select: 'date mealType status breakfast lunch dinner totalMeals mealCost month academicYear isAbsent isHoliday',
      options: {
        sort: { date: -1 },
        limit: mealLimit
      }
    });
  }

  const staff = await query;

  if (!staff) {
    throw new AppError(httpStatus.NOT_FOUND, 'Staff not found');
  }

  return staff;
};

const updateStaff = async (
  id: string,
  payload: Partial<IStaff>,
): Promise<IStaff> => {
  console.log(payload);
  const updatedStaff = await Staff.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!updatedStaff) {
    throw new AppError(httpStatus.NOT_FOUND, 'Failed to update staff');
  }

  return updatedStaff;
};

const deleteStaff = async (id: string): Promise<IStaff> => {
  const staff = await Staff.findByIdAndDelete(id);

  if (!staff) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Staff not found or already deleted',
    );
  }

  return staff;
};

export const staffServices = {
  createStaff,
  getAllStaffs,
  getSingleStaff,
  updateStaff,
  deleteStaff,
};