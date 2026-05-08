// app/modules/mealAttendance/mealFeeBalance.service.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import { Student } from "../modules/student/student.model";
import { Fees } from "../modules/fees/model";
import { MealAttendance } from "../modules/mealAttendance/model";

export class MealFeeBalanceService {
    private static instance: MealFeeBalanceService;

    static getInstance(): MealFeeBalanceService {
        if (!MealFeeBalanceService.instance) {
            MealFeeBalanceService.instance = new MealFeeBalanceService();
        }
        return MealFeeBalanceService.instance;
    }

    // ✅ Convert month number to YYYY-MM format
    private getMonthFormat(month: number, year: number): string {
        const monthStr = month.toString().padStart(2, '0');
        return `${year}-${monthStr}`;
    }

    // ✅ Convert month number to name (for display only)
    private getMonthName(month: number): string {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return monthNames[month - 1];
    }

    private resolveStudentClass(student: any): string {
        if (student.class && typeof student.class === 'string' && student.class.trim()) {
            return student.class.trim();
        }
        if (student.className && Array.isArray(student.className) && student.className.length > 0) {
            const first = student.className[0];
            if (first && typeof first === 'object') {
                return first.className || first.name || 'Not Assigned';
            }
            if (first) return String(first);
        }
        return 'Not Assigned';
    }

    /**
     * Generate meal fee for a single student (using actual attendance data)
     */
    async generateMealFeeForStudent(
        studentId: mongoose.Types.ObjectId,
        month: number,
        year: number,
        mealRate: number = 55
    ) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const monthFormat = this.getMonthFormat(month, year); // "2026-05"
            const monthName = this.getMonthName(month);
            const academicYear = year.toString();

            console.log(`🔍 Searching attendance: student=${studentId}, month=${monthFormat}, year=${academicYear}`);

            // ✅ Find attendance records using YYYY-MM format
            const mealAttendances = await MealAttendance.find({
                student: studentId,
                month: monthFormat,
                academicYear: academicYear,
            }).session(session);

            console.log(`   Found ${mealAttendances.length} attendance records`);

            if (!mealAttendances.length) {
                await session.abortTransaction();
                session.endSession();
                return {
                    success: false,
                    message: `No meal attendance found for ${monthName} ${year}`,
                };
            }

            // Calculate total meals and cost from attendance
            const totalMeals = mealAttendances.reduce((sum, a) => sum + (a.totalMeals || 0), 0);
            const totalMealCost = mealAttendances.reduce((sum, a) => sum + (a.mealCost || 0), 0);

            console.log(`   Total Meals: ${totalMeals}, Total Cost: ৳${totalMealCost}`);

            if (totalMeals === 0) {
                await session.abortTransaction();
                session.endSession();
                return {
                    success: false,
                    message: `No meals taken in ${monthName} ${year}`,
                };
            }

            // Check if fee already exists
            const existingFee = await Fees.findOne({
                student: studentId,
                month: monthName,
                academicYear: academicYear,
                feeType: 'Meal Fee',
            }).session(session);

            if (existingFee) {
                await session.abortTransaction();
                session.endSession();
                return {
                    success: false,
                    message: `Meal fee already exists for ${monthName} ${year}`,
                    data: { feeId: existingFee._id, amount: existingFee.amount },
                };
            }

            // Get student details
            const student = await Student.findById(studentId).session(session);
            if (!student) {
                await session.abortTransaction();
                session.endSession();
                return { success: false, message: 'Student not found' };
            }

            const studentClass = this.resolveStudentClass(student);
            const now = new Date();
            const dueDate = new Date(year, month - 1, 15);
            const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

            // Handle advance balance
            const advanceBalance = student.advanceBalance || 0;
            let advanceUsed = 0;
            let paidAmount = 0;
            let finalDueAmount = totalMealCost;
            let status = 'unpaid';

            if (advanceBalance > 0) {
                const advanceToUse = Math.min(advanceBalance, totalMealCost);
                advanceUsed = advanceToUse;
                paidAmount = advanceToUse;
                finalDueAmount = totalMealCost - advanceToUse;

                await Student.updateOne(
                    { _id: studentId },
                    { $inc: { advanceBalance: -advanceToUse } }
                ).session(session);

                console.log(`   💰 Advance used: ৳${advanceToUse}, Remaining due: ৳${finalDueAmount}`);
            }

            if (finalDueAmount <= 0) {
                status = 'paid';
                finalDueAmount = 0;
            }

            // Create meal fee
            const mealFee = new Fees({
                student: studentId,
                class: studentClass,
                month: monthName,
                amount: totalMealCost,
                paidAmount: paidAmount,
                advanceUsed: advanceUsed,
                dueAmount: finalDueAmount,
                discount: 0,
                waiver: 0,
                feeType: 'Meal Fee',
                status: status,
                academicYear: academicYear,
                isCurrentMonth: isCurrentMonth,
                dueDate: dueDate,
                mealCount: totalMeals,
                mealRate: mealRate,
            });

            await mealFee.save({ session });

            await Student.updateOne(
                { _id: studentId },
                { $addToSet: { fees: mealFee._id } }
            ).session(session);

            await session.commitTransaction();
            session.endSession();

            console.log(`✅ Generated: ${student.name} - ${totalMeals} meals = ৳${totalMealCost}`);

            return {
                success: true,
                message: `Meal fee generated for ${monthName} ${year}`,
                data: {
                    studentId: studentId,
                    studentName: student.name,
                    studentClass: studentClass,
                    month: monthName,
                    year: year,
                    totalMeals: totalMeals,
                    totalMealCost: totalMealCost,
                    advanceUsed: advanceUsed,
                    paidAmount: paidAmount,
                    dueAmount: finalDueAmount,
                    feeId: mealFee._id,
                    status: status,
                    dueDate: dueDate,
                },
            };

        } catch (error: any) {
            await session.abortTransaction();
            session.endSession();
            console.error('Error generating meal fee:', error);
            throw error;
        }
    }

    /**
     * Generate meal fees for all active students
     */
    async generateAllStudentsMealFee(month: number, year: number, mealRate: number = 55) {
        const monthName = this.getMonthName(month);
        const monthFormat = this.getMonthFormat(month, year);
        const academicYear = year.toString();

        // Get all active students
        const students = await Student.find({
            status: 'active',
            admissionStatus: 'enrolled',
        }).select('_id name advanceBalance class className');

        console.log(`\n🍽️ ===== Generating Meal Fees: ${monthName} ${year} =====`);
        console.log(`Total Students: ${students.length} | Meal Rate: ৳${mealRate}`);
        console.log(`Month Format: ${monthFormat}\n`);

        let successCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        const results: any[] = [];
        const errors: any[] = [];

        for (const student of students) {
            try {
                // First check if student has attendance for this month
                const attendanceCount = await MealAttendance.countDocuments({
                    student: student._id,
                    month: monthFormat,
                    academicYear: academicYear,
                });

                if (attendanceCount === 0) {
                    errorCount++;
                    errors.push({
                        studentId: student._id,
                        studentName: student.name,
                        reason: `No meal attendance found for ${monthName} ${year}`,
                    });
                    console.log(`❌ ${student.name}: No attendance records`);
                    continue;
                }

                const result = await this.generateMealFeeForStudent(
                    student._id as mongoose.Types.ObjectId,
                    month,
                    year,
                    mealRate
                );

                if (result.success) {
                    successCount++;
                    results.push(result.data);
                } else if (result.message?.includes('already exists')) {
                    skippedCount++;
                    console.log(`⏭️ ${student.name}: Already exists`);
                } else {
                    errorCount++;
                    errors.push({
                        studentId: student._id,
                        studentName: student.name,
                        reason: result.message,
                    });
                    console.log(`❌ ${student.name}: ${result.message}`);
                }
            } catch (error: any) {
                errorCount++;
                errors.push({
                    studentId: student._id,
                    studentName: student.name,
                    reason: error.message,
                });
                console.error(`❌ ${student.name}:`, error.message);
            }
        }

        const totalAmount = results.reduce((sum, r) => sum + r.totalMealCost, 0);
        const totalAdvanceUsed = results.reduce((sum, r) => sum + (r.advanceUsed || 0), 0);
        const totalDue = results.reduce((sum, r) => sum + (r.dueAmount || 0), 0);

        console.log(`\n📊 ===== Summary =====`);
        console.log(`✅ Success: ${successCount} | ⏭️ Skipped: ${skippedCount} | ❌ Errors: ${errorCount}`);
        console.log(`💰 Total Amount: ৳${totalAmount.toLocaleString()}`);
        console.log(`💵 Total Due: ৳${totalDue.toLocaleString()}\n`);

        return {
            success: true,
            message: `Meal fee generation completed for ${monthName} ${year}`,
            data: {
                month: monthName,
                year: year,
                mealRate: mealRate,
                totalStudents: students.length,
                successCount: successCount,
                skippedCount: skippedCount,
                errorCount: errorCount,
                totalAmount: totalAmount,
                totalAdvanceUsed: totalAdvanceUsed,
                totalDue: totalDue,
                generatedFees: results,
                errors: errors,
            },
        };
    }

    /**
     * Get student's all meal fees
     */
    async getStudentMealFees(studentId: string) {
        const student = await Student.findById(studentId).select('name studentId');
        if (!student) throw new Error('Student not found');

        const mealFees = await Fees.find({
            student: studentId,
            feeType: 'Meal Fee',
        }).sort({ createdAt: -1 });

        return {
            studentId: studentId,
            studentName: student.name,
            studentCode: (student as any).studentId,
            totalFees: mealFees.length,
            totalAmount: mealFees.reduce((sum, f) => sum + f.amount, 0),
            totalPaid: mealFees.reduce((sum, f) => sum + f.paidAmount, 0),
            totalDue: mealFees.reduce((sum, f) => sum + (f.dueAmount || f.amount), 0),
            fees: mealFees,
        };
    }

    /**
     * Get monthly meal fees summary
     */
    async getMonthlyMealFees(month: number, year: number) {
        const monthName = this.getMonthName(month);
        const academicYear = year.toString();

        const mealFees = await Fees.find({
            month: monthName,
            academicYear: academicYear,
            feeType: 'Meal Fee',
        }).populate('student', 'name studentId class');

        return {
            month: monthName,
            year: year,
            totalStudents: mealFees.length,
            totalAmount: mealFees.reduce((sum, f) => sum + f.amount, 0),
            totalPaid: mealFees.reduce((sum, f) => sum + f.paidAmount, 0),
            totalDue: mealFees.reduce((sum, f) => sum + (f.dueAmount || f.amount), 0),
            totalMeals: mealFees.reduce((sum, f) => sum + (f.mealCount || 0), 0),
            paidCount: mealFees.filter(f => f.status === 'paid').length,
            partialCount: mealFees.filter(f => f.status === 'partial').length,
            unpaidCount: mealFees.filter(f => f.status === 'unpaid').length,
            fees: mealFees,
        };
    }

    /**
     * Get meal attendance summary with fee comparison
     */
    async getMealAttendanceSummary(month: number, year: number) {
        const monthName = this.getMonthName(month);
        const monthFormat = this.getMonthFormat(month, year);
        const academicYear = year.toString();

        const students = await Student.find({
            status: 'active',
            admissionStatus: 'enrolled',
        }).select('_id name advanceBalance class className');

        const details = await Promise.all(
            students.map(async (student) => {
                // Get attendance records using YYYY-MM format
                const attendances = await MealAttendance.find({
                    student: student._id,
                    month: monthFormat,
                    academicYear: academicYear,
                });

                const totalMeals = attendances.reduce((sum, a) => sum + (a.totalMeals || 0), 0);
                const totalCost = attendances.reduce((sum, a) => sum + (a.mealCost || 0), 0);
                const attendanceDays = attendances.length;

                // Check if fee exists
                const existingFee = await Fees.findOne({
                    student: student._id,
                    month: monthName,
                    academicYear: academicYear,
                    feeType: 'Meal Fee',
                });

                return {
                    studentId: student._id,
                    studentName: student.name,
                    class: student.class || 'Not Assigned',
                    advanceBalance: student.advanceBalance || 0,
                    attendanceDays: attendanceDays,
                    totalMeals: totalMeals,
                    totalCost: totalCost,
                    feeGenerated: !!existingFee,
                    feeId: existingFee?._id,
                    feeAmount: existingFee?.amount,
                    feeStatus: existingFee?.status,
                    amountMatches: existingFee ? existingFee.amount === totalCost : null,
                    difference: existingFee ? totalCost - existingFee.amount : null,
                };
            })
        );

        return {
            month: monthName,
            year: year,
            totalStudents: students.length,
            studentsWithAttendance: details.filter(d => d.attendanceDays > 0).length,
            studentsWithMeals: details.filter(d => d.totalMeals > 0).length,
            studentsWithFees: details.filter(d => d.feeGenerated).length,
            studentsWithoutFees: details.filter(d => !d.feeGenerated && d.totalMeals > 0).length,
            totalMealCost: details.reduce((sum, d) => sum + d.totalCost, 0),
            totalFeeAmount: details.reduce((sum, d) => sum + (d.feeAmount || 0), 0),
            mismatchedFees: details.filter(d => d.amountMatches === false).length,
            details: details,
        };
    }

    /**
     * Debug student attendance
     */
    async debugStudentAttendance(studentId: string, month: number, year: number) {
        const monthFormat = this.getMonthFormat(month, year);
        const monthName = this.getMonthName(month);
        const academicYear = year.toString();

        const attendances = await MealAttendance.find({
            student: new mongoose.Types.ObjectId(studentId),
            month: monthFormat,
            academicYear: academicYear,
        }).sort({ date: 1 });

        const totalMeals = attendances.reduce((sum, a) => sum + (a.totalMeals || 0), 0);
        const totalCost = attendances.reduce((sum, a) => sum + (a.mealCost || 0), 0);

        const existingFee = await Fees.findOne({
            student: studentId,
            month: monthName,
            academicYear: academicYear,
            feeType: 'Meal Fee',
        });

        const student = await Student.findById(studentId).select('name advanceBalance');

        return {
            studentInfo: {
                id: studentId,
                name: student?.name,
                advanceBalance: student?.advanceBalance || 0,
            },
            searchCriteria: {
                monthFormat: monthFormat,
                monthName: monthName,
                year: academicYear,
            },
            attendanceSummary: {
                totalDays: attendances.length,
                totalMeals: totalMeals,
                totalCost: totalCost,
                averageMealsPerDay: attendances.length > 0 ? (totalMeals / attendances.length).toFixed(2) : 0,
            },
            feeInfo: {
                exists: !!existingFee,
                feeId: existingFee?._id,
                amount: existingFee?.amount,
                status: existingFee?.status,
            },
            attendanceDetails: attendances.map(a => ({
                date: a.date,
                breakfast: a.breakfast,
                lunch: a.lunch,
                dinner: a.dinner,
                totalMeals: a.totalMeals,
                cost: a.mealCost,
            })),
        };
    }

    /**
     * Delete single meal fee
     */
    async deleteMealFee(feeId: string) {
        const fee = await Fees.findById(feeId);
        if (!fee) return { success: false, message: 'Fee not found' };
        if (fee.feeType !== 'Meal Fee') return { success: false, message: 'Not a meal fee' };

        if (fee.advanceUsed && fee.advanceUsed > 0) {
            await Student.updateOne(
                { _id: fee.student },
                { $inc: { advanceBalance: fee.advanceUsed } }
            );
        }

        await Student.updateOne(
            { _id: fee.student },
            { $pull: { fees: fee._id } }
        );

        await Fees.deleteOne({ _id: feeId });

        return {
            success: true,
            message: `Meal fee deleted for ${fee.month}`,
            data: {
                feeId: feeId,
                studentId: fee.student,
                month: fee.month,
                amount: fee.amount,
                advanceRestored: fee.advanceUsed || 0,
            },
        };
    }

    /**
     * Delete monthly meal fees
     */
    async deleteMonthlyMealFees(month: number, year: number) {
        const monthName = this.getMonthName(month);
        const academicYear = year.toString();

        const fees = await Fees.find({
            month: monthName,
            academicYear: academicYear,
            feeType: 'Meal Fee',
        });

        if (!fees.length) {
            return {
                success: false,
                message: `No meal fees found for ${monthName} ${year}`,
            };
        }

        for (const fee of fees) {
            if (fee.advanceUsed && fee.advanceUsed > 0) {
                await Student.updateOne(
                    { _id: fee.student },
                    { $inc: { advanceBalance: fee.advanceUsed } }
                );
            }
            await Student.updateOne(
                { _id: fee.student },
                { $pull: { fees: fee._id } }
            );
        }

        const result = await Fees.deleteMany({
            month: monthName,
            academicYear: academicYear,
            feeType: 'Meal Fee',
        });

        return {
            success: true,
            message: `${result.deletedCount} meal fees deleted for ${monthName} ${year}`,
            data: {
                month: monthName,
                year: year,
                deletedCount: result.deletedCount,
            },
        };
    }
}

export const mealFeeBalanceService = MealFeeBalanceService.getInstance();