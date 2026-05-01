// app/controllers/mealBalance.controller.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { mealFeeBalanceService } from './mealFeeBalance.service';

// মাস শেষে মিল ফি জেনারেট করার জন্য (এডমিন কল করবে)
export const generateMonthlyMealFees = async (req: Request, res: Response) => {
    try {
        const { month, year, mealRate } = req.body;

        // যদি month/year না দেওয়া থাকে তাহলে current month নিবে
        const targetMonth = month || new Date().getMonth() + 1;
        const targetYear = year || new Date().getFullYear();
        const rate = mealRate || 55;

        // ভ্যালিডেশন
        if (targetMonth < 1 || targetMonth > 12) {
            return res.status(400).json({
                success: false,
                message: 'Invalid month. Month must be between 1 and 12'
            });
        }

        if (targetYear < 2000 || targetYear > 2100) {
            return res.status(400).json({
                success: false,
                message: 'Invalid year'
            });
        }

        const result = await mealFeeBalanceService.generateAllStudentsMealFee(
            targetMonth,
            targetYear,
            rate
        );

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// নির্দিষ্ট স্টুডেন্টের জন্য টেস্ট জেনারেশন
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

// নির্দিষ্ট স্টুডেন্টের মিল ফি দেখা
export const getStudentMealFees = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const result = await mealFeeBalanceService.getStudentMealFees(studentId);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// নির্দিষ্ট মাসের সব মিল ফি দেখা
export const getMonthlyMealFees = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.params;
        const result = await mealFeeBalanceService.getMonthlyMealFees(
            parseInt(month),
            parseInt(year)
        );
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// সব স্টুডেন্টের মিল অ্যাটেনডেন্স চেক করা (টেস্টিং এর জন্য)
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

// ডিলিট মিল ফি (টেস্টিং এর জন্য - ভুল জেনারেশন মুছতে)
export const deleteMealFee = async (req: Request, res: Response) => {
    try {
        const { feeId } = req.params;

        const result = await mealFeeBalanceService.deleteMealFee(feeId);

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// নির্দিষ্ট মাসের সব মিল ফি ডিলিট (টেস্টিং এর জন্য)
export const deleteMonthlyMealFees = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.params;

        const result = await mealFeeBalanceService.deleteMonthlyMealFees(
            parseInt(month),
            parseInt(year)
        );

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};