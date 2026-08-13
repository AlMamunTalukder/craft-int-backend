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
exports.certificateServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const model_1 = require("./model");
const student_model_1 = require("../student/student.model");
const generateCertificateNo = () => __awaiter(void 0, void 0, void 0, function* () {
    const year = new Date().getFullYear();
    const last = yield model_1.Certificate.findOne({
        certificateNo: new RegExp(`^CII-CERT-${year}-`),
    })
        .sort({ certificateNo: -1 })
        .select('certificateNo');
    let next = 1;
    if (last === null || last === void 0 ? void 0 : last.certificateNo) {
        const parsed = parseInt(String(last.certificateNo).split('-').pop() || '0', 10);
        if (!isNaN(parsed))
            next = parsed + 1;
    }
    return `CII-CERT-${year}-${String(next).padStart(4, '0')}`;
});
const createCertificate = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const certificateNo = yield generateCertificateNo();
    const result = yield model_1.Certificate.create(Object.assign(Object.assign({}, payload), { certificateNo }));
    return result;
});
const getAllCertificates = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.default(model_1.Certificate.find().populate('student', 'name nameBangla studentId className'), query)
        .search(['certificateNo'])
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield queryBuilder.countTotal();
    const data = yield queryBuilder.modelQuery;
    return { meta, data };
});
const getSingleCertificate = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Certificate.findById(id).populate('student', 'name nameBangla studentId studentClassRoll studentPhoto className section parentInfo');
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Certificate not found');
    return result;
});
const updateCertificate = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Certificate.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update certificate');
    return result;
});
const deleteCertificate = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Certificate.findByIdAndDelete(id);
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Certificate not found');
    return result;
});
const getIdCards = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { className, department } = query;
    const filter = { status: { $nin: ['left', 'passed'] } };
    if (className)
        filter.className = { $in: [className] };
    if (department)
        filter.studentDepartment = department;
    const students = yield student_model_1.Student.find(filter)
        .populate('className', 'className')
        .select('studentId smartIdCard name nameBangla studentPhoto studentClassRoll className section studentDepartment bloodGroup birthDate parentInfo')
        .sort('studentClassRoll');
    return { data: students };
});
exports.certificateServices = {
    createCertificate,
    getAllCertificates,
    getSingleCertificate,
    updateCertificate,
    deleteCertificate,
    getIdCards,
};
