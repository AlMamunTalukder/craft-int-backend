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
exports.admissionController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const admission_service_1 = require("./admission.service");
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const catchAsync_1 = require("../../../utils/catchAsync");
const createAdmission = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    try {
        const result = yield admission_service_1.admissionService.createAdmission(req.body);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Admission created successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
const getAllAdmissions = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield admission_service_1.admissionService.getAllAdmissions(req.query);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Admissions retrieved successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
const getSingleAdmission = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield admission_service_1.admissionService.getSingleAdmission(id);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Admission retrieved successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
const updateAdmission = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield admission_service_1.admissionService.updateAdmission(id, req.body);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Admission updated successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
const deleteAdmission = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield admission_service_1.admissionService.deleteAdmission(id);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Admission deleted successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
exports.admissionController = {
    createAdmission,
    getAllAdmissions,
    getSingleAdmission,
    updateAdmission,
    deleteAdmission,
};
