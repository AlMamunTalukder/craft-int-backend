/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import { Fees } from './model';
import { IFees } from './interface';
import QueryBuilder from '../../builder/QueryBuilder';

const createFees = async (payload: IFees) => {
  const result = await Fees.create(payload);
  return result;
};

const getAllFees = async (query: Record<string, any>) => {
  const queryBuilder = new QueryBuilder(
    Fees.find().populate('enrollment student'),
    query,
  )
    .search(['feeType'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const data = await queryBuilder.modelQuery;

  return { meta, data };
};

const getSingleFees = async (id: string) => {
  const result = await Fees.findById(id);
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Fee record not found');
  return result;
};

const updateFees = async (id: string, payload: Partial<IFees>) => {
  const result = await Fees.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!result)
    throw new AppError(httpStatus.NOT_FOUND, 'Failed to update fee record');
  return result;
};

const deleteFees = async (id: string) => {
  const result = await Fees.findByIdAndDelete(id);
  if (!result)
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Fee record not found or already deleted',
    );
  return result;
};

export const feesServices = {
  createFees,
  getAllFees,
  getSingleFees,
  updateFees,
  deleteFees,
};
