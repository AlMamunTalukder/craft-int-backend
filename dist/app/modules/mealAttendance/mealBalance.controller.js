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
exports.getAllStudentsMealBalance = exports.getStudentMealBalance = exports.debugAttendance = exports.deleteMonthlyMealFees = exports.deleteMealFee = exports.checkMealAttendanceSummary = exports.getMonthlyMealFees = exports.getStudentMealFees = exports.generateSingleStudentMealFee = exports.generateMonthlyMealFees = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mealFeeBalance_service_1 = require("../../services/mealFeeBalance.service");
const generateMonthlyMealFees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { month, year, mealRate } = req.body;
        const targetMonth = month || new Date().getMonth() + 1;
        const targetYear = year || new Date().getFullYear();
        const rate = mealRate || 55;
        if (targetMonth < 1 || targetMonth > 12) {
            return res.status(400).json({ success: false, message: 'Invalid month (1-12)' });
        }
        const result = yield mealFeeBalance_service_1.mealFeeBalanceService.generateAllStudentsMealFee(targetMonth, targetYear, rate);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.generateMonthlyMealFees = generateMonthlyMealFees;
const generateSingleStudentMealFee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentId } = req.params;
        const { month, year, mealRate } = req.body;
        const targetMonth = month || new Date().getMonth() + 1;
        const targetYear = year || new Date().getFullYear();
        const rate = mealRate || 55;
        const result = yield mealFeeBalance_service_1.mealFeeBalanceService.generateMealFeeForStudent(new mongoose_1.default.Types.ObjectId(studentId), targetMonth, targetYear, rate);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.generateSingleStudentMealFee = generateSingleStudentMealFee;
const getStudentMealFees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentId } = req.params;
        const result = yield mealFeeBalance_service_1.mealFeeBalanceService.getStudentMealFees(studentId);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.getStudentMealFees = getStudentMealFees;
const getMonthlyMealFees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { month, year } = req.params;
        const result = yield mealFeeBalance_service_1.mealFeeBalanceService.getMonthlyMealFees(parseInt(month), parseInt(year));
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.getMonthlyMealFees = getMonthlyMealFees;
const checkMealAttendanceSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { month, year } = req.query;
        const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const result = yield mealFeeBalance_service_1.mealFeeBalanceService.getMealAttendanceSummary(targetMonth, targetYear);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.checkMealAttendanceSummary = checkMealAttendanceSummary;
const deleteMealFee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { feeId } = req.params;
        const result = yield mealFeeBalance_service_1.mealFeeBalanceService.deleteMealFee(feeId);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.deleteMealFee = deleteMealFee;
const deleteMonthlyMealFees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { month, year } = req.params;
        const result = yield mealFeeBalance_service_1.mealFeeBalanceService.deleteMonthlyMealFees(parseInt(month), parseInt(year));
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.deleteMonthlyMealFees = deleteMonthlyMealFees;
const debugAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentId } = req.params;
        const { month, year } = req.query;
        const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const result = yield mealFeeBalance_service_1.mealFeeBalanceService.debugStudentAttendance(studentId, targetMonth, targetYear);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.debugAttendance = debugAttendance;
const getStudentMealBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentId } = req.params;
        const result = yield mealFeeBalance_service_1.mealFeeBalanceService.getStudentMealBalance(studentId);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.getStudentMealBalance = getStudentMealBalance;
const getAllStudentsMealBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield mealFeeBalance_service_1.mealFeeBalanceService.getAllStudentsMealBalance();
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.getAllStudentsMealBalance = getAllStudentsMealBalance;
