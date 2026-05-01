// app/controllers/mealBalance.controller.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { mealFeeBalanceService } from '../../services/mealFeeBalance.service';
import { Fees } from '../fees/model';
import { Student } from '../student/student.model';


export const calculateMonthlyMealBalance = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.body;
        const targetMonth = month || new Date().getMonth() + 1;
        const targetYear = year || new Date().getFullYear();

        const result = await mealFeeBalanceService.calculateAllStudentsMonthlyMealBalance(targetMonth, targetYear);

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const fixAprilMealFee = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;

        // April মাসের মিল ফি খোঁজা
        const aprilMealFee = await Fees.findOne({
            student: studentId,
            month: 'April',
            academicYear: '2026',
            feeType: 'Meal Fee',
            isLateFeeRecord: { $ne: true }
        });

        if (!aprilMealFee) {
            return res.status(404).json({ success: false, message: 'April meal fee not found' });
        }

        const student = await Student.findById(studentId).populate('mealAttendances');
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // April মাসের মিল অ্যাটেনডেন্স থেকে আসল খরচ বের করা
        const aprilMeals = (student.mealAttendances || []).filter((attendance: any) => {
            if (!attendance.date) return false;
            const date = new Date(attendance.date);
            return date.getMonth() + 1 === 4 && date.getFullYear() === 2026;
        });

        const actualMealCost = aprilMeals.reduce((sum: number, meal: any) => sum + (meal.mealCost || 0), 0);
        const chargedAmount = aprilMealFee.amount;
        const advanceAmount = chargedAmount - actualMealCost;

        if (advanceAmount > 0) {
            // April ফি আপডেট করুন
            aprilMealFee.advanceUsed = advanceAmount;
            aprilMealFee.paidAmount = advanceAmount;
            aprilMealFee.dueAmount = chargedAmount - advanceAmount;
            aprilMealFee.status = 'partial';
            await aprilMealFee.save();

            // স্টুডেন্টের অ্যাডভান্স ব্যালেন্স আপডেট করুন
            await Student.updateOne(
                { _id: studentId },
                { $inc: { advanceBalance: advanceAmount } }
            );

            // May মাসের মিল ফি ডিলিট করুন (পুনরায় জেনারেট হবে)
            await Fees.deleteMany({
                student: studentId,
                month: 'May',
                academicYear: '2026',
                feeType: 'Meal Fee',
                isLateFeeRecord: { $ne: true }
            });

            return res.status(200).json({
                success: true,
                message: `April meal fee fixed: ৳${advanceAmount} advance added`,
                data: {
                    actualMealCost,
                    chargedAmount,
                    advanceAmount
                }
            });
        }

        res.status(200).json({
            success: true,
            message: 'No adjustment needed',
            data: { actualMealCost, chargedAmount, advanceAmount: 0 }
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};