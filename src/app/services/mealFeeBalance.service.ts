
import mongoose from "mongoose";
import { Student } from "../modules/student/student.model";
import { Fees } from "../modules/fees/model";

interface IMealBalance {
    studentId: mongoose.Types.ObjectId;
    month: string;
    year: number;
    totalMealCost: number;
    mealFeePaid: number;
    mealFeeDue: number;
    balanceCarryForward: number;
    adjustmentApplied: boolean;
}

export class MealFeeBalanceService {
    private static instance: MealFeeBalanceService;

    static getInstance(): MealFeeBalanceService {
        if (!MealFeeBalanceService.instance) {
            MealFeeBalanceService.instance = new MealFeeBalanceService();
        }
        return MealFeeBalanceService.instance;
    }
    async calculateMealBalance(studentId: mongoose.Types.ObjectId, month: string, year: number): Promise<IMealBalance | null> {
        try {

            const student = await Student.findById(studentId)
                .populate('mealAttendances')
                .lean();

            if (!student) return null;
            const monthlyMeals = (student.mealAttendances || []).filter((attendance: any) => {
                const attendanceDate = new Date(attendance.date);
                return attendanceDate.getMonth() + 1 === year && attendanceDate.getFullYear() === year;
            });
            const totalMealCost = monthlyMeals.reduce((sum: number, meal: any) => sum + (meal.mealCost || 0), 0);
            const mealFee = await Fees.findOne({
                student: studentId,
                month: month,
                academicYear: year.toString(),
                feeType: 'Meal Fee',
                isLateFeeRecord: { $ne: true }
            });

            if (!mealFee) return null;

            const previousBalance = await this.getPreviousMonthBalance(studentId, month, year);

            const actualMealCost = totalMealCost;
            const mealFeeAmount = mealFee.amount;

            let balance = actualMealCost - mealFeeAmount + previousBalance;
            const isMealPaid = mealFee.paidAmount >= mealFeeAmount;
            let adjustment = 0;
            let mealFeeDue = mealFee.dueAmount;

            if (balance < 0 && isMealPaid) {
                adjustment = Math.abs(balance);
                balance = 0;
                mealFeeDue = 0;
            } else if (balance > 0) {
                adjustment = -balance;
            }

            return {
                studentId,
                month,
                year,
                totalMealCost: actualMealCost,
                mealFeePaid: mealFee.paidAmount,
                mealFeeDue,
                balanceCarryForward: balance >= 0 ? balance : 0,
                adjustmentApplied: balance !== 0
            };

        } catch (error: any) {
            console.error('Error calculating meal balance:', error);
            return null;
        }
    }
    private async getPreviousMonthBalance(studentId: mongoose.Types.ObjectId, currentMonth: string, currentYear: number): Promise<number> {
        try {
            const months = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];

            const currentMonthIndex = months.indexOf(currentMonth);
            let previousMonthName = '';
            let previousYear = currentYear;

            if (currentMonthIndex === 0) {
                previousMonthName = months[11];
                previousYear = currentYear - 1;
            } else {
                previousMonthName = months[currentMonthIndex - 1];
                previousYear = currentYear;
            }
            const previousMealFee = await Fees.findOne({
                student: studentId,
                month: previousMonthName,
                academicYear: previousYear.toString(),
                feeType: 'Meal Fee',
                isLateFeeRecord: { $ne: true }
            });

            if (!previousMealFee) return 0;
            const previousBalance = await this.getStudentMealBalance(studentId, previousMonthName, previousYear);

            return previousBalance || 0;

        } catch (error) {
            return 0;
        }
    }
    async getStudentMealBalance(studentId: mongoose.Types.ObjectId, month: string, year: number): Promise<number> {
        try {
            const student = await Student.findById(studentId)
                .populate('mealAttendances')
                .lean();

            if (!student) return 0;

            const monthlyMeals = (student.mealAttendances || []).filter((attendance: any) => {
                const attendanceDate = new Date(attendance.date);
                return attendanceDate.getMonth() + 1 === year &&
                    attendanceDate.getFullYear() === year &&
                    attendanceDate.toLocaleString('default', { month: 'long' }) === month;
            });

            const totalMealCost = monthlyMeals.reduce((sum: number, meal: any) => sum + (meal.mealCost || 0), 0);

            const mealFee = await Fees.findOne({
                student: studentId,
                month: month,
                academicYear: year.toString(),
                feeType: 'Meal Fee',
                isLateFeeRecord: { $ne: true }
            });

            if (!mealFee) return 0;

            const balance = totalMealCost - mealFee.paidAmount;

            return balance > 0 ? balance : 0;

        } catch (error) {
            return 0;
        }
    }
    async adjustNextMonthMealFee(studentId: mongoose.Types.ObjectId, currentMonth: string, currentYear: number) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const balance = await this.calculateMealBalance(studentId, currentMonth, currentYear);

            if (!balance || balance.balanceCarryForward === 0) {
                return { success: true, message: 'No balance to adjust' };
            }


            const months = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];

            const currentMonthIndex = months.indexOf(currentMonth);
            let nextMonthName = '';
            let nextYear = currentYear;

            if (currentMonthIndex === 11) {
                nextMonthName = months[0];
                nextYear = currentYear + 1;
            } else {
                nextMonthName = months[currentMonthIndex + 1];
                nextYear = currentYear;
            }
            const nextMonthMealFee = await Fees.findOne({
                student: studentId,
                month: nextMonthName,
                academicYear: nextYear.toString(),
                feeType: 'Meal Fee',
                isLateFeeRecord: { $ne: true }
            }).session(session);

            if (!nextMonthMealFee) {
                return { success: false, message: 'Next month meal fee not found' };
            }

            const adjustedAmount = nextMonthMealFee.amount - balance.balanceCarryForward;
            await Student.updateOne(
                { _id: studentId },
                {
                    $inc: {
                        advanceBalance: balance.balanceCarryForward
                    },
                    $push: {
                        paymentHistory: {
                            amount: balance.balanceCarryForward,
                            type: 'Meal Fee Adjustment',
                            month: currentMonth,
                            year: currentYear,
                            date: new Date()
                        }
                    }
                }
            ).session(session);

            nextMonthMealFee.discount = (nextMonthMealFee.discount || 0) + balance.balanceCarryForward;
            nextMonthMealFee.dueAmount = nextMonthMealFee.amount - nextMonthMealFee.paidAmount - nextMonthMealFee.discount;

            if (nextMonthMealFee.dueAmount < 0) {
                nextMonthMealFee.dueAmount = 0;
            }

            await nextMonthMealFee.save({ session });

            await session.commitTransaction();
            session.endSession();

            return {
                success: true,
                message: `Balance ৳${balance.balanceCarryForward} adjusted to next month's meal fee`,
                data: {
                    adjustedAmount,
                    balanceCarried: balance.balanceCarryForward,
                    nextMonth: nextMonthName,
                    nextYear
                }
            };

        } catch (error: any) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }
}

export const mealFeeBalanceService = MealFeeBalanceService.getInstance();