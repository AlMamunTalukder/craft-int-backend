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
exports.metaServices = void 0;
const admission_model_1 = require("../admission/admission.model");
const class_model_1 = require("../class/class.model");
const expense_model_1 = require("../expense/expense.model");
const income_model_1 = require("../income/income.model");
const model_1 = require("../investment/model");
const model_2 = require("../loan/model");
const salary_model_1 = require("../salary/salary.model");
const staff_model_1 = require("../staff/staff.model");
const student_model_1 = require("../student/student.model");
const teacher_model_1 = require("../teacher/teacher.model");
const getAllMetaFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const [totalTeachers, totalStudents, totalStaffs, totalClasses, totalMaleStudents, totalFemaleStudents, totalNonResidentialStudents, totalResidentialStudents, totalDayCareStudents, classWiseStudentCount,] = yield Promise.all([
        teacher_model_1.Teacher.countDocuments(),
        student_model_1.Student.countDocuments(),
        staff_model_1.Staff.countDocuments(),
        class_model_1.Class.countDocuments(),
        student_model_1.Student.countDocuments({ gender: 'Male' }),
        student_model_1.Student.countDocuments({ gender: 'Female' }),
        student_model_1.Student.countDocuments({ studentType: 'Non-residential' }),
        student_model_1.Student.countDocuments({ studentType: 'Day-care' }),
        student_model_1.Student.countDocuments({ studentType: 'Residential' }),
        getClassWiseStudentCount(),
    ]);
    const income = yield income_model_1.Income.find();
    const totalIncomeAmount = income.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const totalIncomeAmountBD = totalIncomeAmount.toLocaleString('bn-BD');
    return {
        totalTeachers,
        totalStudents,
        totalStaffs,
        totalClasses,
        totalMaleStudents,
        totalFemaleStudents,
        totalNonResidentialStudents,
        totalResidentialStudents,
        totalDayCareStudents,
        totalIncomeAmount: totalIncomeAmountBD,
        classWiseStudentCount,
    };
});
// Get class-wise student count
const getClassWiseStudentCount = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // First, get all students with populated class names
        const students = yield student_model_1.Student.find({
            className: { $exists: true, $ne: [] },
        }).populate('className', 'name className');
        // Create a map to count students per class
        const classCountMap = new Map();
        students.forEach((student) => {
            if (student.className && student.className.length > 0) {
                // Get the first class (since className is an array)
                const classItem = student.className[0];
                // Handle both populated and unpopulated data
                let className = '';
                if (classItem && typeof classItem === 'object') {
                    className = classItem.name || classItem.className || 'Unknown Class';
                }
                else if (typeof classItem === 'string') {
                    className = classItem;
                }
                if (className) {
                    classCountMap.set(className, (classCountMap.get(className) || 0) + 1);
                }
            }
        });
        // Convert map to array of objects
        const result = Array.from(classCountMap.entries()).map(([className, studentCount]) => ({
            className,
            studentCount,
        }));
        // Sort by class name
        result.sort((a, b) => a.className.localeCompare(b.className));
        return result;
    }
    catch (error) {
        console.error('Error in getClassWiseStudentCount:', error);
        return [];
    }
});
// Get class-wise student count in object format: { "Class One": 40, "Class Two": 50 }
const getClassWiseStudentCountOnly = () => __awaiter(void 0, void 0, void 0, function* () {
    const classWiseCount = yield getClassWiseStudentCount();
    const formattedResult = {};
    classWiseCount.forEach((item) => {
        if (item.className) {
            formattedResult[item.className] = item.studentCount;
        }
    });
    return formattedResult;
});
const getAccountingReport = () => __awaiter(void 0, void 0, void 0, function* () {
    const [investments, expenses, incomes, salaries, loans, admissions] = yield Promise.all([
        model_1.Investment.find(),
        expense_model_1.Expense.find(),
        income_model_1.Income.find(),
        salary_model_1.Salary.find(),
        model_2.Loan.find(),
        admission_model_1.Admission.find(),
    ]);
    // Income & Expense
    const totalIncome = incomes.reduce((sum, inc) => sum + (inc.totalAmount || 0), 0);
    const totalExpense = expenses.reduce((sum, exp) => sum + (exp.totalAmount || 0), 0);
    const totalSalary = salaries.reduce((sum, sal) => sum + (sal.netSalary || 0), 0);
    const totalAdmissionFee = admissions.reduce((sum, adm) => sum + (adm.admissionFee || 0), 0);
    // Loans
    const takenLoans = loans.filter((l) => l.loan_type === 'taken');
    const givenLoans = loans.filter((l) => l.loan_type === 'given');
    const totalTakenLoan = takenLoans.reduce((sum, l) => sum + (l.loan_amount || 0), 0);
    const totalGivenLoan = givenLoans.reduce((sum, l) => sum + (l.loan_amount || 0), 0);
    // Outstanding loans calculation
    const outstandingTakenLoans = takenLoans.reduce((sum, l) => { var _a; return sum + ((_a = l.remainingBalance) !== null && _a !== void 0 ? _a : l.loan_amount); }, 0);
    const outstandingGivenLoans = givenLoans.reduce((sum, l) => { var _a; return sum + ((_a = l.remainingBalance) !== null && _a !== void 0 ? _a : l.loan_amount); }, 0);
    // Investments
    const outgoingInvestments = investments.filter((inv) => inv.investmentCategory === 'outgoing');
    const incomingInvestments = investments.filter((inv) => inv.investmentCategory === 'incoming');
    const totalOutgoingInvestment = outgoingInvestments.reduce((sum, inv) => sum + (inv.investmentAmount || 0), 0);
    const totalIncomingInvestment = incomingInvestments.reduce((sum, inv) => sum + (inv.investmentAmount || 0), 0);
    // Net Profit
    const netProfit = totalIncome + totalAdmissionFee - (totalExpense + totalSalary);
    // Cash Balance
    const cashBalance = totalIncome +
        totalAdmissionFee +
        totalTakenLoan +
        totalIncomingInvestment -
        (totalExpense + totalSalary + totalOutgoingInvestment + totalGivenLoan);
    // Assets
    const assets = {
        cash: Math.max(0, cashBalance),
        accountsReceivable: outstandingGivenLoans,
        investments: outgoingInvestments.reduce((sum, inv) => sum + (inv.currentValue || inv.investmentAmount), 0),
        fixedAssets: 0,
        total: function () {
            return (this.cash +
                this.accountsReceivable +
                this.investments +
                this.fixedAssets);
        },
    };
    // Liabilities
    const liabilities = {
        loans: outstandingTakenLoans,
        accountsPayable: 0,
        otherLiabilities: 0,
        total: function () {
            return this.loans + this.accountsPayable + this.otherLiabilities;
        },
    };
    // Equity
    const equity = {
        capital: totalIncomingInvestment,
        retainedEarnings: netProfit,
        total: function () {
            return this.capital + this.retainedEarnings;
        },
    };
    // Equation Check
    const isBalanced = assets.total() === liabilities.total() + equity.total();
    return {
        success: true,
        message: 'Accounting report fetched successfully.',
        data: {
            summary: {
                assets: assets.total(),
                liabilities: liabilities.total(),
                equity: equity.total(),
                income: totalIncome + totalAdmissionFee,
                expense: totalExpense + totalSalary,
                netProfit,
            },
            breakdown: {
                totalIncome,
                totalAdmissionFee,
                totalExpense,
                totalSalary,
                totalOutgoingInvestment,
                totalIncomingInvestment,
                totalTakenLoan,
                totalGivenLoan,
                outstandingTakenLoans,
                outstandingGivenLoans,
            },
            details: {
                assets,
                liabilities,
                equity,
            },
            formulaCheck: {
                'Assets (সম্পদ)': assets.total(),
                'Liabilities (দেনা)': liabilities.total(),
                'Equity (মূলধন)': equity.total(),
                Equation: `Assets (${assets.total()}) = Liabilities (${liabilities.total()}) + Equity (${equity.total()})`,
                'Valid?': isBalanced,
                Difference: assets.total() - (liabilities.total() + equity.total()),
            },
        },
    };
});
exports.metaServices = {
    getAllMetaFromDB,
    getAccountingReport,
    getClassWiseStudentCountOnly,
};
