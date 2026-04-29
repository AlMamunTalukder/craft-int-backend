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
                return { success: false, message: `No meal fee found for ${monthName} ${year}` };
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

            // IMPORTANT: ব্যালেন্স ক্যালকুলেশন
            const balance = actualMealCost - chargedAmount;

            console.log(`\n📊 ========================================`);
            console.log(`📊 ${student.name} এর ${monthName} ${year} মাসের মিল ব্যালেন্স`);
            console.log(`📊 ========================================`);
            console.log(`   📌 আসল মিল খরচ: ৳${actualMealCost}`);
            console.log(`   📌 মিল ফি চার্জ: ৳${chargedAmount}`);
            console.log(`   📌 ব্যালেন্স: ৳${balance}`);
            console.log(`   📌 স্ট্যাটাস: ${balance < 0 ? 'অ্যাডভান্স (আগাম টাকা)' : balance > 0 ? 'ডিউ (বাকি টাকা)' : 'সেটেলড'}`);
            console.log(`📊 ========================================\n`);

            if (balance === 0) {
                await session.commitTransaction();
                session.endSession();
                return { success: true, message: 'No balance to adjust', balance: 0 };
            }

            if (balance < 0) {
                // Negative balance = Advance (স্টুডেন্ট বেশি পেমেন্ট করেছে)
                const advanceAmount = Math.abs(balance);

                // বর্তমান ফি রেকর্ড আপডেট করুন - এটাকে advance হিসেবে চিহ্নিত করুন
                currentMealFee.advanceUsed = advanceAmount;
                currentMealFee.paidAmount = advanceAmount;
                currentMealFee.dueAmount = chargedAmount - advanceAmount;
                currentMealFee.status = currentMealFee.dueAmount > 0 ? 'partial' : 'paid';
                await currentMealFee.save({ session });

                // স্টুডেন্টের অ্যাডভান্স ব্যালেন্স আপডেট করুন (পরবর্তী মাসের জন্য)
                const advanceBalance = student.advanceBalance || 0;
                await Student.updateOne(
                    { _id: studentId },
                    { $inc: { advanceBalance: advanceAmount } }
                ).session(session);

                console.log(`💰 ${student.name}:`);
                console.log(`   ✅ ৳${advanceAmount} অ্যাডভান্স হিসেবে সংরক্ষিত হয়েছে`);
                console.log(`   ✅ নতুন অ্যাডভান্স ব্যালেন্স: ৳${advanceBalance + advanceAmount}`);
                console.log(`   ✅ পরবর্তী মাসের মিল ফি থেকে ${advanceAmount} টাকা কাটা হবে`);

                await session.commitTransaction();
                session.endSession();

                return {
                    success: true,
                    message: 'Advance balance added',
                    advanceAmount,
                    newAdvanceBalance: advanceBalance + advanceAmount
                };

            } else {
                // Positive balance = Due (স্টুডেন্ট কম পেমেন্ট করেছে)
                const dueAmount = balance;

                currentMealFee.dueAmount = dueAmount;
                currentMealFee.status = 'partial';
                await currentMealFee.save({ session });

                console.log(`⚠️ ${student.name}:`);
                console.log(`   ⚠️ ৳${dueAmount} ডিউ যোগ করা হয়েছে`);
                console.log(`   ⚠️ স্টুডেন্টকে ${dueAmount} টাকা দিতে হবে`);

                await session.commitTransaction();
                session.endSession();

                return {
                    success: true,
                    message: 'Due amount added',
                    dueAmount
                };
            }

        } catch (error: any) {
            await session.abortTransaction();
            session.endSession();
            console.error('Error calculating meal balance:', error);
            throw error;
        }
    }

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
                    if (result.advanceAmount || result.dueAmount) {
                        results.push({
                            studentName: student.name,
                            ...result
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
            message: `Meal balance calculation completed for ${this.getMonthName(month)} ${year}`,
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