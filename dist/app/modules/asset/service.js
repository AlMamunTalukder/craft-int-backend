"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const model_1 = require("./model");
const createAsset = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const totalPrice = (payload.quantity || 0) * (payload.unitPrice || 0);
    const result = yield model_1.Asset.create(Object.assign(Object.assign({}, payload), { totalPrice }));
    return result;
});
const getAllAssets = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.default(model_1.Asset.find(), query)
        .search(['name', 'vendor', 'location'])
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield queryBuilder.countTotal();
    const data = yield queryBuilder.modelQuery;
    return { meta, data };
});
const getSingleAsset = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Asset.findById(id);
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Asset not found');
    return result;
});
const updateAsset = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (payload.quantity !== undefined || payload.unitPrice !== undefined) {
        const current = yield model_1.Asset.findById(id);
        if (current) {
            payload.totalPrice =
                ((_a = payload.quantity) !== null && _a !== void 0 ? _a : current.quantity) *
                    ((_b = payload.unitPrice) !== null && _b !== void 0 ? _b : current.unitPrice);
        }
    }
    const result = yield model_1.Asset.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update asset');
    return result;
});
const deleteAsset = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Asset.findByIdAndDelete(id);
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Asset not found');
    return result;
});
const getSummary = () => __awaiter(void 0, void 0, void 0, function* () {
    const [byCategory, totals] = yield Promise.all([
        model_1.Asset.aggregate([
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
        model_1.Asset.aggregate([
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
    const disposed = yield model_1.Asset.countDocuments({ condition: 'disposed' });
    return {
        totals: totals[0] || {
            totalValue: 0,
            totalQuantity: 0,
            itemCount: 0,
        },
        byCategory,
        disposed,
    };
});
exports.assetServices = {
    createAsset,
    getAllAssets,
    getSingleAsset,
    updateAsset,
    deleteAsset,
    getSummary,
};
