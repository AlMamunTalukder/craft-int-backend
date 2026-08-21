"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
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
exports.feeGenerationService = exports.FeeGenerationService = void 0;
const student_model_1 = require("../modules/student/student.model");
const model_1 = require("../modules/fees/model");
const model_2 = require("../modules/feeCategory/model");
class FeeGenerationService {
    constructor() {
        this.isRunning = false;
    }
    static getInstance() {
        if (!FeeGenerationService.instance) {
            FeeGenerationService.instance = new FeeGenerationService();
        }
        return FeeGenerationService.instance;
    }
    getMonthName(month) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[month - 1];
    }
    calculateDueDate(month, year) {
        const dueDate = new Date(year, month - 1, 10);
        if (dueDate.getDay() === 0)
            dueDate.setDate(11);
        else if (dueDate.getDay() === 6)
            dueDate.setDate(12);
        return dueDate;
    }
    getStudentClassInfo(student) {
        var _a, _b;
        if ((_a = student.class) === null || _a === void 0 ? void 0 : _a.trim())
            return student.class.trim();
        if (((_b = student.className) === null || _b === void 0 ? void 0 : _b.length) > 0) {
            const classData = student.className[0];
            if (typeof classData === 'object') {
                return classData.className || classData.name || '';
            }
            return String(classData);
        }
        return '';
    }
    generateMonthlyFees(month, year) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRunning) {
                return { success: false, message: 'Already running' };
            }
            this.isRunning = true;
            try {
                const monthName = this.getMonthName(month);
                const academicYear = year.toString();
                const students = yield student_model_1.Student.find({
                    status: 'active',
                    admissionStatus: 'enrolled',
                }).populate("className").lean();
                let generatedCount = 0;
                let skippedCount = 0;
                let errorCount = 0;
                let admissionFeeCount = 0;
                const generatedFees = [];
                const errors = [];
                // Process students in batches
                const BATCH_SIZE = 10;
                for (let i = 0; i < students.length; i += BATCH_SIZE) {
                    const batch = students.slice(i, i + BATCH_SIZE);
                    // Process each batch in parallel for speed
                    yield Promise.all(batch.map((student) => __awaiter(this, void 0, void 0, function* () {
                        try {
                            const studentClassName = this.getStudentClassInfo(student);
                            if (!studentClassName) {
                                errorCount++;
                                errors.push({
                                    studentId: student._id,
                                    studentName: student.name,
                                    error: 'No class assigned',
                                });
                                return;
                            }
                            const studentCategory = student.category || student.studentType || 'Residential';
                            let feeCategory = yield model_2.FeeCategory.findOne({
                                categoryName: studentCategory,
                                className: studentClassName,
                            });
                            if (!feeCategory) {
                                feeCategory = yield model_2.FeeCategory.findOne({
                                    categoryName: { $regex: new RegExp(`^${studentCategory}$`, 'i') },
                                    className: { $regex: new RegExp(`^${studentClassName}$`, 'i') },
                                });
                            }
                            if (!feeCategory) {
                                errorCount++;
                                errors.push({
                                    studentId: student._id,
                                    studentName: student.name,
                                    error: `No fee category: ${studentCategory} - ${studentClassName}`,
                                });
                                return;
                            }
                            const dueDate = this.calculateDueDate(month, year);
                            const studentFees = [];
                            // Read advance balance fresh
                            const studentWithBalance = yield student_model_1.Student.findById(student._id);
                            let advanceBalance = (studentWithBalance === null || studentWithBalance === void 0 ? void 0 : studentWithBalance.advanceBalance) || 0;
                            for (const feeItem of feeCategory.feeItems) {
                                // ─────────────────────────────────────────────
                                // ✅ Meal Fee এখন এখানে generate হয় না।
                                // এটা month-end এ actual attendance থেকে
                                // mealFeeBalanceService দিয়ে generate হয়, এবং
                                // advance/due/future balance হিসাবও সেখানেই হয়।
                                // ─────────────────────────────────────────────
                                if (feeItem.feeType === 'Meal Fee') {
                                    continue;
                                }
                                // --- Idempotency check: skip if fee already exists ---
                                if (feeItem.feeType === 'Admission Fee') {
                                    const existingAdmission = yield model_1.Fees.findOne({
                                        student: student._id,
                                        feeType: 'Admission Fee',
                                    });
                                    if (existingAdmission) {
                                        continue;
                                    }
                                }
                                else {
                                    const existingFee = yield model_1.Fees.findOne({
                                        student: student._id,
                                        month: monthName,
                                        academicYear,
                                        feeType: feeItem.feeType,
                                    });
                                    if (existingFee) {
                                        continue;
                                    }
                                }
                                // --- Advance balance logic (non-meal fees) ---
                                const finalAmount = feeItem.amount;
                                let advanceUsed = 0;
                                let paidAmount = 0;
                                let status = 'unpaid';
                                if (advanceBalance > 0 && finalAmount > 0) {
                                    const advanceToUse = Math.min(advanceBalance, finalAmount);
                                    advanceUsed = advanceToUse;
                                    paidAmount = advanceToUse;
                                    advanceBalance -= advanceToUse;
                                }
                                const dueAmount = finalAmount - paidAmount;
                                if (dueAmount <= 0)
                                    status = 'paid';
                                const feeDueDate = feeItem.feeType === 'Admission Fee'
                                    ? new Date(year, month - 1, 30)
                                    : dueDate;
                                // --- Safe insert: no transaction needed, idempotent by design ---
                                const feeRecord = yield model_1.Fees.create({
                                    student: student._id,
                                    class: studentClassName,
                                    month: monthName,
                                    amount: finalAmount,
                                    paidAmount,
                                    advanceUsed,
                                    dueAmount,
                                    discount: 0,
                                    waiver: 0,
                                    feeType: feeItem.feeType,
                                    status,
                                    academicYear,
                                    isCurrentMonth: feeItem.feeType !== 'Admission Fee' &&
                                        month === new Date().getMonth() + 1 &&
                                        year === new Date().getFullYear(),
                                    dueDate: feeDueDate,
                                });
                                studentFees.push(feeRecord);
                                generatedCount++;
                                if (feeItem.feeType === 'Admission Fee') {
                                    admissionFeeCount++;
                                }
                                else {
                                    console.log(` ✅ ${student.name}: ${feeItem.feeType} ৳${finalAmount} (${monthName} ${year})`);
                                }
                            }
                            // Update advance balance if it changed
                            if (studentWithBalance && studentWithBalance.advanceBalance !== advanceBalance) {
                                yield student_model_1.Student.updateOne({ _id: student._id }, { $set: { advanceBalance } });
                            }
                            // Link fee IDs to student
                            if (studentFees.length > 0) {
                                const feeIds = studentFees.map((f) => f._id);
                                yield student_model_1.Student.updateOne({ _id: student._id }, { $addToSet: { fees: { $each: feeIds } } });
                                generatedFees.push({
                                    studentId: student._id,
                                    studentName: student.name,
                                    className: studentClassName,
                                    category: studentCategory,
                                    fees: studentFees.map((fee) => ({
                                        feeType: fee.feeType,
                                        amount: fee.amount,
                                        dueAmount: fee.dueAmount,
                                        status: fee.status,
                                        feeId: fee._id,
                                        month: fee.month,
                                    })),
                                    totalAmount: studentFees.reduce((s, f) => s + f.amount, 0),
                                    totalDue: studentFees.reduce((s, f) => s + f.dueAmount, 0),
                                });
                            }
                            else {
                                skippedCount++;
                            }
                        }
                        catch (error) {
                            errorCount++;
                            errors.push({
                                studentId: student._id,
                                studentName: student.name,
                                error: error.message,
                            });
                            console.error(` ❌ ${student.name}:`, error.message);
                        }
                    })));
                    // Small delay between batches
                    if (i + BATCH_SIZE < students.length) {
                        yield new Promise(resolve => setTimeout(resolve, 50));
                    }
                }
                const totalAmount = generatedFees.reduce((s, st) => s + st.totalAmount, 0);
                const totalDue = generatedFees.reduce((s, st) => s + st.totalDue, 0);
                return {
                    success: true,
                    message: `${monthName} ${year} ফি জেনারেশন সম্পূর্ণ`,
                    data: {
                        totalStudents: students.length,
                        generatedFeeRecords: generatedCount,
                        admissionFeesGenerated: admissionFeeCount,
                        monthlyFeesGenerated: generatedCount - admissionFeeCount,
                        studentsProcessed: generatedFees.length,
                        skippedCount,
                        errorCount,
                        totalAmount,
                        totalDue,
                        generatedFees,
                        errors: errors.slice(0, 100),
                        timestamp: new Date().toISOString(),
                    },
                };
            }
            catch (error) {
                console.error('❌ ফি জেনারেশন ব্যর্থ:', error);
                throw error;
            }
            finally {
                this.isRunning = false;
            }
        });
    }
    generateCurrentMonthFees() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            return yield this.generateMonthlyFees(now.getMonth() + 1, now.getFullYear());
        });
    }
}
exports.FeeGenerationService = FeeGenerationService;
exports.feeGenerationService = FeeGenerationService.getInstance();
