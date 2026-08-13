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
exports.routineServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const model_1 = require("./model");
const timeOverlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;
const checkTeacherConflict = (payload, excludeId) => __awaiter(void 0, void 0, void 0, function* () {
    const periods = payload.periods || [];
    const teacherIds = periods
        .filter((p) => p.teacher && !p.isBreak)
        .map((p) => { var _a; return (_a = p.teacher) === null || _a === void 0 ? void 0 : _a.toString(); });
    if (!teacherIds.length)
        return;
    const existing = yield model_1.ClassRoutine.find(Object.assign({ day: payload.day, academicYear: payload.academicYear }, (excludeId ? { _id: { $ne: excludeId } } : {}))).populate('periods');
    const conflicts = [];
    for (const routine of existing) {
        for (const newP of periods) {
            if (!newP.teacher || newP.isBreak)
                continue;
            for (const oldP of routine.periods) {
                if (!oldP.teacher || oldP.isBreak)
                    continue;
                if (newP.teacher.toString() === oldP.teacher.toString() &&
                    timeOverlaps(newP.startTime, newP.endTime, oldP.startTime, oldP.endTime)) {
                    conflicts.push(`${routine.day}: ${oldP.startTime}-${oldP.endTime} (${oldP.subject})`);
                }
            }
        }
    }
    if (conflicts.length) {
        throw new AppError_1.AppError(http_status_1.default.CONFLICT, `Teacher already has a class at: ${conflicts.join(', ')}`);
    }
});
const createRoutine = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    yield checkTeacherConflict(payload);
    const result = yield model_1.ClassRoutine.create(Object.assign(Object.assign({}, payload), { academicYear: payload.academicYear || String(new Date().getFullYear()) }));
    return result;
});
const getAllRoutines = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.default(model_1.ClassRoutine.find().populate('className'), query)
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield queryBuilder.countTotal();
    const data = yield queryBuilder.modelQuery;
    return { meta, data };
});
const getSingleRoutine = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.ClassRoutine.findById(id).populate('className');
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Class routine not found');
    return result;
});
const updateRoutine = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    yield checkTeacherConflict(payload, id);
    const result = yield model_1.ClassRoutine.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update routine');
    return result;
});
const deleteRoutine = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.ClassRoutine.findByIdAndDelete(id);
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Class routine not found');
    return result;
});
const getWeekRoutine = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { className, section, academicYear } = query;
    if (!className)
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'class is required');
    const filter = { className };
    if (section)
        filter.section = section;
    if (academicYear)
        filter.academicYear = academicYear;
    const data = yield model_1.ClassRoutine.find(filter)
        .populate('className')
        .populate('periods.teacher', 'name teacherId');
    const weekMap = {};
    for (const day of [
        'Saturday',
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
    ]) {
        weekMap[day] = data.filter((r) => r.day === day);
    }
    return { data, week: weekMap };
});
exports.routineServices = {
    createRoutine,
    getAllRoutines,
    getSingleRoutine,
    updateRoutine,
    deleteRoutine,
    getWeekRoutine,
};
