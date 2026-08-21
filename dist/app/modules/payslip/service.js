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
exports.payslipServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const model_1 = require("./model");
const salary_model_1 = require("../salary/salary.model");
const populateEmployees = (payslips) => __awaiter(void 0, void 0, void 0, function* () {
    const populated = [];
    for (const slip of payslips) {
        const doc = slip.toObject ? slip.toObject() : slip;
        if (doc.employeeType === 'teacher') {
            doc.employeeInfo = yield Promise.resolve().then(() => __importStar(require('../teacher/teacher.model'))).then((m) => m.Teacher.findById(doc.employee).select('name teacherId phone designation'));
        }
        else {
            doc.employeeInfo = yield Promise.resolve().then(() => __importStar(require('../staff/staff.model'))).then((m) => m.Staff.findById(doc.employee).select('name staffId phone category'));
        }
        populated.push(doc);
    }
    return populated;
});
const generatePayslips = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { month, year, employeeType } = payload;
    const employees = employeeType === 'teacher'
        ? yield Promise.resolve().then(() => __importStar(require('../teacher/teacher.model'))).then((m) => m.Teacher.find().select('_id name'))
        : yield Promise.resolve().then(() => __importStar(require('../staff/staff.model'))).then((m) => m.Staff.find().select('_id name'));
    const salaries = yield salary_model_1.Salary.find().sort({ effectiveDate: -1 });
    const latestByEmployeeName = new Map();
    for (const s of salaries) {
        const key = (s.employee || '').trim().toLowerCase();
        if (key && !latestByEmployeeName.has(key)) {
            latestByEmployeeName.set(key, s);
        }
    }
    const existing = yield model_1.Payslip.find({ month, year, employeeType });
    const existingKeys = new Set(existing.map((p) => p.employee.toString()));
    const created = [];
    for (const emp of employees) {
        const empId = emp._id.toString();
        if (existingKeys.has(empId))
            continue;
        const salary = latestByEmployeeName.get((emp.name || '').trim().toLowerCase());
        if (!salary)
            continue;
        const gross = (salary.basicSalary || 0) +
            (salary.houseRent || 0) +
            (salary.medicalAllowance || 0) +
            (salary.transportAllowance || 0) +
            (salary.foodAllowance || 0) +
            (salary.otherAllowances || 0);
        const totalDeductions = (salary.deductions || 0) +
            (salary.incomeTax || 0) +
            (salary.providentFund || 0) +
            (salary.otherDeductions || 0);
        const net = gross - totalDeductions;
        const slip = yield model_1.Payslip.create({
            employeeType,
            employee: empId,
            month,
            year,
            salary: salary._id,
            basicSalary: salary.basicSalary || 0,
            houseRent: salary.houseRent || 0,
            medicalAllowance: salary.medicalAllowance || 0,
            transportAllowance: salary.transportAllowance || 0,
            foodAllowance: salary.foodAllowance || 0,
            otherAllowances: salary.otherAllowances || 0,
            grossSalary: gross,
            deductions: salary.deductions || 0,
            incomeTax: salary.incomeTax || 0,
            providentFund: salary.providentFund || 0,
            otherDeductions: salary.otherDeductions || 0,
            totalDeductions,
            netSalary: net,
            status: 'draft',
        });
        created.push(slip);
    }
    return {
        generated: created.length,
        skipped: existing.length,
        totalEmployees: employees.length,
        data: created,
    };
});
const getAllPayslips = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = {};
    if (query.month)
        filter.month = Number(query.month);
    if (query.year)
        filter.year = Number(query.year);
    if (query.employeeType)
        filter.employeeType = query.employeeType;
    if (query.status)
        filter.status = query.status;
    const queryBuilder = new QueryBuilder_1.default(model_1.Payslip.find(filter), query)
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield queryBuilder.countTotal();
    const data = yield queryBuilder.modelQuery;
    const populated = yield populateEmployees(data);
    return { meta, data: populated };
});
const getSinglePayslip = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Payslip.findById(id);
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Payslip not found');
    const [populated] = yield populateEmployees([result]);
    return populated;
});
const markPaid = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Payslip.findByIdAndUpdate(id, { status: 'paid', paidAt: new Date() }, { new: true, runValidators: true });
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Payslip not found');
    return result;
});
const deletePayslip = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Payslip.findByIdAndDelete(id);
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Payslip not found');
    return result;
});
const getSummary = () => __awaiter(void 0, void 0, void 0, function* () {
    const [totals, byMonth] = yield Promise.all([
        model_1.Payslip.aggregate([
            {
                $group: {
                    _id: null,
                    totalNet: { $sum: '$netSalary' },
                    totalGross: { $sum: '$grossSalary' },
                    count: { $sum: 1 },
                    paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
                },
            },
        ]),
        model_1.Payslip.aggregate([
            {
                $group: {
                    _id: { month: '$month', year: '$year' },
                    totalNet: { $sum: '$netSalary' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 },
        ]),
    ]);
    return {
        totals: totals[0] || { totalNet: 0, totalGross: 0, count: 0, paid: 0 },
        byMonth,
    };
});
exports.payslipServices = {
    generatePayslips,
    getAllPayslips,
    getSinglePayslip,
    markPaid,
    deletePayslip,
    getSummary,
};
