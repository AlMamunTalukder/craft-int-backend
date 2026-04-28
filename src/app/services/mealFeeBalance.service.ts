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

            const student = await Student.findById(studentId)
                .populate('mealAttendances')
                .session(session);

            if (!student) {
                return { success: false, message: 'Student not found' };
            }

            const monthlyMeals = (student.mealAttendances || []).filter((attendance: any) => {
                if (!attendance.date) return false;
                const attendanceDate = new Date(attendance.date);
                const attendanceMonth = attendanceDate.toLocaleString('default', { month: 'long' });
                const attendanceYear = attendanceDate.getFullYear();
                return attendanceMonth === monthName && attendanceYear === year;
            });

            const actualMealCost = monthlyMeals.reduce((sum: number, meal: any) => sum + (meal.mealCost || 0), 0);
            const chargedAmount = currentMealFee.amount;
            const alreadyPaid = currentMealFee.paidAmount || 0;
            const alreadyAdvanceUsed = currentMealFee.advanceUsed || 0;
            const netCharged = chargedAmount - alreadyAdvanceUsed;
            const balance = actualMealCost - netCharged;

            console.log(`\n📊 ${student.name} এর ${monthName} ${year} মাসের মিল ব্যালেন্স:`);
            console.log(`   - আসল মিল খরচ: ৳${actualMealCost}`);
            console.log(`   - মিল ফি চার্জ: ৳${chargedAmount}`);
            console.log(`   - ইতিমধ্যে পরিশোধিত: ৳${alreadyPaid}`);
            console.log(`   - ইতিমধ্যে অ্যাডভান্স ইউজড: ৳${alreadyAdvanceUsed}`);
            console.log(`   - নেট চার্জ: ৳${netCharged}`);
            console.log(`   - ব্যালেন্স: ৳${balance}`);

            if (balance === 0) {
                await session.commitTransaction();
                session.endSession();
                return { success: true, message: 'No balance to adjust', balance: 0 };
            }

            if (balance < 0) {
                const advanceAmount = Math.abs(balance);
                const newAdvanceUsed = alreadyAdvanceUsed + advanceAmount;
                const newPaidAmount = alreadyPaid + advanceAmount;
                const newDueAmount = chargedAmount - newPaidAmount - (currentMealFee.discount || 0);

                currentMealFee.advanceUsed = newAdvanceUsed;
                currentMealFee.paidAmount = newPaidAmount;
                currentMealFee.dueAmount = newDueAmount > 0 ? newDueAmount : 0;

                if (currentMealFee.dueAmount <= 0) {
                    currentMealFee.status = 'paid';
                } else if (currentMealFee.dueAmount < chargedAmount) {
                    currentMealFee.status = 'partial';
                }

                await currentMealFee.save({ session });

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
                const dueAmount = balance;
                const newDueAmount = (currentMealFee.dueAmount || 0) + dueAmount;
                currentMealFee.dueAmount = newDueAmount;
                currentMealFee.status = 'partial';

                await currentMealFee.save({ session });

                console.log(`⚠️ ${student.name}: ৳${dueAmount} ডিউ যোগ করা হয়েছে`);
                console.log(`   - নতুন ডিউ অ্যামাউন্ট: ৳${newDueAmount}`);

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

    // এপ্রিল মাসের ভুল ফি ঠিক করার জন্য (একবার চালান)
    async fixAprilMealFeeForStudent(studentId: mongoose.Types.ObjectId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const aprilMealFee = await Fees.findOne({
                student: studentId,
                month: 'April',
                academicYear: '2026',
                feeType: 'Meal Fee',
                isLateFeeRecord: { $ne: true }
            }).session(session);

            if (!aprilMealFee) {
                return { success: false, message: 'April meal fee not found' };
            }

            const student = await Student.findById(studentId)
                .populate('mealAttendances')
                .session(session);

            if (!student) {
                return { success: false, message: 'Student not found' };
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
                aprilMealFee.advanceUsed = advanceAmount;
                aprilMealFee.paidAmount = advanceAmount;
                aprilMealFee.dueAmount = chargedAmount - advanceAmount;
                aprilMealFee.status = advanceAmount >= chargedAmount ? 'paid' : 'partial';
                await aprilMealFee.save({ session });

                await Student.updateOne(
                    { _id: studentId },
                    { $inc: { advanceBalance: advanceAmount } }
                ).session(session);

                await Fees.deleteMany({
                    student: studentId,
                    month: 'May',
                    academicYear: '2026',
                    feeType: 'Meal Fee',
                    isLateFeeRecord: { $ne: true }
                }).session(session);

                await session.commitTransaction();
                session.endSession();

                return {
                    success: true,
                    message: `April advance fixed: ৳${advanceAmount} added to advance balance`,
                    data: {
                        actualMealCost,
                        chargedAmount,
                        advanceAmount,
                        newAdvanceBalance: advanceAmount
                    }
                };
            }

            await session.commitTransaction();
            session.endSession();

            return {
                success: true,
                message: 'No adjustment needed',
                data: { actualMealCost, chargedAmount, advanceAmount: 0 }
            };

        } catch (error: any) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }
}

export const mealFeeBalanceService = MealFeeBalanceService.getInstance();