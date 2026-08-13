"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.leaveServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const model_1 = require("./model");
const calcDays = (start, end) => {
    const diff = Math.abs(new Date(end).getTime() - new Date(start).getTime());
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};
const createLeave = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const days = calcDays(payload.startDate, payload.endDate);
    const result = yield model_1.Leave.create(Object.assign(Object.assign({}, payload), { days }));
    return result;
});
const getAllLeaves = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = {};
    if (query.employeeType)
        filter.employeeType = query.employeeType;
    if (query.status)
        filter.status = query.status;
    const queryBuilder = new QueryBuilder_1.default(model_1.Leave.find(filter), query)
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield queryBuilder.countTotal();
    const data = yield queryBuilder.modelQuery;
    const populated = [];
    for (const leave of data) {
        const doc = leave.toObject();
        if (leave.employeeType === 'teacher') {
            doc.employeeInfo = yield Promise.resolve().then(() => __importStar(require('../teacher/teacher.model'))).then((m) => m.Teacher.findById(leave.employee).select('name teacherId phone'));
        }
        else {
            doc.employeeInfo = yield Promise.resolve().then(() => __importStar(require('../staff/staff.model'))).then((m) => m.Staff.findById(leave.employee).select('name staffId phone'));
        }
        populated.push(doc);
    }
    return { meta, data: populated };
});
const getSingleLeave = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Leave.findById(id);
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Leave not found');
    return result;
});
const updateLeave = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (payload.startDate && payload.endDate) {
        payload.days = calcDays(payload.startDate, payload.endDate);
    }
    const result = yield model_1.Leave.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update leave');
    return result;
});
const updateLeaveStatus = (id, status, approvedBy) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Leave.findByIdAndUpdate(id, {
        status,
        approvedBy,
        approvedAt: status === 'approved' ? new Date() : undefined,
    }, { new: true, runValidators: true });
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Leave not found');
    return result;
});
const deleteLeave = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Leave.findByIdAndDelete(id);
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Leave not found');
    return result;
});
exports.leaveServices = {
    createLeave,
    getAllLeaves,
    getSingleLeave,
    updateLeave,
    updateLeaveStatus,
    deleteLeave,
};
