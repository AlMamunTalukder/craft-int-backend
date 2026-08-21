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
exports.metaController = void 0;
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = require("../../../utils/catchAsync");
const metService_1 = require("./metService");
const getAllMeta = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield metService_1.metaServices.getAllMetaFromDB();
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'All meta data fetched successfully.',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
const getAccountingReport = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield metService_1.metaServices.getAccountingReport();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Accounting report fetched successfully.',
        data: result,
    });
}));
const getClassWiseStudentCount = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield metService_1.metaServices.getClassWiseStudentCountOnly();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Class wise student count fetched successfully.',
        data: result,
    });
}));
exports.metaController = {
    getAllMeta,
    getAccountingReport,
    getClassWiseStudentCount,
};
