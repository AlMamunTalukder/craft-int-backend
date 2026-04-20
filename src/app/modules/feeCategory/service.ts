/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { FeeCategory } from './model';
import { IFeeCategory } from './interface';

const createFeeCategory = async (payload: IFeeCategory | IFeeCategory[]) => {
  if (Array.isArray(payload)) {
    // ✅ Check for duplicates within the incoming array itself
    const seen = new Set<string>();
    for (const item of payload) {
      const key = `${item.className}-${item.categoryName || ''}`;
      if (seen.has(key)) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Duplicate entry in request: className "${item.className}" with category "${item.categoryName}" appears more than once`,
        );
      }
      seen.add(key);
    }

    // ✅ Check against existing DB records
    const existingDocs = await FeeCategory.find({
      $or: payload.map((item) => ({
        className: item.className,
        categoryName: item.categoryName || '',
      })),
    });

    if (existingDocs.length > 0) {
      const conflictList = existingDocs
        .map((doc) => `"${doc.className} - ${doc.categoryName}"`)
        .join(', ');
      throw new AppError(
        httpStatus.CONFLICT,
        `Fee category already exists for: ${conflictList}`,
      );
    }

    const result = await FeeCategory.insertMany(payload);
    return result;
  } else {
    // ✅ Check single entry against DB
    const existing = await FeeCategory.findOne({
      className: payload.className,
      categoryName: payload.categoryName || '',
    });

    if (existing) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Fee category already exists for class "${payload.className}" with category "${payload.categoryName}"`,
      );
    }

    const result = await FeeCategory.create(payload);
    return result;
  }
};

const getAllFeeCategories = async (query: Record<string, any>) => {
  const queryBuilder = new QueryBuilder(FeeCategory.find(), query)
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const data = await queryBuilder.modelQuery;

  return { meta, data };
};

const getSingleFeeCategory = async (id: string) => {
  const result = await FeeCategory.findById(id);
  if (!result)
    throw new AppError(httpStatus.NOT_FOUND, 'Fee category not found');
  return result;
};

const updateFeeCategory = async (
  id: string,
  payload: Partial<IFeeCategory>,
) => {
  const result = await FeeCategory.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!result)
    throw new AppError(httpStatus.NOT_FOUND, 'Failed to update fee category');
  return result;
};

const deleteFeeCategory = async (id: string) => {
  const result = await FeeCategory.findByIdAndDelete(id);
  if (!result)
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Fee category not found or already deleted',
    );
  return result;
};

export const feeCategoryServices = {
  createFeeCategory,
  getAllFeeCategories,
  getSingleFeeCategory,
  updateFeeCategory,
  deleteFeeCategory,
};
