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
exports.staffServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const staff_model_1 = require("./staff.model");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const staff_utils_1 = require("./staff.utils");
const staff_constant_1 = require("./staff.constant");
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("../user/user.model");
const createStaff = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, name } = payload;
    console.log(payload);
    if (!email || !name) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Required fields are missing');
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const staffId = yield (0, staff_utils_1.generateStaffId)();
        const existingStaff = yield staff_model_1.Staff.findOne({ staffId });
        if (existingStaff) {
            throw new AppError_1.AppError(http_status_1.default.CONFLICT, 'Generated Staff ID already exists. Try again.');
        }
        const staff = yield staff_model_1.Staff.create([Object.assign(Object.assign({}, payload), { staffId })], {
            session,
        });
        yield user_model_1.User.create([
            {
                email,
                password: 'staff123',
                name,
                role: 'staff',
            },
        ], { session });
        yield session.commitTransaction();
        return staff[0];
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
// Helper function for staff populations (reusable)
const getAllStaffs = (query) => __awaiter(void 0, void 0, void 0, function* () {
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
            mealAttendances: query.mealFields
        }
    };
    // Get population configurations
    const populations = (0, staff_utils_1.getStaffPopulations)(populateOptions);
    const staffQuery = new QueryBuilder_1.default(staff_model_1.Staff.find(), query)
        .search(staff_constant_1.staffSearchableFields)
        .filter()
        .sort()
        .paginate()
        .fields();
    // Apply all populations
    populations.forEach(populateConfig => {
        staffQuery.modelQuery = staffQuery.modelQuery.populate(populateConfig);
    });
    const meta = yield staffQuery.countTotal();
    const data = yield staffQuery.modelQuery;
    return {
        meta,
        data,
    };
});
const getSingleStaff = (id, options) => __awaiter(void 0, void 0, void 0, function* () {
    let query = staff_model_1.Staff.findById(id);
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
    const staff = yield query;
    if (!staff) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Staff not found');
    }
    return staff;
});
const updateStaff = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(payload);
    const updatedStaff = yield staff_model_1.Staff.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!updatedStaff) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update staff');
    }
    return updatedStaff;
});
const deleteStaff = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const staff = yield staff_model_1.Staff.findByIdAndDelete(id);
    if (!staff) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Staff not found or already deleted');
    }
    return staff;
});
exports.staffServices = {
    createStaff,
    getAllStaffs,
    getSingleStaff,
    updateStaff,
    deleteStaff,
};
