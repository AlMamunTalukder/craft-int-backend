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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeeDetailsByMonth = exports.getStudentFeeStatus = exports.getFeeGenerationStatus = exports.triggerFeeGeneration = void 0;
// import { feeGenerationService } from '../../services/feeGeneration.service'; // পাথ ঠিক করুন
const student_model_1 = require("../student/student.model");
const model_1 = require("./model");
const feeGenerate_service_1 = require("../../services/feeGenerate.service");
const triggerFeeGeneration = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { month, year } = req.body;
        let result;
        if (month && year) {
            result = yield feeGenerate_service_1.feeGenerationService.generateMonthlyFees(month, year);
        }
        else {
            result = yield feeGenerate_service_1.feeGenerationService.generateCurrentMonthFees();
        }
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
});
exports.triggerFeeGeneration = triggerFeeGeneration;
const getFeeGenerationStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentDate = new Date();
        const monthName = currentDate.toLocaleString('default', { month: 'long' });
        const year = currentDate.getFullYear();
        const currentMonthFees = yield model_1.Fees.countDocuments({
            month: monthName,
            academicYear: year.toString(),
            isLateFeeRecord: { $ne: true },
        });
        const totalStudents = yield student_model_1.Student.countDocuments({
            status: 'active',
            admissionStatus: 'enrolled',
        });
        const mealFeesGenerated = yield model_1.Fees.countDocuments({
            month: monthName,
            academicYear: year.toString(),
            feeType: 'Meal Fee',
            isLateFeeRecord: { $ne: true },
        });
        const monthlyFeesGenerated = yield model_1.Fees.countDocuments({
            month: monthName,
            academicYear: year.toString(),
            feeType: 'Monthly Fee',
            isLateFeeRecord: { $ne: true },
        });
        const tuitionFeesGenerated = yield model_1.Fees.countDocuments({
            month: monthName,
            academicYear: year.toString(),
            feeType: 'Tuition Fee',
            isLateFeeRecord: { $ne: true },
        });
        const seatRentFeesGenerated = yield model_1.Fees.countDocuments({
            month: monthName,
            academicYear: year.toString(),
            feeType: 'Seat Rent',
            isLateFeeRecord: { $ne: true },
        });
        const admissionFeesGenerated = yield model_1.Fees.countDocuments({
            month: monthName,
            academicYear: year.toString(),
            feeType: 'Admission Fee',
            isLateFeeRecord: { $ne: true },
        });
        const expectedFeesPerStudent = 5;
        const totalExpectedFees = totalStudents * expectedFeesPerStudent;
        const totalGeneratedFees = currentMonthFees;
        res.status(200).json({
            success: true,
            data: {
                currentMonth: monthName,
                currentYear: year,
                totalStudents,
                statistics: {
                    totalFeesGenerated: totalGeneratedFees,
                    totalExpectedFees: totalExpectedFees,
                    completionRate: totalExpectedFees > 0
                        ? ((totalGeneratedFees / totalExpectedFees) * 100).toFixed(2)
                        : '0',
                    isComplete: totalGeneratedFees >= totalExpectedFees,
                },
                breakdown: {
                    admissionFee: {
                        generated: admissionFeesGenerated,
                        expected: totalStudents,
                        percentage: totalStudents > 0
                            ? ((admissionFeesGenerated / totalStudents) * 100).toFixed(2)
                            : '0',
                    },
                    monthlyFee: {
                        generated: monthlyFeesGenerated,
                        expected: totalStudents,
                        percentage: totalStudents > 0
                            ? ((monthlyFeesGenerated / totalStudents) * 100).toFixed(2)
                            : '0',
                    },
                    tuitionFee: {
                        generated: tuitionFeesGenerated,
                        expected: totalStudents,
                        percentage: totalStudents > 0
                            ? ((tuitionFeesGenerated / totalStudents) * 100).toFixed(2)
                            : '0',
                    },
                    mealFee: {
                        generated: mealFeesGenerated,
                        expected: totalStudents,
                        percentage: totalStudents > 0
                            ? ((mealFeesGenerated / totalStudents) * 100).toFixed(2)
                            : '0',
                    },
                    seatRent: {
                        generated: seatRentFeesGenerated,
                        expected: totalStudents,
                        percentage: totalStudents > 0
                            ? ((seatRentFeesGenerated / totalStudents) * 100).toFixed(2)
                            : '0',
                    },
                },
                status: totalGeneratedFees >= totalExpectedFees ? 'completed' : 'pending',
                lastGeneratedAt: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.getFeeGenerationStatus = getFeeGenerationStatus;
const getStudentFeeStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentId } = req.params;
        const currentDate = new Date();
        const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
        const currentYear = currentDate.getFullYear();
        const studentFees = yield model_1.Fees.find({
            student: studentId,
            month: currentMonth,
            academicYear: currentYear.toString(),
            isLateFeeRecord: { $ne: true },
        }).lean();
        const student = yield student_model_1.Student.findById(studentId).lean();
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found',
            });
        }
        const feeSummary = {
            totalAmount: studentFees.reduce((sum, fee) => sum + fee.amount, 0),
            totalPaid: studentFees.reduce((sum, fee) => sum + fee.paidAmount, 0),
            totalDue: studentFees.reduce((sum, fee) => sum + fee.dueAmount, 0),
            totalAdvanceUsed: studentFees.reduce((sum, fee) => sum + (fee.advanceUsed || 0), 0),
            fees: studentFees.map(fee => ({
                feeType: fee.feeType,
                amount: fee.amount,
                paidAmount: fee.paidAmount,
                advanceUsed: fee.advanceUsed || 0,
                dueAmount: fee.dueAmount,
                status: fee.status,
                dueDate: fee.dueDate,
            })),
        };
        const mealFee = studentFees.find(fee => fee.feeType === 'Meal Fee');
        let mealAdjustmentInfo = null;
        if (mealFee && mealFee.advanceUsed && mealFee.advanceUsed > 0) {
            mealAdjustmentInfo = {
                adjustmentApplied: true,
                advanceUsed: mealFee.advanceUsed,
                originalAmount: mealFee.amount,
                netPayable: mealFee.amount - mealFee.advanceUsed,
                paidAmount: mealFee.paidAmount,
                dueAmount: mealFee.dueAmount,
                message: `আগের মাসের অ্যাডভান্স ৳${mealFee.advanceUsed} এই মাসের মিল ফি থেকে কেটে নেওয়া হয়েছে`,
            };
        }
        res.status(200).json({
            success: true,
            data: {
                studentId: student.studentId,
                studentName: student.name,
                currentMonth,
                currentYear,
                advanceBalance: student.advanceBalance || 0,
                feeSummary,
                mealAdjustmentInfo,
                admissionStatus: student.admissionStatus,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.getStudentFeeStatus = getStudentFeeStatus;
const getFeeDetailsByMonth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { month, year } = req.params;
        const monthName = new Date(`${year}-${month}-01`).toLocaleString('default', { month: 'long' });
        const fees = yield model_1.Fees.find({
            month: monthName,
            academicYear: year,
            isLateFeeRecord: { $ne: true },
        })
            .populate('student', 'name studentId class category')
            .lean();
        const summary = {
            month: monthName,
            year,
            totalFees: fees.reduce((sum, fee) => sum + fee.amount, 0),
            totalPaid: fees.reduce((sum, fee) => sum + fee.paidAmount, 0),
            totalDue: fees.reduce((sum, fee) => sum + fee.dueAmount, 0),
            totalAdvanceUsed: fees.reduce((sum, fee) => sum + (fee.advanceUsed || 0), 0),
            byFeeType: {
                admissionFee: {
                    total: fees.filter(f => f.feeType === 'Admission Fee').reduce((sum, f) => sum + f.amount, 0),
                    paid: fees.filter(f => f.feeType === 'Admission Fee').reduce((sum, f) => sum + f.paidAmount, 0),
                    due: fees.filter(f => f.feeType === 'Admission Fee').reduce((sum, f) => sum + f.dueAmount, 0),
                },
                monthlyFee: {
                    total: fees.filter(f => f.feeType === 'Monthly Fee').reduce((sum, f) => sum + f.amount, 0),
                    paid: fees.filter(f => f.feeType === 'Monthly Fee').reduce((sum, f) => sum + f.paidAmount, 0),
                    due: fees.filter(f => f.feeType === 'Monthly Fee').reduce((sum, f) => sum + f.dueAmount, 0),
                },
                tuitionFee: {
                    total: fees.filter(f => f.feeType === 'Tuition Fee').reduce((sum, f) => sum + f.amount, 0),
                    paid: fees.filter(f => f.feeType === 'Tuition Fee').reduce((sum, f) => sum + f.paidAmount, 0),
                    due: fees.filter(f => f.feeType === 'Tuition Fee').reduce((sum, f) => sum + f.dueAmount, 0),
                },
                mealFee: {
                    total: fees.filter(f => f.feeType === 'Meal Fee').reduce((sum, f) => sum + f.amount, 0),
                    paid: fees.filter(f => f.feeType === 'Meal Fee').reduce((sum, f) => sum + f.paidAmount, 0),
                    due: fees.filter(f => f.feeType === 'Meal Fee').reduce((sum, f) => sum + f.dueAmount, 0),
                    advanceUsed: fees.filter(f => f.feeType === 'Meal Fee').reduce((sum, f) => sum + (f.advanceUsed || 0), 0),
                },
                seatRent: {
                    total: fees.filter(f => f.feeType === 'Seat Rent').reduce((sum, f) => sum + f.amount, 0),
                    paid: fees.filter(f => f.feeType === 'Seat Rent').reduce((sum, f) => sum + f.paidAmount, 0),
                    due: fees.filter(f => f.feeType === 'Seat Rent').reduce((sum, f) => sum + f.dueAmount, 0),
                },
            },
            feesList: fees.map(fee => {
                var _a, _b, _c;
                return ({
                    studentName: (_a = fee.student) === null || _a === void 0 ? void 0 : _a.name,
                    studentId: (_b = fee.student) === null || _b === void 0 ? void 0 : _b.studentId,
                    className: fee.class,
                    category: (_c = fee.student) === null || _c === void 0 ? void 0 : _c.category,
                    feeType: fee.feeType,
                    amount: fee.amount,
                    paidAmount: fee.paidAmount,
                    advanceUsed: fee.advanceUsed,
                    dueAmount: fee.dueAmount,
                    status: fee.status,
                });
            }),
        };
        res.status(200).json({
            success: true,
            data: summary,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.getFeeDetailsByMonth = getFeeDetailsByMonth;
