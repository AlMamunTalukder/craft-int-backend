// app/services/mealFeeBalance.service.ts
import mongoose from "mongoose";
import { MealAttendance } from "./model";
import { Student } from "../student/student.model";
import { Fees } from "../fees/model";


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

    async generateMealFeeForStudent(
        studentId: mongoose.Types.ObjectId,
        month: number,
        year: number,
        mealRate: number = 55
    ) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const monthName = this.getMonthName(month);
            const academicYear = year.toString();

            // মাসের জন্য স্টুডেন্টের সব মিল অ্যাটেনডেন্স খোঁজা
            const mealAttendances = await MealAttendance.find({
                student: studentId,
                month: monthName,
                academicYear: academicYear
            }).session(session);

            if (!mealAttendances.length) {
                return {
                    success: false,
                    message: `No meal attendance found for ${monthName} ${year}`
                };
            }

            // টোটাল মিল এবং মিল কস্ট ক্যালকুলেশন
            const totalMeals = mealAttendances.reduce((sum, attendance) => sum + (attendance.totalMeals || 0), 0);
            const totalMealCost = mealAttendances.reduce((sum, attendance) => sum + (attendance.mealCost || 0), 0);

            if (totalMealCost === 0) {
                return {
                    success: false,
                    message: `No meal cost found for ${monthName} ${year}`
                };
            }

            // ইতিমধ্যে এই মাসের মিল ফি আছে কিনা চেক করা
            const existingFee = await Fees.findOne({
                student: studentId,
                month: monthName,
                academicYear: academicYear,
                feeType: 'Meal Fee'
            }).session(session);

            if (existingFee) {
                return {
                    success: false,
                    message: `Meal fee already exists for ${monthName} ${year}`,
                    data: {
                        feeId: existingFee._id,
                        amount: existingFee.amount
                    }
                };
            }

            const student = await Student.findById(studentId).session(session);
            if (!student) {
                return { success: false, message: 'Student not found' };
            }

            // ক্লাস তথ্য পাওয়া
            let studentClass = (student as any).class;
            if (!studentClass && (student as any).className?.length > 0) {
                const classData = (student as any).className[0];
                if (typeof classData === 'object') {
                    studentClass = classData.className || classData.name || '';
                } else {
                    studentClass = String(classData);
                }
            }

            if (!studentClass) {
                studentClass = 'Not Assigned';
            }

            // মিল ফি জেনারেট করা
            const dueDate = new Date(year, month - 1, 15);

            const mealFee = new Fees({
                student: studentId,
                class: studentClass,
                month: monthName,
                amount: totalMealCost,
                paidAmount: 0,
                advanceUsed: 0,
                dueAmount: totalMealCost,
                discount: 0,
                waiver: 0,
                feeType: 'Meal Fee',
                status: 'unpaid',
                academicYear: academicYear,
                isCurrentMonth: month === new Date().getMonth() + 1 && year === new Date().getFullYear(),
                dueDate: dueDate,
                mealCount: totalMeals,
                mealRate: mealRate
            });

            await mealFee.save({ session });

            // স্টুডেন্টের fees এরে আপডেট
            await Student.updateOne(
                { _id: studentId },
                { $push: { fees: mealFee._id } }
            ).session(session);

            console.log(`✅ Meal fee generated for ${(student as any).name}:`);
            console.log(`   📅 Month: ${monthName} ${year}`);
            console.log(`   🍽️ Total Meals: ${totalMeals}`);
            console.log(`   💰 Total Cost: ৳${totalMealCost}`);
            console.log(`   📋 Status: Unpaid`);

            await session.commitTransaction();
            session.endSession();

            return {
                success: true,
                message: `Meal fee generated successfully for ${monthName} ${year}`,
                data: {
                    studentId,
                    studentName: (student as any).name,
                    month: monthName,
                    year,
                    totalMeals,
                    totalMealCost,
                    feeId: mealFee._id,
                    status: 'unpaid'
                }
            };

        } catch (error: any) {
            await session.abortTransaction();
            session.endSession();
            console.error('Error generating meal fee:', error);
            throw error;
        }
    }

    // সব স্টুডেন্টের জন্য মিল ফি জেনারেট করা
    async generateAllStudentsMealFee(month: number, year: number, mealRate: number = 55) {
        const students = await Student.find({
            status: 'active',
            admissionStatus: 'enrolled',
        }).select('_id name');

        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        const results: any[] = [];

        console.log(`\n🍽️ ========== মাসিক মিল ফি জেনারেশন শুরু ==========`);
        console.log(`📅 মাস: ${this.getMonthName(month)} ${year}`);
        console.log(`👨‍🎓 মোট শিক্ষার্থী: ${students.length}`);
        console.log(`💰 মিল রেট: ৳${mealRate}\n`);

        for (const student of students) {
            try {
                const result = await this.generateMealFeeForStudent(student._id, month, year, mealRate);

                if (result.success) {
                    successCount++;
                    results.push(result.data);
                    console.log(`✅ ${result.data.studentName}: ৳${result.data.totalMealCost} (${result.data.totalMeals} meals)`);
                } else if (result.message?.includes('already exists')) {
                    skippedCount++;
                    console.log(`⏭️ ${(student as any).name}: ${result.message}`);
                } else {
                    errorCount++;
                    console.log(`❌ ${(student as any).name}: ${result.message}`);
                }
            } catch (error: any) {
                errorCount++;
                console.error(`❌ Error for student ${(student as any).name}:`, error.message);
            }
        }

        const totalAmount = results.reduce((sum, r) => sum + r.totalMealCost, 0);

        console.log(`\n📊 ========== জেনারেশন সম্পূর্ণ ==========`);
        console.log(`✅ সফল: ${successCount}`);
        console.log(`⏭️ স্কিপড (ইতিমধ্যে আছে): ${skippedCount}`);
        console.log(`❌ ত্রুটি: ${errorCount}`);
        console.log(`💰 মোট ফি পরিমাণ: ৳${totalAmount.toLocaleString()}`);
        console.log(`============================================\n`);

        return {
            success: true,
            message: `Meal fee generation completed for ${this.getMonthName(month)} ${year}`,
            data: {
                month: this.getMonthName(month),
                year,
                mealRate,
                totalStudents: students.length,
                successCount,
                skippedCount,
                errorCount,
                totalAmount,
                generatedFees: results,
                note: "All fees are generated as unpaid. Payment needs to be collected manually."
            }
        };
    }

    // নির্দিষ্ট স্টুডেন্টের মিল ফি দেখা
    async getStudentMealFees(studentId: string) {
        const student = await Student.findById(studentId).select('name');
        if (!student) {
            throw new Error('Student not found');
        }

        const mealFees = await Fees.find({
            student: studentId,
            feeType: 'Meal Fee'
        }).sort({ createdAt: -1 });

        return {
            studentName: (student as any).name,
            mealFees
        };
    }

    // নির্দিষ্ট মাসের মিল ফি দেখা
    async getMonthlyMealFees(month: number, year: number) {
        const monthName = this.getMonthName(month);
        const academicYear = year.toString();

        const mealFees = await Fees.find({
            month: monthName,
            academicYear: academicYear,
            feeType: 'Meal Fee'
        }).populate('student', 'name studentId');

        const totalAmount = mealFees.reduce((sum, fee) => sum + fee.amount, 0);
        const totalPaid = mealFees.reduce((sum, fee) => sum + fee.paidAmount, 0);
        const totalDue = mealFees.reduce((sum, fee) => sum + (fee.dueAmount || fee.amount), 0);

        return {
            month: monthName,
            year,
            totalStudents: mealFees.length,
            totalAmount,
            totalPaid,
            totalDue,
            fees: mealFees
        };
    }

    // মিল অ্যাটেনডেন্স সামারি (টেস্টিং এর জন্য)
    async getMealAttendanceSummary(month: number, year: number) {
        const monthName = this.getMonthName(month);
        const academicYear = year.toString();

        const students = await Student.find({
            status: 'active',
            admissionStatus: 'enrolled',
        }).select('_id name');

        const summary = [];

        for (const student of students) {
            const mealAttendances = await MealAttendance.find({
                student: student._id,
                month: monthName,
                academicYear: academicYear
            });

            const totalMeals = mealAttendances.reduce((sum, a) => sum + (a.totalMeals || 0), 0);
            const totalCost = mealAttendances.reduce((sum, a) => sum + (a.mealCost || 0), 0);

            // চেক করা এই মাসের ফি ইতিমধ্যে জেনারেট হয়েছে কিনা
            const existingFee = await Fees.findOne({
                student: student._id,
                month: monthName,
                academicYear: academicYear,
                feeType: 'Meal Fee'
            });

            summary.push({
                studentId: student._id,
                studentName: (student as any).name,
                totalMeals,
                totalCost,
                feeGenerated: !!existingFee,
                feeId: existingFee?._id,
                feeAmount: existingFee?.amount
            });
        }

        const totalCostAll = summary.reduce((sum, s) => sum + s.totalCost, 0);
        const generatedFees = summary.filter(s => s.feeGenerated);
        const generatedAmount = generatedFees.reduce((sum, s) => sum + (s.feeAmount || 0), 0);

        return {
            month: monthName,
            year,
            totalStudents: students.length,
            totalMealCost: totalCostAll,
            studentsWithFees: generatedFees.length,
            totalGeneratedAmount: generatedAmount,
            studentsWithoutFees: summary.filter(s => !s.feeGenerated).length,
            details: summary
        };
    }

    // ডিলিট মিল ফি (টেস্টিং এর জন্য)
    async deleteMealFee(feeId: string) {
        const fee = await Fees.findById(feeId);

        if (!fee) {
            return { success: false, message: 'Fee not found' };
        }

        if (fee.feeType !== 'Meal Fee') {
            return { success: false, message: 'This is not a meal fee' };
        }

        // স্টুডেন্টের fees array থেকে রিমুভ করা
        await Student.updateOne(
            { _id: fee.student },
            { $pull: { fees: fee._id } }
        );

        // ফি ডিলিট করা
        await Fees.deleteOne({ _id: feeId });

        return {
            success: true,
            message: `Meal fee for ${fee.month} deleted successfully`,
            data: {
                feeId,
                studentId: fee.student,
                month: fee.month,
                amount: fee.amount
            }
        };
    }

    // নির্দিষ্ট মাসের সব মিল ফি ডিলিট (টেস্টিং এর জন্য)
    async deleteMonthlyMealFees(month: number, year: number) {
        const monthName = this.getMonthName(month);
        const academicYear = year.toString();

        const fees = await Fees.find({
            month: monthName,
            academicYear: academicYear,
            feeType: 'Meal Fee'
        });

        if (fees.length === 0) {
            return { success: false, message: `No meal fees found for ${monthName} ${year}` };
        }

        // সবার fees array থেকে রিমুভ করা
        for (const fee of fees) {
            await Student.updateOne(
                { _id: fee.student },
                { $pull: { fees: fee._id } }
            );
        }

        // সব ফি ডিলিট করা
        const result = await Fees.deleteMany({
            month: monthName,
            academicYear: academicYear,
            feeType: 'Meal Fee'
        });

        return {
            success: true,
            message: `${result.deletedCount} meal fees deleted for ${monthName} ${year}`,
            data: {
                month: monthName,
                year,
                deletedCount: result.deletedCount
            }
        };
    }
}

export const mealFeeBalanceService = MealFeeBalanceService.getInstance();