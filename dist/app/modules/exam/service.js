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
exports.examServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const model_1 = require("./model");
const constant_1 = require("./constant");
const student_model_1 = require("../student/student.model");
const computeMarks = (items) => {
    const computed = items.map((item) => {
        const { grade, gradePoint } = (0, constant_1.gradeOf)(item.obtained);
        return Object.assign(Object.assign({}, item), { grade,
            gradePoint, result: grade === 'F' ? 'fail' : 'pass' });
    });
    const totalObtained = computed.reduce((s, i) => s + (i.obtained || 0), 0);
    const totalFull = computed.reduce((s, i) => s + (i.fullMarks || 0), 0);
    const anyFail = computed.some((i) => i.result === 'fail');
    const gpa = computed.length
        ? anyFail
            ? 0
            : Number((computed.reduce((s, i) => s + i.gradePoint, 0) / computed.length).toFixed(2))
        : 0;
    const { grade, remark } = (0, constant_1.gpaGradeOf)(gpa);
    return {
        marks: computed,
        totalObtained,
        totalFull,
        gpa,
        grade,
        result: anyFail ? 'fail' : 'pass',
        remark,
    };
};
const createExam = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Exam.create(payload);
    return result;
});
const getAllExams = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.default(model_1.Exam.find().populate('className'), query)
        .search(['name'])
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield queryBuilder.countTotal();
    const data = yield queryBuilder.modelQuery;
    return { meta, data };
});
const getSingleExam = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Exam.findById(id).populate('className');
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Exam not found');
    return result;
});
const updateExam = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Exam.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update exam');
    return result;
});
const deleteExam = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield model_1.ExamMark.deleteMany({ exam: id });
    const result = yield model_1.Exam.findByIdAndDelete(id);
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Exam not found');
    return result;
});
const publishExam = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Exam.findByIdAndUpdate(id, {
        status,
        publishedAt: status === 'published' ? new Date() : undefined,
    }, { new: true, runValidators: true });
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Exam not found');
    return result;
});
const getMarks = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { examId, className } = query;
    if (!examId)
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'examId is required');
    const filter = { exam: examId };
    if (className)
        filter.className = className;
    const data = yield model_1.ExamMark.find(filter).populate({
        path: 'student',
        select: 'name studentId studentClassRoll studentPhoto className',
    });
    return { data };
});
const upsertMarks = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { examId, className, entries } = payload;
    const exam = yield model_1.Exam.findById(examId);
    if (!exam)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Exam not found');
    const subjectMap = new Map(exam.subjects.map((s) => [s.subject, { fullMarks: s.fullMarks, passMarks: s.passMarks }]));
    const results = [];
    for (const entry of entries) {
        const items = entry.marks.map((m) => {
            const meta = subjectMap.get(m.subject) || { fullMarks: 100, passMarks: 33 };
            return {
                subject: m.subject,
                obtained: Number(m.obtained) || 0,
                fullMarks: meta.fullMarks,
                passMarks: meta.passMarks,
            };
        });
        const computed = computeMarks(items);
        const markDoc = Object.assign({ exam: examId, student: entry.student, className: className }, computed);
        const saved = yield model_1.ExamMark.findOneAndUpdate({ exam: examId, student: entry.student }, markDoc, { new: true, upsert: true, runValidators: true });
        results.push(saved);
    }
    return { data: results };
});
const getResults = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { examId, className } = query;
    if (!examId)
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'examId is required');
    const filter = { exam: examId };
    if (className)
        filter.className = className;
    const [marks, exam] = yield Promise.all([
        model_1.ExamMark.find(filter).populate({
            path: 'student',
            select: 'name nameBangla studentId studentClassRoll studentPhoto className',
        }),
        model_1.Exam.findById(examId).populate('className'),
    ]);
    const passCount = marks.filter((m) => m.result === 'pass').length;
    const failCount = marks.length - passCount;
    const totalStudents = yield student_model_1.Student.countDocuments(className ? { className: { $in: [className] } } : {});
    return {
        exam,
        results: marks,
        summary: {
            total: marks.length,
            pass: passCount,
            fail: failCount,
            classStrength: totalStudents,
            passRate: marks.length
                ? Number(((passCount / marks.length) * 100).toFixed(1))
                : 0,
        },
    };
});
exports.examServices = {
    createExam,
    getAllExams,
    getSingleExam,
    updateExam,
    deleteExam,
    publishExam,
    getMarks,
    upsertMarks,
    getResults,
};
