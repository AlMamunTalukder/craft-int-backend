// app/modules/mealAttendance/mealBalance.controller.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { mealFeeBalanceService } from '../../services/mealFeeBalance.service';

export const generateMonthlyMealFees = async (req: Request, res: Response) => {
    try {
        const { month, year, mealRate } = req.body;
        const targetMonth = month || new Date().getMonth() + 1;
        const targetYear = year || new Date().getFullYear();
        const rate = mealRate || 55;

        if (targetMonth < 1 || targetMonth > 12) {
            return res.status(400).json({ success: false, message: 'Invalid month (1-12)' });
        }

        const result = await mealFeeBalanceService.generateAllStudentsMealFee(targetMonth, targetYear, rate);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const generateSingleStudentMealFee = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const { month, year, mealRate } = req.body;
        const targetMonth = month || new Date().getMonth() + 1;
        const targetYear = year || new Date().getFullYear();
        const rate = mealRate || 55;

        const result = await mealFeeBalanceService.generateMealFeeForStudent(
            new mongoose.Types.ObjectId(studentId),
            targetMonth,
            targetYear,
            rate
        );
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getStudentMealFees = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const result = await mealFeeBalanceService.getStudentMealFees(studentId);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMonthlyMealFees = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.params;
        const result = await mealFeeBalanceService.getMonthlyMealFees(parseInt(month), parseInt(year));
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const checkMealAttendanceSummary = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query;
        const targetMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
        const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
        const result = await mealFeeBalanceService.getMealAttendanceSummary(targetMonth, targetYear);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteMealFee = async (req: Request, res: Response) => {
    try {
        const { feeId } = req.params;
        const result = await mealFeeBalanceService.deleteMealFee(feeId);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteMonthlyMealFees = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.params;
        const result = await mealFeeBalanceService.deleteMonthlyMealFees(parseInt(month), parseInt(year));
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const debugAttendance = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const { month, year } = req.query;
        const targetMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
        const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
        const result = await mealFeeBalanceService.debugStudentAttendance(studentId, targetMonth, targetYear);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};