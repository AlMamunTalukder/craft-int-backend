// app/services/mealFeeBalance.service.ts
import mongoose from "mongoose";
import { Student } from "../modules/student/student.model";
import { Fees } from "../modules/fees/model";

export class MealFeeBalanceService {
    private static instance: MealFeeBalanceService;

    static getInstance(): MealFeeBalanceService {
        if (!MealFeeBalanceService.instance) {
            MealFeeBalanceService.instance = new MealFeeBalanceService();
        }
        return MealFeeBalanceService.instance;
    }

    private getMonthName(month: number): string {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[month - 1];
    }

    // একটি নির্দিষ্ট মাসের মিল ব্যালেন্স ক্যালকুলেট এবং অ্যাডজাস্ট করুন
    async calculateAndAdjustMonthlyMealBalance(studentId: mongoose.Types.ObjectId, month: number, year: number) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const monthName = this.getMonthName(month);

            // 1. বর্তমান মাসের মিল ফি রেকর্ড পাওয়া
            const currentMealFee = await Fees.findOne({
                student: studentId,
                month: monthName,
                academicYear: year.toString(),
                feeType: 'Meal Fee',
                isLateFeeRecord: { $ne: true }
            }).session(session);

            if (!currentMealFee) {
                return { success: false, message: 'Meal fee not found for this month' };
            }

            // 2. স্টুডেন্টের এই মাসের মিল অ্যাটেনডেন্স পাওয়া
            const student = await Student.findById(studentId)
                .populate('mealAttendances')
                .session(session);

            if (!student) {
                return { success: false, message: 'Student not found' };
            }

            // 3. এই মাসের মিল অ্যাটেনডেন্স ফিল্টার করে মোট খরচ বের করা
            const monthlyMeals = (student.mealAttendances || []).filter((attendance: any) => {
                if (!attendance.date) return false;
                const attendanceDate = new Date(attendance.date);
                const attendanceMonth = attendanceDate.toLocaleString('default', { month: 'long' });
                const attendanceYear = attendanceDate.getFullYear();
                return attendanceMonth === monthName && attendanceYear === year;
            });

            const actualMealCost = monthlyMeals.reduce((sum: number, meal: any) => sum + (meal.mealCost || 0), 0);

            // 4. বর্তমান ফি রেকর্ডের তথ্য
            const chargedAmount = currentMealFee.amount;
            const alreadyAdvanceUsed = currentMealFee.advanceUsed || 0;

            // 5. নেট চার্জ এবং ব্যালেন্স ক্যালকুলেশন
            const netCharged = chargedAmount - alreadyAdvanceUsed;
            const balance = actualMealCost - netCharged;

            console.log(`\n📊 ${student.name} এর ${monthName} ${year} মাসের মিল ব্যালেন্স:`);
            console.log(`   - আসল মিল খরচ: ৳${actualMealCost}`);
            console.log(`   - মিল ফি চার্জ: ৳${chargedAmount}`);
            console.log(`   - ইতিমধ্যে অ্যাডভান্স ইউজড: ৳${alreadyAdvanceUsed}`);
            console.log(`   - নেট চার্জ: ৳${netCharged}`);
            console.log(`   - ব্যালেন্স: ৳${balance}`);

            if (balance === 0) {
                await session.commitTransaction();
                session.endSession();
                return { success: true, message: 'No balance to adjust', balance: 0 };
            }

            if (balance < 0) {
                // Negative balance = Advance (স্টুডেন্ট বেশি পেমেন্ট করেছে)
                const advanceAmount = Math.abs(balance);

                // বর্তমান ফি রেকর্ড আপডেট করুন
                currentMealFee.advanceUsed = alreadyAdvanceUsed + advanceAmount;
                currentMealFee.paidAmount = alreadyAdvanceUsed + advanceAmount;
                currentMealFee.dueAmount = chargedAmount - (alreadyAdvanceUsed + advanceAmount);

                if (currentMealFee.dueAmount <= 0) {
                    currentMealFee.status = 'paid';
                    currentMealFee.dueAmount = 0;
                } else {
                    currentMealFee.status = 'partial';
                }

                await currentMealFee.save({ session });

                // স্টুডেন্টের অ্যাডভান্স ব্যালেন্স আপডেট
                await Student.updateOne(
                    { _id: studentId },
                    { $inc: { advanceBalance: advanceAmount } }
                ).session(session);

                console.log(`💰 ${student.name}: ৳${advanceAmount} অ্যাডভান্স হিসেবে সংরক্ষিত হয়েছে`);
                console.log(`   - নতুন ফি স্ট্যাটাস: ${currentMealFee.status}`);
                console.log(`   - ডিউ অ্যামাউন্ট: ৳${currentMealFee.dueAmount}`);

                await session.commitTransaction();
                session.endSession();

                return {
                    success: true,
                    message: 'Advance balance added',
                    balance,
                    advanceAmount,
                    newDueAmount: currentMealFee.dueAmount
                };

            } else {
                // Positive balance = Due (স্টুডেন্ট কম পেমেন্ট করেছে)
                const dueAmount = balance;

                // বর্তমান ফি রেকর্ড আপডেট করুন
                currentMealFee.dueAmount = currentMealFee.dueAmount + dueAmount;
                currentMealFee.status = 'partial';

                await currentMealFee.save({ session });

                console.log(`⚠️ ${student.name}: ৳${dueAmount} ডিউ যোগ করা হয়েছে`);
                console.log(`   - নতুন ডিউ অ্যামাউন্ট: ৳${currentMealFee.dueAmount}`);

                await session.commitTransaction();
                session.endSession();

                return {
                    success: true,
                    message: 'Due amount added',
                    balance,
                    dueAmount,
                    newDueAmount: currentMealFee.dueAmount
                };
            }

        } catch (error: any) {
            await session.abortTransaction();
            session.endSession();
            console.error('Error calculating meal balance:', error);
            throw error;
        }
    }

    // সব স্টুডেন্টের মিল ব্যালেন্স ক্যালকুলেট করুন
    async calculateAllStudentsMonthlyMealBalance(month: number, year: number) {
        const students = await Student.find({
            status: 'active',
            admissionStatus: 'enrolled',
        }).select('_id name');

        let successCount = 0;
        let errorCount = 0;
        const results = [];

        for (const student of students) {
            try {
                const result = await this.calculateAndAdjustMonthlyMealBalance(student._id, month, year);
                if (result.success) {
                    successCount++;
                    if (result.balance && result.balance !== 0) {
                        results.push({
                            studentName: student.name,
                            balance: result.balance,
                            message: result.message,
                            newDueAmount: result.newDueAmount
                        });
                    }
                } else {
                    errorCount++;
                }
            } catch (error) {
                errorCount++;
                console.error(`Error for student ${student.name}:`, error);
            }
        }

        return {
            success: true,
            message: `Meal balance calculation completed for ${month}/${year}`,
            data: {
                totalStudents: students.length,
                successCount,
                errorCount,
                adjustments: results
            }
        };
    }
}

export const mealFeeBalanceService = MealFeeBalanceService.getInstance();