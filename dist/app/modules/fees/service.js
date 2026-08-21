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
exports.feesServices = exports.getClassWiseFeeSummary = exports.getAllDueFees = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const model_1 = require("./model");
const model_2 = require("../enrollment/model");
const student_model_1 = require("../student/student.model");
const model_3 = require("../payment/model");
const mongoose_1 = __importStar(require("mongoose"));
const service_1 = require("../feeAdjustment/service");
const model_4 = require("../feeAdjustment/model");
const payFee = (feeId, amountPaid, paymentMethod, transactionId, receiptNo) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const validation = yield service_1.feeAdjustmentServices.validateAdjustmentForPayment(feeId, amountPaid);
        const { fee, remainingDue } = validation;
        const actualRemainingDue = remainingDue - amountPaid;
        let advanceUsed = 0;
        let newStatus = fee.status;
        if (actualRemainingDue <= 0) {
            advanceUsed = -actualRemainingDue;
            fee.dueAmount = 0;
            newStatus = 'paid';
            if (advanceUsed > 0) {
                yield student_model_1.Student.findByIdAndUpdate(fee.student, { $inc: { advanceBalance: advanceUsed } }, { session });
            }
        }
        else {
            fee.dueAmount = actualRemainingDue;
            newStatus = 'partial';
        }
        fee.paidAmount += amountPaid;
        fee.advanceUsed += advanceUsed;
        fee.status = newStatus;
        fee.paymentMethod = paymentMethod;
        fee.transactionId = transactionId;
        fee.receiptNo = receiptNo;
        fee.paymentDate = new Date();
        yield fee.save({ session });
        const paymentData = {
            student: fee.student,
            fee: fee._id,
            amountPaid: amountPaid,
            paymentMethod: paymentMethod,
            paymentDate: new Date(),
            transactionId: transactionId || `TXN-${Date.now()}`,
            receiptNo: receiptNo || `RCP-${Date.now()}`,
            note: `Payment for ${fee.month} after adjustments`,
            collectedBy: 'System',
        };
        const payment = yield model_3.Payment.create([paymentData], { session });
        // Update student with the new payment
        yield student_model_1.Student.findByIdAndUpdate(fee.student, { $push: { payments: payment[0]._id } }, { session });
        yield session.commitTransaction();
        return {
            fee,
            payment: payment[0],
            adjustmentApplied: fee.discount + fee.waiver,
        };
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
const generateMonthlyFees = (studentId_1, enrollmentId_1, studentClass_1, yearlyFee_1, ...args_1) => __awaiter(void 0, [studentId_1, enrollmentId_1, studentClass_1, yearlyFee_1, ...args_1], void 0, function* (studentId, enrollmentId, studentClass, yearlyFee, startYear = new Date().getFullYear()) {
    const monthlyFee = Math.round(yearlyFee / 12);
    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];
    const feeRecords = months.map((month) => ({
        student: new mongoose_1.Types.ObjectId(studentId),
        enrollment: new mongoose_1.Types.ObjectId(enrollmentId),
        class: studentClass,
        month: `${month}-${startYear}`,
        amount: monthlyFee,
        paidAmount: 0,
        advanceUsed: 0,
        dueAmount: monthlyFee,
        discount: 0,
        waiver: 0,
        status: 'unpaid',
        academicYear: startYear.toString(),
        isCurrentMonth: false,
    }));
    const createdFees = yield model_1.Fees.insertMany(feeRecords);
    for (const fee of createdFees) {
        yield service_1.feeAdjustmentServices.applyAutoAdjustments(fee._id.toString(), studentId, startYear.toString());
    }
    yield student_model_1.Student.findByIdAndUpdate(studentId, {
        $push: { fees: { $each: createdFees.map((fee) => fee._id) } },
    });
    yield model_2.Enrollment.findByIdAndUpdate(enrollmentId, {
        $push: { fees: { $each: createdFees.map((fee) => fee._id) } },
    });
    return createdFees;
});
const payFeeWithAdvance = (feeId_1, ...args_1) => __awaiter(void 0, [feeId_1, ...args_1], void 0, function* (feeId, cashPaid = 0, advanceUsed = 0, paymentMethod = 'cash', transactionId, receiptNo) {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const fee = yield model_1.Fees.findById(feeId).session(session);
        if (!fee)
            throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Fee record not found');
        const student = yield student_model_1.Student.findById(fee.student).session(session);
        if (!student)
            throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Student not found');
        if (advanceUsed > 0 &&
            (!student.advanceBalance || student.advanceBalance < advanceUsed)) {
            throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Insufficient advance balance');
        }
        const totalPaid = cashPaid + advanceUsed;
        const remainingDue = fee.dueAmount - totalPaid;
        if (remainingDue < 0) {
            throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Payment exceeds due amount');
        }
        fee.paidAmount += totalPaid;
        fee.advanceUsed += advanceUsed;
        fee.dueAmount = remainingDue;
        fee.status = remainingDue === 0 ? 'paid' : 'partial';
        fee.paymentMethod = paymentMethod;
        fee.transactionId = transactionId;
        fee.receiptNo = receiptNo;
        fee.paymentDate = new Date();
        if (advanceUsed > 0) {
            student.advanceBalance = (student.advanceBalance || 0) - advanceUsed;
            yield student.save({ session });
        }
        yield fee.save({ session });
        const paymentData = {
            student: fee.student,
            fee: fee._id,
            amountPaid: totalPaid,
            paymentMethod: paymentMethod,
            paymentDate: new Date(),
            transactionId: transactionId || `TXN-${Date.now()}`,
            receiptNo: receiptNo || `RCP-${Date.now()}`,
            note: `Payment for ${fee.month}`,
            collectedBy: 'System',
        };
        const payment = yield model_3.Payment.create([paymentData], { session });
        yield session.commitTransaction();
        return {
            fee,
            payment: payment[0],
        };
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
const getStudentDueFees = (studentId, year) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {
        status: { $in: ['unpaid', 'partial'] },
        isLateFeeRecord: false,
    };
    if (studentId) {
        query.student = new mongoose_1.Types.ObjectId(studentId);
    }
    const dueFees = yield model_1.Fees.find(query)
        .populate({
        path: 'student',
        populate: {
            path: 'className',
            model: 'Class',
        },
    })
        .populate({
        path: 'enrollment',
        // select: 'roll class section academicYear',
    })
        .populate({
        path: 'originalFeeId',
        select: 'month amount',
    })
        .sort({ createdAt: -1 });
    let totalDue = 0;
    let totalPaid = 0;
    dueFees.forEach((fee) => {
        totalDue += fee.dueAmount || 0;
        totalPaid += fee.paidAmount || 0;
    });
    const totalFees = dueFees.reduce((sum, fee) => sum + fee.amount, 0);
    return {
        dueFees,
        totalDue,
        totalPaid,
        totalFees,
    };
});
const getMonthlyFeeStatus = (studentId, month, year) => __awaiter(void 0, void 0, void 0, function* () {
    const monthYear = `${month}-${year}`;
    const fee = yield model_1.Fees.findOne({
        student: new mongoose_1.Types.ObjectId(studentId),
        month: monthYear,
    });
    if (!fee) {
        return {
            month: monthYear,
            amount: 0,
            paidAmount: 0,
            dueAmount: 0,
            status: 'not-generated',
            paymentDate: null,
        };
    }
    return fee;
});
const generateBulkMonthlyFees = (feeData) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const results = [];
        for (const data of feeData) {
            const fees = yield generateMonthlyFees(data.studentId, data.enrollmentId, data.studentClass, data.yearlyFee, data.startYear);
            results.push(fees);
        }
        yield session.commitTransaction();
        return results.flat();
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
const getAllFees = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.default(model_1.Fees.find().populate({
        path: 'student',
        select: 'name studentId className fees', // only needed fields
        populate: [
            {
                path: 'fees',
                model: 'Fees',
                select: 'month amount paidAmount dueAmount status',
            },
            {
                path: 'className',
                model: 'Class',
                select: 'className',
            },
        ],
    }), query)
        .search(['class', 'month', 'status'])
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield queryBuilder.countTotal();
    const data = yield queryBuilder.modelQuery;
    return { meta, data };
});
const getSingleFee = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const fee = yield model_1.Fees.findById(id).populate('student enrollment');
    if (!fee)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Fee record not found');
    return fee;
});
const updateFee = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const fee = yield model_1.Fees.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true });
    if (!fee)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Fee record not found');
    return fee;
});
const deleteFee = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const fee = yield model_1.Fees.findByIdAndDelete(id);
    if (!fee)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Fee record not found');
    return fee;
});
const getAllDueFees = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { year, class: className } = query;
    const academicYear = (year || new Date().getFullYear()).toString();
    const matchStage = {
        academicYear,
    };
    if (className)
        matchStage.class = className;
    const pipeline = [
        { $match: matchStage },
        {
            $addFields: {
                computedDue: {
                    $subtract: [
                        '$amount',
                        {
                            $add: [
                                { $ifNull: ['$paidAmount', 0] },
                                { $ifNull: ['$discount', 0] },
                                { $ifNull: ['$waiver', 0] },
                                { $ifNull: ['$advanceUsed', 0] },
                            ],
                        },
                    ],
                },
            },
        },
        { $match: { computedDue: { $gt: 0.009 } } },
        {
            $lookup: {
                from: 'students',
                localField: 'student',
                foreignField: '_id',
                as: 'studentDoc',
            },
        },
        { $unwind: '$studentDoc' },
        {
            $lookup: {
                from: 'enrollments',
                localField: 'enrollment',
                foreignField: '_id',
                as: 'enrollDoc',
            },
        },
        { $unwind: { path: '$enrollDoc', preserveNullAndEmptyArrays: true } },
        { $sort: { student: 1, month: 1 } },
        {
            $group: {
                _id: '$student',
                student: { $first: '$studentDoc' },
                enrollment: { $first: '$enrollDoc' },
                fees: {
                    $push: {
                        _id: '$_id',
                        month: '$month',
                        class: '$class',
                        feeType: '$feeType',
                        amount: '$amount',
                        paidAmount: { $ifNull: ['$paidAmount', 0] },
                        discount: { $ifNull: ['$discount', 0] },
                        waiver: { $ifNull: ['$waiver', 0] },
                        advanceUsed: { $ifNull: ['$advanceUsed', 0] },
                        dueAmount: { $ifNull: ['$dueAmount', 0] },
                        status: '$status',
                        paymentDate: '$paymentDate',
                        computedDue: '$computedDue',
                        academicYear: '$academicYear',
                        isCurrentMonth: { $ifNull: ['$isCurrentMonth', false] },
                    },
                },
                totalDue: { $sum: '$computedDue' },
                totalPaid: { $sum: { $ifNull: ['$paidAmount', 0] } },
                totalAmount: { $sum: { $ifNull: ['$amount', 0] } },
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                student: {
                    _id: '$student._id',
                    name: '$student.name',
                    studentId: '$student.studentId',
                    mobile: '$student.mobile',
                },
                enrollment: {
                    _id: '$enrollment._id',
                    rollNumber: '$enrollment.rollNumber',
                },
                fees: 1,
                totalDue: { $round: ['$totalDue', 2] },
                totalPaid: 1,
                totalAmount: 1,
                feesCount: '$count',
            },
        },
    ];
    const students = yield model_1.Fees.aggregate(pipeline).allowDiskUse(true);
    const summary = {
        totalStudents: students.length,
        totalFees: students.reduce((s, st) => s + (st.feesCount || 0), 0),
        totalDueAmount: students.reduce((s, st) => s + (st.totalDue || 0), 0),
        totalPaidAmount: students.reduce((s, st) => s + (st.totalPaid || 0), 0),
        totalAmount: students.reduce((s, st) => s + (st.totalAmount || 0), 0),
        academicYear,
    };
    return { summary, students };
});
exports.getAllDueFees = getAllDueFees;
const createSingleFee = (studentId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const student = yield student_model_1.Student.findById(studentId).session(session);
        if (!student) {
            throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Student not found');
        }
        let actualDiscount = payload.discount || 0;
        let actualWaiver = payload.waiver || 0;
        if (payload.discountType === 'percentage') {
            actualDiscount = (payload.amount * actualDiscount) / 100;
        }
        if (payload.waiverType === 'percentage') {
            actualWaiver = (payload.amount * actualWaiver) / 100;
        }
        // Prevent overflow
        actualDiscount = Math.min(actualDiscount, payload.amount);
        actualWaiver = Math.min(actualWaiver, payload.amount - actualDiscount);
        const netAmount = payload.amount - actualDiscount - actualWaiver;
        const existingFee = yield model_1.Fees.findOne({
            student: studentId,
            class: payload.class,
            month: payload.month,
            academicYear: payload.academicYear,
            feeType: payload.feeType,
        }).session(session);
        if (existingFee) {
            throw new AppError_1.AppError(http_status_1.default.CONFLICT, `Fee already exists for ${payload.month} in class ${payload.class}`);
        }
        const feeData = {
            student: new mongoose_1.Types.ObjectId(studentId),
            class: payload.class,
            month: payload.month,
            amount: payload.amount,
            paidAmount: 0,
            advanceUsed: 0,
            dueAmount: netAmount,
            discount: actualDiscount,
            waiver: actualWaiver,
            feeType: payload.feeType || 'other',
            status: netAmount > 0 ? 'unpaid' : 'paid',
            academicYear: payload.academicYear,
            isCurrentMonth: false,
        };
        const [newFee] = yield model_1.Fees.create([feeData], { session });
        // ✅ Push fee into student
        yield student_model_1.Student.findByIdAndUpdate(studentId, { $push: { fees: newFee._id } }, { session });
        if (actualDiscount > 0) {
            yield model_4.FeeAdjustment.create([
                {
                    student: studentId,
                    fee: newFee._id,
                    type: 'discount',
                    adjustmentType: payload.discountType || 'flat',
                    value: actualDiscount,
                    reason: payload.reason || 'Manual discount',
                    approvedBy: null,
                    startMonth: payload.month,
                    endMonth: payload.month,
                    academicYear: payload.academicYear,
                    isActive: true,
                    isRecurring: payload.isRecurring || false,
                },
            ], { session });
        }
        if (actualWaiver > 0) {
            yield model_4.FeeAdjustment.create([
                {
                    student: studentId,
                    fee: newFee._id,
                    type: 'waiver',
                    adjustmentType: payload.waiverType || 'flat',
                    value: actualWaiver,
                    reason: payload.reason || 'Manual waiver',
                    approvedBy: null,
                    startMonth: payload.month,
                    endMonth: payload.month,
                    academicYear: payload.academicYear,
                    isActive: true,
                    isRecurring: payload.isRecurring || false,
                },
            ], { session });
        }
        yield service_1.feeAdjustmentServices.applyAutoAdjustments(newFee._id.toString(), studentId, payload.academicYear);
        yield session.commitTransaction();
        const updatedFee = yield model_1.Fees.findById(newFee._id)
            .populate('student')
            .session(session);
        return updatedFee;
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
const getClassWiseFeeSummary = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const academicYear = query.academicYear || new Date().getFullYear().toString();
    const matchStage = { academicYear };
    if (query.month) {
        matchStage.month = { $regex: `^${query.month}-`, $options: 'i' };
    }
    const pipeline = [
        { $match: matchStage },
        {
            $addFields: {
                resolvedClass: {
                    $cond: {
                        if: {
                            $and: [
                                { $ifNull: ['$class', false] },
                                { $ne: ['$class', ''] },
                                { $ne: ['$class', null] }
                            ]
                        },
                        then: '$class',
                        else: 'Unassigned'
                    }
                },
                computedDue: {
                    $max: [
                        0,
                        {
                            $subtract: [
                                '$amount',
                                {
                                    $add: [
                                        { $ifNull: ['$paidAmount', 0] },
                                        { $ifNull: ['$discount', 0] },
                                        { $ifNull: ['$waiver', 0] },
                                        { $ifNull: ['$advanceUsed', 0] }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                monthName: {
                    $cond: {
                        if: { $eq: ['$month', 'Admission'] },
                        then: 'Admission',
                        else: {
                            $arrayElemAt: [{ $split: ['$month', '-'] }, 0]
                        }
                    }
                },
                // Extract year from month if exists
                monthYear: {
                    $cond: {
                        if: { $eq: ['$month', 'Admission'] },
                        then: 'Admission',
                        else: {
                            $arrayElemAt: [{ $split: ['$month', '-'] }, 1]
                        }
                    }
                }
            }
        },
        // Optional class filter (after resolution)
        ...(query.class ? [{ $match: { resolvedClass: query.class } }] : []),
        // Group by resolvedClass + monthName
        {
            $group: {
                _id: {
                    class: '$resolvedClass',
                    month: '$monthName',
                    monthYear: '$monthYear'
                },
                totalAmount: { $sum: '$amount' },
                totalPaid: { $sum: { $ifNull: ['$paidAmount', 0] } },
                totalDue: { $sum: '$computedDue' },
                totalDiscount: { $sum: { $ifNull: ['$discount', 0] } },
                totalWaiver: { $sum: { $ifNull: ['$waiver', 0] } },
                totalAdvance: { $sum: { $ifNull: ['$advanceUsed', 0] } },
                studentCount: { $addToSet: '$student' },
                feeCount: { $sum: 1 }
            }
        },
        {
            $addFields: {
                monthOrder: {
                    $indexOfArray: [
                        [
                            'Admission',
                            'January',
                            'February',
                            'March',
                            'April',
                            'May',
                            'June',
                            'July',
                            'August',
                            'September',
                            'October',
                            'November',
                            'December'
                        ],
                        '$_id.month'
                    ]
                }
            }
        },
        { $sort: { '_id.class': 1, monthOrder: 1 } },
        // Group by class → yearly rollup
        {
            $group: {
                _id: '$_id.class',
                monthly: {
                    $push: {
                        month: '$_id.month',
                        totalAmount: '$totalAmount',
                        totalPaid: '$totalPaid',
                        totalDue: '$totalDue',
                        totalDiscount: '$totalDiscount',
                        totalWaiver: '$totalWaiver',
                        totalAdvance: '$totalAdvance',
                        feeCount: '$feeCount',
                        studentCount: { $size: '$studentCount' }
                    }
                },
                yearlyAmount: { $sum: '$totalAmount' },
                yearlyPaid: { $sum: '$totalPaid' },
                yearlyDue: { $sum: '$totalDue' },
                yearlyDiscount: { $sum: '$totalDiscount' },
                yearlyWaiver: { $sum: '$totalWaiver' },
                yearlyAdvance: { $sum: '$totalAdvance' }
            }
        },
        {
            $project: {
                _id: 0,
                class: { $ifNull: ['$_id', 'Unassigned'] },
                monthly: 1,
                yearly: {
                    totalAmount: '$yearlyAmount',
                    totalPaid: '$yearlyPaid',
                    totalDue: '$yearlyDue',
                    totalDiscount: '$yearlyDiscount',
                    totalWaiver: '$yearlyWaiver',
                    totalAdvance: '$yearlyAdvance'
                }
            }
        },
        { $sort: { class: 1 } }
    ];
    const classes = yield model_1.Fees.aggregate(pipeline).allowDiskUse(true);
    const grandTotal = classes.reduce((acc, c) => {
        acc.totalAmount += c.yearly.totalAmount;
        acc.totalPaid += c.yearly.totalPaid;
        acc.totalDue += c.yearly.totalDue;
        acc.totalDiscount += c.yearly.totalDiscount;
        acc.totalWaiver += c.yearly.totalWaiver;
        acc.totalAdvance += c.yearly.totalAdvance;
        return acc;
    }, {
        totalAmount: 0,
        totalPaid: 0,
        totalDue: 0,
        totalDiscount: 0,
        totalWaiver: 0,
        totalAdvance: 0
    });
    return { academicYear, classes, grandTotal };
});
exports.getClassWiseFeeSummary = getClassWiseFeeSummary;
exports.feesServices = {
    generateMonthlyFees,
    generateBulkMonthlyFees,
    payFee,
    payFeeWithAdvance,
    getStudentDueFees,
    getMonthlyFeeStatus,
    getAllFees,
    getSingleFee,
    updateFee,
    deleteFee,
    getAllDueFees: exports.getAllDueFees,
    createSingleFee,
    getClassWiseFeeSummary: exports.getClassWiseFeeSummary,
};
