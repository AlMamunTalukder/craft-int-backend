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
Object.defineProperty(exports, "__esModule", { value: true });
class QueryBuilder {
    constructor(modelQuery, query) {
        this.modelQuery = modelQuery;
        this.query = query;
    }
    search(searchableFields) {
        var _a;
        const searchTerm = (_a = this.query) === null || _a === void 0 ? void 0 : _a.searchTerm;
        if (searchTerm) {
            this.modelQuery = this.modelQuery.find({
                $or: searchableFields.map((field) => ({
                    [field]: { $regex: searchTerm, $options: 'i' },
                })),
            });
        }
        return this;
    }
    filter() {
        const queryObj = Object.assign({}, this.query);
        const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields'];
        excludeFields.forEach((el) => delete queryObj[el]);
        const sanitize = (value) => {
            if (Array.isArray(value))
                return value.map(sanitize);
            if (value && typeof value === 'object') {
                const out = {};
                for (const [k, v] of Object.entries(value)) {
                    if (k.startsWith('$'))
                        continue;
                    out[k] = sanitize(v);
                }
                return out;
            }
            return value;
        };
        this.modelQuery = this.modelQuery.find(sanitize(queryObj));
        return this;
    }
    sort() {
        var _a;
        const sortParam = (_a = this.query) === null || _a === void 0 ? void 0 : _a.sort;
        if (sortParam) {
            const sortObj = {};
            // Handle multiple sort fields
            sortParam.split(',').forEach((field) => {
                if (field.startsWith('-')) {
                    sortObj[field.substring(1)] = -1; // Descending
                }
                else {
                    sortObj[field] = 1; // Ascending
                }
            });
            this.modelQuery = this.modelQuery.sort(sortObj);
        }
        else {
            // Default sort
            this.modelQuery = this.modelQuery.sort({ createdAt: -1 });
        }
        return this;
    }
    paginate() {
        var _a, _b;
        const page = Number((_a = this.query) === null || _a === void 0 ? void 0 : _a.page) || 1;
        const limit = Number((_b = this.query) === null || _b === void 0 ? void 0 : _b.limit) || 10;
        const skip = (page - 1) * limit;
        this.modelQuery = this.modelQuery.skip(skip).limit(limit);
        return this;
    }
    fields() {
        var _a, _b, _c;
        const fields = ((_c = (_b = (_a = this.query) === null || _a === void 0 ? void 0 : _a.fields) === null || _b === void 0 ? void 0 : _b.split(',')) === null || _c === void 0 ? void 0 : _c.join(' ')) || '-__v';
        this.modelQuery = this.modelQuery.select(fields);
        return this;
    }
    // ✅ Added `populate` method
    populate(field) {
        this.modelQuery = this.modelQuery.populate(field);
        return this;
    }
    countTotal() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const total = yield this.modelQuery.model.countDocuments(this.modelQuery.getFilter());
            const page = Number((_a = this.query) === null || _a === void 0 ? void 0 : _a.page) || 1;
            const limit = Number((_b = this.query) === null || _b === void 0 ? void 0 : _b.limit) || 10;
            const totalPage = Math.ceil(total / limit);
            return {
                page,
                limit,
                total,
                totalPage,
            };
        });
    }
}
exports.default = QueryBuilder;
