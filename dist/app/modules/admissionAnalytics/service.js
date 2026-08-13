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
exports.admissionAnalyticsServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const model_1 = require("../onlineAdmission/model");
const student_model_1 = require("../student/student.model");
const getAdmissionStats = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const year = query.year || undefined;
    const appMatch = {};
    if (year)
        appMatch.academicYear = year;
    const [byStatus, byClass, byDepartment, monthly, studentEnrolled] = yield Promise.all([
        model_1.AdmissionApplication.aggregate([
            { $match: appMatch },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        model_1.AdmissionApplication.aggregate([
            { $match: appMatch },
            {
                $group: {
                    _id: '$studentInfo.class',
                    applied: { $sum: 1 },
                    approved: {
                        $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
                    },
                },
            },
        ]),
        model_1.AdmissionApplication.aggregate([
            { $match: appMatch },
            {
                $group: {
                    _id: '$studentInfo.department',
                    applied: { $sum: 1 },
                },
            },
        ]),
        model_1.AdmissionApplication.aggregate([
            { $match: appMatch },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    applied: { $sum: 1 },
                    approved: {
                        $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
                    },
                },
            },
            { $sort: { _id: 1 } },
        ]),
        student_model_1.Student.countDocuments(year ? { academicYear: year, admissionStatus: 'enrolled' } : { admissionStatus: 'enrolled' }),
    ]);
    const statusMap = {};
    for (const row of byStatus)
        statusMap[row._id] = row.count;
    const applied = byStatus.reduce((s, r) => s + r.count, 0);
    const pending = statusMap.pending || 0;
    const approved = statusMap.approved || 0;
    const rejected = statusMap.rejected || 0;
    const enrolled = studentEnrolled;
    if (!applied && !enrolled) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'No admission data found');
    }
    return {
        year: year || 'all',
        funnel: { applied, pending, approved, rejected, enrolled },
        conversionRate: applied
            ? Number(((approved / applied) * 100).toFixed(1))
            : 0,
        enrollmentRate: applied
            ? Number(((enrolled / applied) * 100).toFixed(1))
            : 0,
        byClass,
        byDepartment,
        monthly,
    };
});
exports.admissionAnalyticsServices = { getAdmissionStats };
