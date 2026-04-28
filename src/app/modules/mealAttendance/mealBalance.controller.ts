
import { Request, Response } from 'express';
import { mealFeeBalanceService } from '../../services/mealFeeBalance.service';
import { Student } from '../student/student.model';
import { Fees } from '../fees/model';

export const manualMealBalanceCalculation = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.body;
        const targetMonth = month || new Date().getMonth() + 1;
        const targetYear = year || new Date().getFullYear();

        console.log(`🔄 ম্যানুয়াল মিল ব্যালেন্স ক্যালকুলেশন শুরু: ${targetMonth}/${targetYear}`);

        const result = await mealFeeBalanceService.calculateAllStudentsMonthlyMealBalance(targetMonth, targetYear);

        res.status(200).json({
            success: true,
            message: `${targetMonth}/${targetYear} মাসের মিল ব্যালেন্স ক্যালকুলেশন সম্পন্ন`,
            data: result.data
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const fixAprilMealFee = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;

        // এপ্রিল মাসের মিল ফি রেকর্ড
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

        // স্টুডেন্টের এপ্রিল মাসের মিল অ্যাটেনডেন্স থেকে আসল খরচ বের করুন
        const student = await Student.findById(studentId).populate('mealAttendances').lean();
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const aprilMeals = (student.mealAttendances || []).filter((attendance: any) => {
            if (!attendance.date) return false;
            const date = new Date(attendance.date);
            return date.getMonth() + 1 === 4 && date.getFullYear() === 2026;
        });

        const actualMealCost = aprilMeals.reduce((sum: number, meal: any) => sum + (meal.mealCost || 0), 0);
        const chargedAmount = aprilMealFee.amount;
        const advanceAmount = chargedAmount - actualMealCost;

        if (advanceAmount > 0) {
            // এপ্রিলের অ্যাডভান্স স্টুডেন্টের অ্যাকাউন্টে যোগ করুন
            await Student.updateOne(
                { _id: studentId },
                { $inc: { advanceBalance: advanceAmount } }
            );

            // এপ্রিলের ফি রেকর্ড আপডেট করুন
            aprilMealFee.advanceUsed = advanceAmount;
            aprilMealFee.paidAmount = advanceAmount;
            aprilMealFee.dueAmount = chargedAmount - advanceAmount;
            aprilMealFee.status = advanceAmount >= chargedAmount ? 'paid' : 'partial';
            await aprilMealFee.save();

            // মে মাসের ফি রেকর্ড খুঁজে বের করে সেটা ডিলিট বা আপডেট করুন
            const mayMealFee = await Fees.findOne({
                student: studentId,
                month: 'May',
                academicYear: '2026',
                feeType: 'Meal Fee',
                isLateFeeRecord: { $ne: true }
            });

            if (mayMealFee) {
                // মে মাসের ফি ডিলিট করে দিন (আবার জেনারেট হবে)
                await Fees.deleteOne({ _id: mayMealFee._id });
            }

            return res.status(200).json({
                success: true,
                message: `April advance fixed: ৳${advanceAmount} added to student balance`,
                data: {
                    actualMealCost,
                    chargedAmount,
                    advanceAmount,
                    newAdvanceBalance: advanceAmount
                }
            });
        }

        res.status(200).json({
            success: true,
            message: 'No adjustment needed',
            data: { actualMealCost, chargedAmount, advanceAmount: 0 }
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};