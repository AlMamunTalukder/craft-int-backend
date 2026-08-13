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
exports.classReportServices = exports.getAllClassReports = exports.createClassReport = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const classreport_model_1 = require("./classreport.model");
const student_model_1 = require("../student/student.model");
const mongoose_1 = require("mongoose");
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
});
const createClassReport = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!payload.teachers || !payload.classes || !payload.subjects) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Missing required fields');
    }
    // ✅ Automatically set hasComments true if any comments exist
    payload.hasComments =
        ((_a = payload.studentEvaluations) === null || _a === void 0 ? void 0 : _a.some((evaluation) => evaluation.comments && evaluation.comments.trim().length > 0)) || false;
    const newReport = yield classreport_model_1.ClassReport.create(payload);
    return newReport;
});
exports.createClassReport = createClassReport;
const getAllClassReports = (query) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const searchTerm = (_a = query.searchTerm) === null || _a === void 0 ? void 0 : _a.trim();
    const page = Number.parseInt(((_b = query.page) === null || _b === void 0 ? void 0 : _b.toString()) || '1') || 1;
    const limit = Number.parseInt(((_c = query.limit) === null || _c === void 0 ? void 0 : _c.toString()) || '5') || 5;
    const skip = (page - 1) * limit;
    const hasCommentsQuery = query.hasComments === 'true' || query.hasComments === true;
    // Cache key
    const cacheKey = `class_reports:${JSON.stringify(query)}`;
    try {
        const cachedResult = yield redis.get(cacheKey);
        if (cachedResult) {
            return JSON.parse(cachedResult);
        }
    }
    catch (error) {
        console.error('Redis cache read error:', error);
    }
    const matchConditions = [];
    let matchingStudentIds = [];
    // 🔹 SearchTerm logic for reports and students
    if (searchTerm) {
        const matchingStudents = yield student_model_1.Student.find({
            name: { $regex: searchTerm, $options: 'i' },
        }).select('_id');
        matchingStudentIds = matchingStudents.map((student) => new mongoose_1.Types.ObjectId(String(student._id)));
        matchConditions.push({
            $or: [
                { teachers: { $regex: searchTerm, $options: 'i' } },
                { classes: { $regex: searchTerm, $options: 'i' } },
                { subjects: { $regex: searchTerm, $options: 'i' } },
                { hour: { $regex: searchTerm, $options: 'i' } },
                { 'studentEvaluations.studentId': { $in: matchingStudentIds } },
                {
                    'studentEvaluations.comments': { $regex: searchTerm, $options: 'i' },
                },
            ],
        });
    }
    // 🔹 Top-level filters
    if ((_d = query.className) === null || _d === void 0 ? void 0 : _d.trim()) {
        matchConditions.push({
            classes: { $regex: query.className, $options: 'i' },
        });
    }
    if ((_e = query.subject) === null || _e === void 0 ? void 0 : _e.trim()) {
        matchConditions.push({
            subjects: { $regex: query.subject, $options: 'i' },
        });
    }
    if ((_f = query.teacher) === null || _f === void 0 ? void 0 : _f.trim()) {
        matchConditions.push({
            teachers: { $regex: query.teacher, $options: 'i' },
        });
    }
    if ((_g = query.hour) === null || _g === void 0 ? void 0 : _g.trim()) {
        matchConditions.push({ hour: query.hour });
    }
    if ((_h = query.date) === null || _h === void 0 ? void 0 : _h.trim()) {
        matchConditions.push({ date: new Date(query.date) });
    }
    if (query.startDate && query.endDate) {
        matchConditions.push({
            date: {
                $gte: new Date(query.startDate),
                $lte: new Date(query.endDate),
            },
        });
    }
    // ❌ Remove old hasComments report-level filter
    // if (hasCommentsQuery) {
    //   matchConditions.push({ hasComments: true });
    // }
    const pipeline = [];
    if (matchConditions.length > 0) {
        pipeline.push({ $match: { $and: matchConditions } });
    }
    // 🔹 Populate student details
    pipeline.push({
        $lookup: {
            from: 'students',
            localField: 'studentEvaluations.studentId',
            foreignField: '_id',
            as: 'studentDetails',
        },
    }, {
        $addFields: {
            studentEvaluations: {
                $map: {
                    input: '$studentEvaluations',
                    as: 'evaluation',
                    in: {
                        $mergeObjects: [
                            '$$evaluation',
                            {
                                studentId: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: '$studentDetails',
                                                as: 's',
                                                cond: { $eq: ['$$s._id', '$$evaluation.studentId'] },
                                            },
                                        },
                                        0,
                                    ],
                                },
                            },
                        ],
                    },
                },
            },
        },
    }, { $project: { studentDetails: 0 } });
    // 🔹 Build studentEvaluation filters
    // 1. Search term filters combined with OR
    const searchTermStudentFilters = [];
    if (searchTerm) {
        if (matchingStudentIds.length > 0) {
            searchTermStudentFilters.push({
                $in: ['$$evaluation.studentId._id', matchingStudentIds],
            });
        }
        searchTermStudentFilters.push({
            $regexMatch: {
                input: '$$evaluation.comments',
                regex: searchTerm,
                options: 'i',
            },
        });
    }
    // 2. ✅ hasComments filter (students who have comments)
    const hasCommentsFilter = hasCommentsQuery
        ? {
            $and: [
                { $ne: ['$$evaluation.comments', null] },
                { $ne: ['$$evaluation.comments', ''] },
            ],
        }
        : null;
    // 3. Other filters like lessonEvaluation, handwriting
    const otherFilters = [];
    if ((_j = query.lessonEvaluation) === null || _j === void 0 ? void 0 : _j.trim()) {
        otherFilters.push({
            $eq: ['$$evaluation.lessonEvaluation', query.lessonEvaluation],
        });
    }
    if ((_k = query.handwriting) === null || _k === void 0 ? void 0 : _k.trim()) {
        otherFilters.push({
            $eq: ['$$evaluation.handwriting', query.handwriting],
        });
    }
    // 🔹 Combine all studentEvaluation filters logically
    let finalCond;
    if (searchTermStudentFilters.length > 0 && hasCommentsFilter) {
        finalCond = {
            $and: [
                { $or: searchTermStudentFilters },
                hasCommentsFilter,
                ...otherFilters,
            ],
        };
    }
    else if (searchTermStudentFilters.length > 0) {
        finalCond = {
            $and: [{ $or: searchTermStudentFilters }, ...otherFilters],
        };
    }
    else if (hasCommentsFilter) {
        finalCond = {
            $and: [hasCommentsFilter, ...otherFilters],
        };
    }
    else if (otherFilters.length > 0) {
        finalCond = {
            $and: otherFilters,
        };
    }
    else {
        finalCond = {};
    }
    if (Object.keys(finalCond).length > 0) {
        pipeline.push({
            $addFields: {
                studentEvaluations: {
                    $filter: {
                        input: '$studentEvaluations',
                        as: 'evaluation',
                        cond: finalCond,
                    },
                },
            },
        });
        pipeline.push({
            $match: { 'studentEvaluations.0': { $exists: true } },
        });
    }
    // 🔹 Populate todayLesson
    pipeline.push({
        $lookup: {
            from: 'todaylessons',
            localField: 'todayLesson',
            foreignField: '_id',
            as: 'todayLesson',
        },
    }, { $unwind: { path: '$todayLesson', preserveNullAndEmptyArrays: true } });
    // 🔹 Populate homeTask
    pipeline.push({
        $lookup: {
            from: 'todaytasks',
            localField: 'homeTask',
            foreignField: '_id',
            as: 'homeTask',
        },
    }, { $unwind: { path: '$homeTask', preserveNullAndEmptyArrays: true } });
    // 🔹 Sort newest first
    pipeline.push({ $sort: { createdAt: -1 } });
    // 🔹 Count total documents after filtering
    const countPipeline = [...pipeline];
    const countResult = yield classreport_model_1.ClassReport.aggregate([
        ...countPipeline,
        { $count: 'total' },
    ]);
    const total = countResult.length > 0 ? countResult[0].total : 0;
    // 🔹 Pagination
    pipeline.push({ $skip: skip }, { $limit: limit });
    try {
        const reports = yield classreport_model_1.ClassReport.aggregate(pipeline);
        const commentsStats = yield getCommentsStatistics();
        const meta = {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
            commentsStats,
        };
        const result = { meta, reports };
        try {
            yield redis.setex(cacheKey, 300, JSON.stringify(result));
        }
        catch (error) {
            console.error('Redis cache write error:', error);
        }
        return result;
    }
    catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
});
exports.getAllClassReports = getAllClassReports;
const getCommentsStatistics = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pipeline = [
            {
                $unwind: '$studentEvaluations',
            },
            {
                $match: {
                    'studentEvaluations.comments': {
                        $exists: true,
                        $nin: ['', null],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalComments: { $sum: 1 },
                    reportsWithComments: { $addToSet: '$_id' },
                    studentsWithComments: { $addToSet: '$studentEvaluations.studentId' },
                },
            },
            {
                $project: {
                    totalComments: 1,
                    reportsWithComments: { $size: '$reportsWithComments' },
                    studentsWithComments: { $size: '$studentsWithComments' },
                },
            },
        ];
        const result = yield classreport_model_1.ClassReport.aggregate(pipeline);
        if (result.length > 0) {
            return {
                totalComments: result[0].totalComments,
                reportsWithComments: result[0].reportsWithComments,
                studentsWithComments: result[0].studentsWithComments,
            };
        }
        return {
            totalComments: 0,
            reportsWithComments: 0,
            studentsWithComments: 0,
        };
    }
    catch (error) {
        console.error('Error getting comments statistics:', error);
        return {
            totalComments: 0,
            reportsWithComments: 0,
            studentsWithComments: 0,
        };
    }
});
const getSingleClassReport = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield classreport_model_1.ClassReport.findById(id)
        .populate('subjects')
        .populate('teachers')
        .populate('todayLesson')
        .populate('classes')
        .populate('homeTask')
        .populate('studentEvaluations.studentId');
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Class report not found');
    }
    return result;
});
const updateClassReport = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield classreport_model_1.ClassReport.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update class report');
    }
    return result;
});
const deleteClassReport = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield classreport_model_1.ClassReport.findByIdAndDelete(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Class report not found or already deleted');
    }
    return result;
});
const updateHasCommentsForAllReports = () => __awaiter(void 0, void 0, void 0, function* () {
    const classReports = yield classreport_model_1.ClassReport.find({});
    for (const report of classReports) {
        report.studentEvaluations = report.studentEvaluations.map((evaluation) => {
            const hasComments = evaluation.comments && evaluation.comments.trim() !== '';
            return Object.assign(Object.assign({}, evaluation), { hasComments: !!hasComments });
        });
        yield report.save();
    }
    return { message: '✅ hasComments updated for all student evaluations' };
});
exports.classReportServices = {
    createClassReport: exports.createClassReport,
    getAllClassReports: exports.getAllClassReports,
    getSingleClassReport,
    updateClassReport,
    deleteClassReport,
    updateHasCommentsForAllReports,
};
