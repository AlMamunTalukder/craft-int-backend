// app/services/completeFeeGeneration.service.ts
import mongoose from "mongoose";
import { Student } from "../modules/student/student.model";
import { Fees } from "../modules/fees/model";
import { FeeCategory } from "../modules/feeCategory/model";
import { mealFeeBalanceService } from "./mealFeeBalance.service";

export class CompleteFeeGenerationService {
    private static instance: CompleteFeeGenerationService;
    private isRunning: boolean = false;

    static getInstance(): CompleteFeeGenerationService {
        if (!CompleteFeeGenerationService.instance) {
            CompleteFeeGenerationService.instance = new CompleteFeeGenerationService();
        }
        return CompleteFeeGenerationService.instance;
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

    async generateMonthlyFees(month: number, year: number) {
        if (this.isRunning) {
            console.log('⚠️ Fee generation already running, skipping...');
            return { success: false, message: 'Already running' };
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            this.isRunning = true;
            const monthName = this.getMonthName(month);
            const academicYear = year.toString();

            console.log(`═══════════════════════════════════════════════════`);
            console.log(`🚀 মাসিক ফি জেনারেশন শুরু হচ্ছে`);
            console.log(`📅 মাস: ${monthName} ${year}`);
            console.log(`⏰ সময়: ${new Date().toISOString()}`);
            console.log(`═══════════════════════════════════════════════════`);

            // STEP 1: আগের মাসের মিল ব্যালেন্স অ্যাডজাস্ট করুন
            console.log(`\n📊 ধাপ ১: আগের মাসের মিল ব্যালেন্স অ্যাডজাস্ট করা হচ্ছে...`);

            const students = await Student.find({
                status: 'active',
                admissionStatus: 'enrolled',
            }).lean();

            for (const student of students) {
                try {
                    const previousMonth = month === 1 ? 12 : month - 1;
                    const previousYear = month === 1 ? year - 1 : year;
                    const previousMonthName = this.getMonthName(previousMonth);

                    await mealFeeBalanceService.adjustNextMonthMealFee(
                        student._id,
                        previousMonthName,
                        previousYear
                    );
                } catch (error: any) {
                    console.error(`ব্যালেন্স অ্যাডজাস্ট করতে ব্যর্থ: ${student.name}`, error.message);
                }
            }

            // STEP 2: বর্তমান মাসের ফি জেনারেট করুন
            console.log(`\n💰 ধাপ ২: বর্তমান মাসের ফি জেনারেট করা হচ্ছে...`);

            let generatedCount = 0;
            let skippedCount = 0;
            let errorCount = 0;
            const generatedFees: any[] = [];
            const errors: any[] = [];

            for (const student of students) {
                try {
                    // স্টুডেন্ট রিলোড করুন (আপডেটেড অ্যাডভান্স ব্যালেন্স সহ)
                    const updatedStudent = await Student.findById(student._id).lean();

                    const studentClassName = await this.getStudentClassInfo(student);
                    if (!studentClassName) {
                        errorCount++;
                        errors.push({ studentId: student._id, studentName: student.name, error: 'No class assigned' });
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
                            error: `No fee category found for ${studentCategory} - ${studentClassName}`
                        });
                        continue;
                    }

                    const dueDate = this.calculateDueDate(month, year);
                    const studentFees: any[] = [];

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

                        // মিল ফির জন্য স্পেশ্যাল অ্যাডজাস্টমেন্ট
                        if (feeItem.feeType === 'Meal Fee' && updatedStudent?.advanceBalance && updatedStudent.advanceBalance > 0) {
                            const advanceToUse = Math.min(updatedStudent.advanceBalance, finalAmount);
                            if (advanceToUse > 0) {
                                advanceUsed = advanceToUse;
                                finalAmount = feeItem.amount;
                                discount = 0;

                                console.log(`💵 ${student.name} এর মিল ফি থেকে ৳${advanceToUse} অ্যাডভান্স কেটে নেওয়া হয়েছে`);

                                // স্টুডেন্টের অ্যাডভান্স ব্যালেন্স আপডেট (পরে করা হবে)
                                await Student.updateOne(
                                    { _id: student._id },
                                    { $inc: { advanceBalance: -advanceToUse } }
                                ).session(session);
                            }
                        }

                        const feeRecord = new Fees({
                            student: student._id,
                            class: studentClassName,
                            month: monthName,
                            amount: feeItem.amount,
                            paidAmount: advanceUsed,
                            advanceUsed: advanceUsed,
                            dueAmount: feeItem.amount - advanceUsed,
                            discount: discount,
                            waiver: 0,
                            feeType: feeItem.feeType,
                            status: advanceUsed >= feeItem.amount ? 'paid' : 'unpaid',
                            academicYear: academicYear,
                            isCurrentMonth: month === new Date().getMonth() + 1 && year === new Date().getFullYear(),
                            dueDate: dueDate,
                            lateFeePerDay: 100,
                            isLateFeeRecord: false,
                        });

                        await feeRecord.save({ session });
                        studentFees.push(feeRecord);
                        generatedCount++;

                        console.log(`✅ ${student.name} এর জন্য ${feeItem.feeType}: ৳${feeItem.amount} জেনারেট হয়েছে`);
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
                    errors.push({ studentId: student._id, studentName: student.name, error: error.message });
                }
            }

            await session.commitTransaction();
            session.endSession();

            const totalGeneratedAmount = generatedFees.reduce((sum, student) => sum + student.totalAmount, 0);
            const totalPaidAmount = generatedFees.reduce((sum, student) => sum + student.totalPaid, 0);
            const totalDueAmount = generatedFees.reduce((sum, student) => sum + student.totalDue, 0);

            console.log(`═══════════════════════════════════════════════════`);
            console.log(`✅ মাসিক ফি জেনারেশন সম্পূর্ণ`);
            console.log(`📊 পরিসংখ্যান:`);
            console.log(`   - মোট শিক্ষার্থী: ${students.length}`);
            console.log(`   - জেনারেটেড ফি রেকর্ড: ${generatedCount}`);
            console.log(`   - জেনারেটেড ফি পরিমাণ: ৳${totalGeneratedAmount.toLocaleString()}`);
            console.log(`   - পরিশোধিত পরিমাণ: ৳${totalPaidAmount.toLocaleString()} (অ্যাডভান্স থেকে)`);
            console.log(`   - বাকি পরিমাণ: ৳${totalDueAmount.toLocaleString()}`);
            console.log(`   - স্কিপ করা: ${skippedCount}`);
            console.log(`   - ত্রুটি: ${errorCount}`);
            console.log(`═══════════════════════════════════════════════════`);

            this.isRunning = false;

            return {
                success: true,
                message: `${monthName} ${year} মাসের ফি জেনারেশন সম্পূর্ণ`,
                data: {
                    totalStudents: students.length,
                    generatedFeeRecords: generatedCount,
                    totalAmount: totalGeneratedAmount,
                    totalPaid: totalPaidAmount,
                    totalDue: totalDueAmount,
                    studentsProcessed: generatedFees.length,
                    skippedCount,
                    errorCount,
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

export const completeFeeGenerationService = CompleteFeeGenerationService.getInstance();