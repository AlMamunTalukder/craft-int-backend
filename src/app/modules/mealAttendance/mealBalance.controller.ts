// app/controllers/mealBalance.controller.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { mealFeeBalanceService } from '../../services/mealFeeBalance.service';
import { Student } from '../student/student.model';
import { Fees } from '../fees/model';


export const fixAprilMealFee = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;

        const result = await mealFeeBalanceService.fixAprilMealFeeForStudent(
            new mongoose.Types.ObjectId(studentId)
        );

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const calculateMonthlyMealBalance = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.body;
        const targetMonth = month || new Date().getMonth() + 1;
        const targetYear = year || new Date().getFullYear();

        const result = await mealFeeBalanceService.calculateAllStudentsMonthlyMealBalance(targetMonth, targetYear);

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getStudentMealBalanceStatus = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findById(studentId)
            .populate('mealAttendances')
            .lean();

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const currentDate = new Date();
        const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
        const currentYear = currentDate.getFullYear();

        const monthlyMeals = (student.mealAttendances || []).filter((attendance: any) => {
            if (!attendance.date) return false;
            const attendanceDate = new Date(attendance.date);
            const attendanceMonth = attendanceDate.toLocaleString('default', { month: 'long' });
            const attendanceYear = attendanceDate.getFullYear();
            return attendanceMonth === currentMonth && attendanceYear === currentYear;
        });

        const actualMealCost = monthlyMeals.reduce((sum: number, meal: any) => sum + (meal.mealCost || 0), 0);

        const mealFee = await Fees.findOne({
            student: studentId,
            month: currentMonth,
            academicYear: currentYear.toString(),
            feeType: 'Meal Fee',
            isLateFeeRecord: { $ne: true }
        });

        const balance = actualMealCost - (mealFee?.amount || 0);

        res.status(200).json({
            success: true,
            data: {
                studentName: student.name,
                studentId: student.studentId,
                currentMonth,
                currentYear,
                actualMealCost,
                mealFeeCharged: mealFee?.amount || 0,
                advanceUsed: mealFee?.advanceUsed || 0,
                dueAmount: mealFee?.dueAmount || 0,
                balance,
                balanceStatus: balance < 0 ? 'Advance' : (balance > 0 ? 'Due' : 'Settled'),
                balanceAmount: Math.abs(balance),
                advanceBalance: student.advanceBalance || 0
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};