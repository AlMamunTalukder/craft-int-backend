import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { Asset } from './model';
import { IAsset } from './interface';

const createAsset = async (payload: IAsset) => {
  const totalPrice = (payload.quantity || 0) * (payload.unitPrice || 0);
  const result = await Asset.create({ ...payload, totalPrice });
  return result;
};

const getAllAssets = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(Asset.find(), query)
    .search(['name', 'vendor', 'location'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const data = await queryBuilder.modelQuery;
  return { meta, data };
};

const getSingleAsset = async (id: string) => {
  const result = await Asset.findById(id);
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Asset not found');
  return result;
};

const updateAsset = async (id: string, payload: Partial<IAsset>) => {
  if (payload.quantity !== undefined || payload.unitPrice !== undefined) {
    const current = await Asset.findById(id);
    if (current) {
      payload.totalPrice =
        (payload.quantity ?? current.quantity) *
        (payload.unitPrice ?? current.unitPrice);
    }
  }
  const result = await Asset.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Failed to update asset');
  return result;
};

const deleteAsset = async (id: string) => {
  const result = await Asset.findByIdAndDelete(id);
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Asset not found');
  return result;
};

const getSummary = async () => {
  const [byCategory, totals] = await Promise.all([
    Asset.aggregate([
      {
        $group: {
          _id: '$category',
          totalPrice: { $sum: '$totalPrice' },
          quantity: { $sum: '$quantity' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalPrice: -1 } },
    ]),
    Asset.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$totalPrice' },
          totalQuantity: { $sum: '$quantity' },
          itemCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  const disposed = await Asset.countDocuments({ condition: 'disposed' });

  return {
    totals: totals[0] || {
      totalValue: 0,
      totalQuantity: 0,
      itemCount: 0,
    },
    byCategory,
    disposed,
  };
};

export const assetServices = {
  createAsset,
  getAllAssets,
  getSingleAsset,
  updateAsset,
  deleteAsset,
  getSummary,
};
