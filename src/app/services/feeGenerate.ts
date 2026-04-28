
import mongoose from "mongoose";
import { Student } from "../modules/student/student.model";
import { Fees } from "../modules/fees/model";
import { FeeCategory } from "../modules/feeCategory/model";

export class FeeGenerationService {
    private static instance: FeeGenerationService;
    private isRunning: boolean = false;

    static getInstance(): FeeGenerationService {
        if (!FeeGenerationService.instance) {
            FeeGenerationService.instance = new FeeGenerationService();
        }
        return FeeGenerationService.instance;
    }

    private getMonthName(month: number): string {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[month - 1];
    }

    private calculateDueDate(month: number, year: number): Date {
        const dueDate = new Date(year, month - 1, 10);
        if (dueDate.getDay() === 0) dueDate.setDate(11);
        else if (dueDate.getDay() === 6) dueDate.setDate(12);
        return dueDate;
    }

    private async getStudentClassInfo(student: any): Promise<string> {
        if (student.class?.trim()) return student.class;
        if (student.className?.length > 0) {
            const classData = student.className[0];
            if (typeof classData === 'object') {
                return classData.className || classData.name || '';
            }
            return String(classData);
        }
        return '';
    }

    private async shouldGenerateAdmissionFee(student: any, targetMonth: number, targetYear: number): Promise<boolean> {
        const enrollmentDate = student.createdAt || new Date();
        const enrollmentYear = enrollmentDate.getFullYear();
        const enrollmentMonth = enrollmentDate.getMonth() + 1;

        const isEnrollmentMonth = (targetYear === enrollmentYear && targetMonth === enrollmentMonth);

        if (!isEnrollmentMonth) return false;

        const existingAdmissionFee = await Fees.findOne({
            student: student._id,
            feeType: 'Admission Fee',
            isLateFeeRecord: { $ne: true },
        });

        return !existingAdmissionFee;
    }
    private async calculatePreviousMonthMealBalance(studentId: mongoose.Types.ObjectId, currentMonth: number, currentYear: number): Promise<number> {
        try {

            let previousMonth = currentMonth - 1;
            let previousYear = currentYear;
            if (previousMonth === 0) {
                previousMonth = 12;
                previousYear = currentYear - 1;
            }

            const previousMonthName = this.getMonthName(previousMonth);


            const previousMealFee = await Fees.findOne({
                student: studentId,
                month: previousMonthName,
                academicYear: previousYear.toString(),
                feeType: 'Meal Fee',
                isLateFeeRecord: { $ne: true }
            });

            if (!previousMealFee) return 0;
            const student = await Student.findById(studentId).populate('mealAttendances').lean();
            if (!student) return 0;
            const previousMonthMeals = (student.mealAttendances || []).filter((attendance: any) => {
                if (!attendance.date) return false;
                const attendanceDate = new Date(attendance.date);
                const attendanceMonth = attendanceDate.toLocaleString('default', { month: 'long' });
                const attendanceYear = attendanceDate.getFullYear();
                return attendanceMonth === previousMonthName && attendanceYear === previousYear;
            });

            const totalMealCost = previousMonthMeals.reduce((sum: number, meal: any) => sum + (meal.mealCost || 0), 0);
            const balance = totalMealCost - (previousMealFee.amount - (previousMealFee.advanceUsed || 0));

            return balance < 0 ? Math.abs(balance) : 0;

        } catch (error) {
            console.error('Error calculating previous month meal balance:', error);
            return 0;
        }
    }

    async generateMonthlyFees(month: number, year: number) {
        if (this.isRunning) {
            console.log(' Fee generation already running, skipping...');
            return { success: false, message: 'Already running' };
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            this.isRunning = true;
            const monthName = this.getMonthName(month);
            const academicYear = year.toString();

            const students = await Student.find({
                status: 'active',
                admissionStatus: 'enrolled',
            }).lean();


            let generatedCount = 0;
            let skippedCount = 0;
            let errorCount = 0;
            const generatedFees: any[] = [];
            const errors: any[] = [];

            for (const student of students) {
                try {
                    const studentClassName = await this.getStudentClassInfo(student);

                    if (!studentClassName) {
                        errorCount++;
                        errors.push({
                            studentId: student._id,
                            studentName: student.name,
                            error: 'No class assigned to student',
                        });
                        continue;
                    }

                    const studentCategory = student.category || student.studentType || 'Residential';

                    let feeCategory = await FeeCategory.findOne({
                        categoryName: studentCategory,
                        className: studentClassName,
                    }).session(session);

                    if (!feeCategory) {
                        feeCategory = await FeeCategory.findOne({
                            categoryName: { $regex: new RegExp(`^${studentCategory}$`, 'i') },
                            className: { $regex: new RegExp(`^${studentClassName}$`, 'i') },
                        }).session(session);
                    }

                    if (!feeCategory) {
                        errorCount++;
                        errors.push({
                            studentId: student._id,
                            studentName: student.name,
                            error: `No fee category found for ${studentCategory} - ${studentClassName}`,
                        });
                        continue;
                    }

                    const dueDate = this.calculateDueDate(month, year);
                    const studentFees: any[] = [];


                    const previousMonthMealBalance = await this.calculatePreviousMonthMealBalance(student._id, month, year);

                    for (const feeItem of feeCategory.feeItems) {

                        if (feeItem.feeType === 'Admission Fee') {
                            const shouldGenerate = await this.shouldGenerateAdmissionFee(student, month, year);
                            if (!shouldGenerate) continue;
                        }
                        const existingFee = await Fees.findOne({
                            student: student._id,
                            month: monthName,
                            academicYear: academicYear,
                            feeType: feeItem.feeType,
                            isLateFeeRecord: { $ne: true },
                        }).session(session);

                        if (existingFee) continue;

                        let finalAmount = feeItem.amount;
                        let advanceUsed = 0;
                        let discount = 0;
                        let paidAmount = 0;
                        if (feeItem.feeType === 'Meal Fee' && previousMonthMealBalance > 0) {
                            const adjustmentAmount = Math.min(previousMonthMealBalance, finalAmount);
                            advanceUsed = adjustmentAmount;
                            paidAmount = adjustmentAmount;
                            discount = adjustmentAmount;
                            await Student.updateOne(
                                { _id: student._id },
                                { $inc: { advanceBalance: -adjustmentAmount } }
                            ).session(session);
                        }

                        const feeRecord = new Fees({
                            student: student._id,
                            class: studentClassName,
                            month: monthName,
                            amount: finalAmount,
                            paidAmount: paidAmount,
                            advanceUsed: advanceUsed,
                            dueAmount: finalAmount - paidAmount,
                            discount: discount,
                            waiver: 0,
                            feeType: feeItem.feeType,
                            status: paidAmount >= finalAmount ? 'paid' : 'unpaid',
                            academicYear: academicYear,
                            isCurrentMonth: month === new Date().getMonth() + 1 && year === new Date().getFullYear(),
                            dueDate: dueDate,
                            lateFeePerDay: 100,
                            lateFeeCalculated: 0,
                            lateFeeDays: 0,
                            lateFeeAmount: 0,
                            lateFeeApplied: false,
                            isLateFeeRecord: false,
                        });

                        await feeRecord.save({ session });
                        studentFees.push(feeRecord);
                        generatedCount++;

                        const adjustmentText = advanceUsed > 0 ? ` (অ্যাডভান্স থেকে ৳${advanceUsed} কাটা হয়েছে)` : '';
                    }

                    if (studentFees.length > 0) {
                        const feeIds = studentFees.map(fee => fee._id);
                        await Student.updateOne(
                            { _id: student._id },
                            { $push: { fees: { $each: feeIds } } }
                        ).session(session);

                        generatedFees.push({
                            studentId: student._id,
                            studentName: student.name,
                            className: studentClassName,
                            category: studentCategory,
                            fees: studentFees.map(fee => ({
                                feeType: fee.feeType,
                                amount: fee.amount,
                                paidAmount: fee.paidAmount,
                                advanceUsed: fee.advanceUsed,
                                dueAmount: fee.dueAmount,
                                status: fee.status,
                                feeId: fee._id,
                            })),
                            totalAmount: studentFees.reduce((sum, fee) => sum + fee.amount, 0),
                            totalPaid: studentFees.reduce((sum, fee) => sum + fee.paidAmount, 0),
                            totalDue: studentFees.reduce((sum, fee) => sum + fee.dueAmount, 0),
                        });
                    }

                    if (studentFees.length === 0) skippedCount++;

                } catch (error: any) {
                    errorCount++;
                    errors.push({
                        studentId: student._id,
                        studentName: student.name,
                        error: error.message,
                    });
                    console.error(`❌ ${student.name} প্রসেস করতে ব্যর্থ:`, error.message);
                }
            }

            await session.commitTransaction();
            session.endSession();

            const totalGeneratedAmount = generatedFees.reduce((sum, student) => sum + student.totalAmount, 0);
            const totalPaidAmount = generatedFees.reduce((sum, student) => sum + student.totalPaid, 0);
            const totalDueAmount = generatedFees.reduce((sum, student) => sum + student.totalDue, 0);

            this.isRunning = false;

            return {
                success: true,
                message: `${monthName} ${year} মাসের ফি জেনারেশন সম্পূর্ণ হয়েছে`,
                data: {
                    totalStudents: students.length,
                    generatedFeeRecords: generatedCount,
                    studentsProcessed: generatedFees.length,
                    skippedCount,
                    errorCount,
                    totalAmount: totalGeneratedAmount,
                    totalPaid: totalPaidAmount,
                    totalDue: totalDueAmount,
                    generatedFees,
                    errors: errors.slice(0, 100),
                    timestamp: new Date().toISOString(),
                },
            };
        } catch (error: any) {
            await session.abortTransaction();
            session.endSession();
            this.isRunning = false;
            console.error('❌ ফি জেনারেশন ব্যর্থ:', error);
            throw error;
        }
    }

    async generateCurrentMonthFees() {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        return await this.generateMonthlyFees(month, year);
    }
}

export const feeGenerationService = FeeGenerationService.getInstance();