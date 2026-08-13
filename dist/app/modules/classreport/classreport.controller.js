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
exports.classReportControllers = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const catchAsync_1 = require("../../../utils/catchAsync");
const classreport_service_1 = require("./classreport.service");
const classreport_utils_1 = require("./classreport.utils");
const createClassReport = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield classreport_service_1.classReportServices.createClassReport(req.body);
    yield (0, classreport_utils_1.clearClassReportsCache)();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Class report created successfully',
        data: result,
    });
}));
const getAllClassReports = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield classreport_service_1.classReportServices.getAllClassReports(req.query);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Class reports retrieved successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
const getSingleClassReport = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield classreport_service_1.classReportServices.getSingleClassReport(id);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Class report retrieved successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
const updateClassReport = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const formattedData = Object.assign({}, req.body);
        if (Array.isArray(formattedData.teachers)) {
            formattedData.teachers = formattedData.teachers[0];
        }
        if (Array.isArray(formattedData.classes)) {
            formattedData.classes = formattedData.classes[0];
        }
        if (Array.isArray(formattedData.subjects)) {
            formattedData.subjects = formattedData.subjects[0];
        }
        const result = yield classreport_service_1.classReportServices.updateClassReport(id, formattedData);
        yield (0, classreport_utils_1.clearClassReportsCache)();
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Class report updated successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
const deleteClassReport = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield classreport_service_1.classReportServices.deleteClassReport(id);
        yield (0, classreport_utils_1.clearClassReportsCache)();
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Class report deleted successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
// const generateClassReportPdf: RequestHandler = catchAsync(async (req, res) => {
//   const { classreportid } = req.params;
//   const baseUrl = (
//     process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'http://localhost:5000'
//   ).replace(/\/$/, '');
//   try {
//     const pdfBuffer = await classReportServices.ge(
//       classreportid,
//       baseUrl,
//     );
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader(
//       'Content-Disposition',
//       `attachment; filename=classreport-${classreportid}.pdf`,
//     );
//     res.send(pdfBuffer);
//   } catch (error: any) {
//     console.error('PDF Generation Error:', error);
//     res.status(500).json({
//       status: 'error',
//       message:
//         error.message || 'An error occurred while generating the class report.',
//     });
//   }
// });
const updateHasCommentsForAllReports = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield classreport_service_1.classReportServices.updateHasCommentsForAllReports();
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'All class reports updated successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
exports.classReportControllers = {
    createClassReport,
    getAllClassReports,
    getSingleClassReport,
    updateClassReport,
    deleteClassReport,
    updateHasCommentsForAllReports
};
