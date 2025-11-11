import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';

import QueryBuilder from '../../builder/QueryBuilder';
import { Payment } from './model';
import { IPayment } from './interface';

const createPayment = async (payload: IPayment) => {
  const result = await Payment.create(payload);
  return result;
};

const getAllPayments = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(Payment.find(), query)
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const data = await queryBuilder.modelQuery;

  return { meta, data };
};

const getSinglePayment = async (id: string) => {
  const result = await Payment.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
  }
  return result;
};

const updatePayment = async (id: string, payload: Partial<IPayment>) => {
  const result = await Payment.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Failed to update payment');
  }
  return result;
};

const deletePayment = async (id: string) => {
  const result = await Payment.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment not found or already deleted');
  }
  return result;
};

export const paymentServices = {
  createPayment,
  getAllPayments,
  getSinglePayment,
  updatePayment,
  deletePayment,
};
