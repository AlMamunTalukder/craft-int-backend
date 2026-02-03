/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { FeeCategory } from './model';
import { IFeeCategory } from './interface';

const createFeeCategory = async (payload: IFeeCategory | IFeeCategory[]) => {
  if (Array.isArray(payload)) {
    const result = await FeeCategory.insertMany(payload);
    return result;
  } else {
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
