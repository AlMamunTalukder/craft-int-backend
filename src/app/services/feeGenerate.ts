
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

            const students = await Student.find({
                status: 'active',
                admissionStatus: 'enrolled',
            }).lean();

            console.log(`📊 মোট সক্রিয় শিক্ষার্থী: ${students.length}`);

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

                    // স্টুডেন্টের অ্যাডভান্স ব্যালেন্স চেক করুন (মিল ফির জন্য)
                    const studentWithBalance = await Student.findById(student._id).session(session);
                    const advanceBalance = studentWithBalance?.advanceBalance || 0;

                    for (const feeItem of feeCategory.feeItems) {
                        // Admission Fee চেক
                        if (feeItem.feeType === 'Admission Fee') {
                            const shouldGenerate = await this.shouldGenerateAdmissionFee(student, month, year);
                            if (!shouldGenerate) continue;
                        }

                        // ইতিমধ্যে ফি আছে কিনা চেক করুন
                        const existingFee = await Fees.findOne({
                            student: student._id,
                            month: monthName,
                            academicYear: academicYear,
                            feeType: feeItem.feeType,
                            isLateFeeRecord: { $ne: true },
                        }).session(session);

                        if (existingFee) {
                            console.log(`⏭️ ${student.name} এর ${feeItem.feeType} ইতিমধ্যে জেনারেট হয়েছে`);
                            continue;
                        }

                        let finalAmount = feeItem.amount;
                        let advanceUsed = 0;
                        let paidAmount = 0;
                        let discount = 0;
                        let status = 'unpaid';

                        // শুধুমাত্র মিল ফির জন্য অ্যাডভান্স অ্যাডজাস্টমেন্ট
                        if (feeItem.feeType === 'Meal Fee' && advanceBalance > 0) {
                            const advanceToUse = Math.min(advanceBalance, finalAmount);
                            if (advanceToUse > 0) {
                                advanceUsed = advanceToUse;
                                paidAmount = advanceToUse;

                                console.log(`💵 ${student.name}: অ্যাডভান্স ব্যালেন্স ৳${advanceToUse} এই মাসের মিল ফি থেকে কাটা হয়েছে`);
                                console.log(`   - আসল মিল ফি: ৳${finalAmount}`);
                                console.log(`   - কাটা হয়েছে: ৳${advanceToUse}`);
                                console.log(`   - দিতে হবে: ৳${finalAmount - advanceToUse}`);

                                // স্টুডেন্টের অ্যাডভান্স ব্যালেন্স আপডেট করুন
                                await Student.updateOne(
                                    { _id: student._id },
                                    { $inc: { advanceBalance: -advanceToUse } }
                                ).session(session);
                            }
                        }

                        const dueAmount = finalAmount - paidAmount;

                        if (dueAmount <= 0) {
                            status = 'paid';
                        }

                        const feeRecord = new Fees({
                            student: student._id,
                            class: studentClassName,
                            month: monthName,
                            amount: finalAmount,
                            paidAmount: paidAmount,
                            advanceUsed: advanceUsed,
                            dueAmount: dueAmount,
                            discount: discount,
                            waiver: 0,
                            feeType: feeItem.feeType,
                            status: status,
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

                        if (advanceUsed > 0) {
                            console.log(`✅ ${student.name} এর ${feeItem.feeType}: ৳${finalAmount} (অ্যাডভান্স থেকে ৳${advanceUsed} কাটা হয়েছে, বাকি ৳${dueAmount})`);
                        } else {
                            console.log(`✅ ${student.name} এর ${feeItem.feeType}: ৳${finalAmount} জেনারেট হয়েছে`);
                        }
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
                    } else {
                        skippedCount++;
                    }

                } catch (error: any) {
                    errorCount++;
                    errors.push({ studentId: student._id, studentName: student.name, error: error.message });
                    console.error(`❌ ${student.name} প্রসেস করতে ব্যর্থ:`, error.message);
                }
            }

            await session.commitTransaction();
            session.endSession();

            const totalGeneratedAmount = generatedFees.reduce((sum, student) => sum + student.totalAmount, 0);
            const totalPaidAmount = generatedFees.reduce((sum, student) => sum + student.totalPaid, 0);
            const totalDueAmount = generatedFees.reduce((sum, student) => sum + student.totalDue, 0);

            console.log(`\n═══════════════════════════════════════════════════`);
            console.log(`✅ মাসিক ফি জেনারেশন সম্পূর্ণ`);
            console.log(`📊 পরিসংখ্যান:`);
            console.log(`   - মোট শিক্ষার্থী: ${students.length}`);
            console.log(`   - জেনারেটেড ফি রেকর্ড: ${generatedCount}`);
            console.log(`   - প্রসেসড শিক্ষার্থী: ${generatedFees.length}`);
            console.log(`   - স্কিপড শিক্ষার্থী: ${skippedCount}`);
            console.log(`   - ত্রুটি: ${errorCount}`);
            console.log(`   - মোট ফি পরিমাণ: ৳${totalGeneratedAmount.toLocaleString()}`);
            console.log(`   - অ্যাডভান্স থেকে পরিশোধিত: ৳${totalPaidAmount.toLocaleString()}`);
            console.log(`   - বাকি পরিমাণ: ৳${totalDueAmount.toLocaleString()}`);
            console.log(`═══════════════════════════════════════════════════`);

            if (errors.length > 0) {
                console.error(`\n⚠️ ত্রুটির বিবরণ:`);
                errors.slice(0, 10).forEach((err, idx) => {
                    console.error(`   ${idx + 1}. ${err.studentName}: ${err.error}`);
                });
            }

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

    // নির্দিষ্ট স্টুডেন্টের জন্য ফি জেনারেট করুন
    async generateFeesForSpecificStudent(studentId: string, month?: number, year?: number) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const targetMonth = month || new Date().getMonth() + 1;
            const targetYear = year || new Date().getFullYear();
            const monthName = this.getMonthName(targetMonth);
            const academicYear = targetYear.toString();

            const student = await Student.findById(studentId).lean();
            if (!student) {
                throw new Error('Student not found');
            }

            const studentClassName = await this.getStudentClassInfo(student);
            if (!studentClassName) {
                throw new Error('No class assigned to student');
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
                throw new Error(`No fee category found for ${studentCategory} - ${studentClassName}`);
            }

            const dueDate = this.calculateDueDate(targetMonth, targetYear);
            const generatedFees = [];

            // স্টুডেন্টের অ্যাডভান্স ব্যালেন্স চেক করুন
            const studentWithBalance = await Student.findById(studentId).session(session);
            const advanceBalance = studentWithBalance?.advanceBalance || 0;

            for (const feeItem of feeCategory.feeItems) {
                // Admission Fee চেক
                if (feeItem.feeType === 'Admission Fee') {
                    const shouldGenerate = await this.shouldGenerateAdmissionFee(student, targetMonth, targetYear);
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
                let paidAmount = 0;
                let status = 'unpaid';

                // শুধুমাত্র মিল ফির জন্য অ্যাডভান্স অ্যাডজাস্টমেন্ট
                if (feeItem.feeType === 'Meal Fee' && advanceBalance > 0) {
                    const advanceToUse = Math.min(advanceBalance, finalAmount);
                    if (advanceToUse > 0) {
                        advanceUsed = advanceToUse;
                        paidAmount = advanceToUse;

                        await Student.updateOne(
                            { _id: student._id },
                            { $inc: { advanceBalance: -advanceToUse } }
                        ).session(session);
                    }
                }

                const dueAmount = finalAmount - paidAmount;
                if (dueAmount <= 0) status = 'paid';

                const feeRecord = new Fees({
                    student: student._id,
                    class: studentClassName,
                    month: monthName,
                    amount: finalAmount,
                    paidAmount: paidAmount,
                    advanceUsed: advanceUsed,
                    dueAmount: dueAmount,
                    discount: 0,
                    waiver: 0,
                    feeType: feeItem.feeType,
                    status: status,
                    academicYear: academicYear,
                    isCurrentMonth: targetMonth === new Date().getMonth() + 1 && targetYear === new Date().getFullYear(),
                    dueDate: dueDate,
                    lateFeePerDay: 100,
                    lateFeeCalculated: 0,
                    lateFeeDays: 0,
                    lateFeeAmount: 0,
                    lateFeeApplied: false,
                    isLateFeeRecord: false,
                });

                await feeRecord.save({ session });
                generatedFees.push(feeRecord);
            }

            if (generatedFees.length > 0) {
                const feeIds = generatedFees.map(fee => fee._id);
                await Student.updateOne(
                    { _id: student._id },
                    { $push: { fees: { $each: feeIds } } }
                ).session(session);
            }

            await session.commitTransaction();
            session.endSession();

            return {
                success: true,
                message: `${generatedFees.length} টি ফি জেনারেট হয়েছে ${student.name} এর জন্য`,
                data: {
                    studentId: student._id,
                    studentName: student.name,
                    className: studentClassName,
                    fees: generatedFees.map(fee => ({
                        feeType: fee.feeType,
                        amount: fee.amount,
                        paidAmount: fee.paidAmount,
                        advanceUsed: fee.advanceUsed,
                        dueAmount: fee.dueAmount,
                        status: fee.status,
                        feeId: fee._id,
                    })),
                    totalAmount: generatedFees.reduce((sum, fee) => sum + fee.amount, 0),
                    totalPaid: generatedFees.reduce((sum, fee) => sum + fee.paidAmount, 0),
                    totalDue: generatedFees.reduce((sum, fee) => sum + fee.dueAmount, 0),
                },
            };
        } catch (error: any) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }
}

export const feeGenerationService = FeeGenerationService.getInstance();