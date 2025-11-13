import httpStatus from "http-status";
import { AppError } from "../../error/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { FeeAdjustment } from "./model";
import { IFeeAdjustment } from "./interface";

/**
 * Create new Fee Adjustment
 */
const createFeeAdjustment = async (payload: IFeeAdjustment) => {
  const result = await FeeAdjustment.create(payload);
  return result;
};

/**
 * Get all Fee Adjustments
 */
const getAllFeeAdjustments = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(FeeAdjustment.find().populate("student").populate("fee"), query)
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const data = await queryBuilder.modelQuery;

  return { meta, data };
};

/**
 * Get single Fee Adjustment
 */
const getSingleFeeAdjustment = async (id: string) => {
  const result = await FeeAdjustment.findById(id).populate("student").populate("fee");
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "FeeAdjustment not found");
  }
  return result;
};

/**
 * Update Fee Adjustment
 */
const updateFeeAdjustment = async (id: string, payload: Partial<IFeeAdjustment>) => {
  const existing = await FeeAdjustment.findById(id);
  if (!existing) throw new AppError(httpStatus.NOT_FOUND, "FeeAdjustment not found");

  // merge existing with payload
  Object.assign(existing, payload);

  const updated = await existing.save();
  return updated;
};

/**
 * Delete Fee Adjustment
 */
const deleteFeeAdjustment = async (id: string) => {
  const result = await FeeAdjustment.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "FeeAdjustment not found or already deleted");
  }
  return result;
};

export const feeAdjustmentServices = {
  createFeeAdjustment,
  getAllFeeAdjustments,
  getSingleFeeAdjustment,
  updateFeeAdjustment,
  deleteFeeAdjustment,
};
