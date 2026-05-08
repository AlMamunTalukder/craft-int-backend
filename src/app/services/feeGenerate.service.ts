/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { Student } from "../modules/student/student.model";
import { Fees } from "../modules/fees/model";
import { FeeCategory } from "../modules/feeCategory/model";

// ✅ Meal Fee feeGenerationService থেকে সম্পূর্ণ বাদ
// Meal Fee শুধুমাত্র mealFeeBalanceService generate করবে (attendance based)
const SKIP_FEE_TYPES = ['Meal Fee'];

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

    private getStudentClassInfo(student: any): string {
        if (student.class?.trim()) return student.class.trim();
        if (student.className?.length > 0) {
            const classData = student.className[0];
            if (typeof classData === 'object') {
                return classData.className || classData.name || '';
            }
            return String(classData);
        }
        return '';
    }

    /**
     * ✅ Check if Admission Fee should be generated for this student
     * Admission Fee will be generated only ONCE per student (lifetime)
     * Based on student's enrollment or when first time fee is generated
     */
    private async shouldGenerateAdmissionFee(
        student: any,
        // Removed unused parameters to fix type error
    ): Promise<boolean> {
        // ✅ Check if already has Admission Fee (lifetime check - no month filter)
        const existingAdmissionFee = await Fees.findOne({
            student: student._id,
            feeType: 'Admission Fee',
        });

        if (existingAdmissionFee) {
            console.log(`   ℹ️ ${student.name}: Admission Fee already exists (generated on ${existingAdmissionFee.createdAt})`);
            return false;
        }

        // ✅ If no existing Admission Fee, generate it
        // এইটা প্রথমবার generate হবে যখন student active হবে
        console.log(`   ✅ ${student.name}: No existing Admission Fee, generating now`);
        return true;
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

            const students = await Student.find({
                status: 'active',
                admissionStatus: 'enrolled',
            }).lean();

            let generatedCount = 0;
            let skippedCount = 0;
            let errorCount = 0;
            let admissionFeeCount = 0;
            const generatedFees: any[] = [];
            const errors: any[] = [];

            console.log(`\n═══════════════════════════════════════════════════`);
            console.log(`💰 Generating Fees for ${monthName} ${year}`);
            console.log(`📊 Total Students: ${students.length}`);
            console.log(`═══════════════════════════════════════════════════\n`);

            for (const student of students) {
                try {
                    const studentClassName = this.getStudentClassInfo(student);
                    if (!studentClassName) {
                        errorCount++;
                        errors.push({
                            studentId: student._id,
                            studentName: student.name,
                            error: 'No class assigned',
                        });
                        continue;
                    }

                    const studentCategory = student.category || student.studentType || 'Residential';

                    // FeeCategory খোঁজা
                    let feeCategory = await FeeCategory.findOne({
                        categoryName: studentCategory,
                        className: studentClassName,
                    }).session(session);

                    if (!feeCategory) {
                        feeCategory = await FeeCategory.findOne({
                            categoryName: {
                                $regex: new RegExp(`^${studentCategory}$`, 'i'),
                            },
                            className: {
                                $regex: new RegExp(`^${studentClassName}$`, 'i'),
                            },
                        }).session(session);
                    }

                    if (!feeCategory) {
                        errorCount++;
                        errors.push({
                            studentId: student._id,
                            studentName: student.name,
                            error: `No fee category: ${studentCategory} - ${studentClassName}`,
                        });
                        continue;
                    }

                    const dueDate = this.calculateDueDate(month, year);
                    const studentFees: any[] = [];

                    // Advance balance
                    const studentWithBalance = await Student.findById(
                        student._id
                    ).session(session);
                    let advanceBalance = studentWithBalance?.advanceBalance || 0;

                    for (const feeItem of feeCategory.feeItems) {
                        // ✅ Meal Fee skip করুন — mealFeeBalanceService handle করবে
                        if (SKIP_FEE_TYPES.includes(feeItem.feeType)) {
                            console.log(
                                `⏭️  ${student.name}: ${feeItem.feeType} skipped (handled by meal attendance system)`
                            );
                            continue;
                        }

                        // ✅ Admission Fee special handling - ONCE per student lifetime
                        if (feeItem.feeType === 'Admission Fee') {
                            // Fixed: removed unused month and year parameters
                            const shouldGenerate = await this.shouldGenerateAdmissionFee(student);
                            if (!shouldGenerate) {
                                console.log(`⏭️  ${student.name}: Admission Fee already exists, skipping`);
                                continue;
                            }
                        } else {
                            // ✅ For monthly fees (Monthly Fee, Tuition Fee, Seat Rent etc.)
                            // Check if already exists for this month
                            const existingFee = await Fees.findOne({
                                student: student._id,
                                month: monthName,
                                academicYear: academicYear,
                                feeType: feeItem.feeType,
                            }).session(session);

                            if (existingFee) {
                                console.log(
                                    `⏭️  ${student.name}: ${feeItem.feeType} already exists for ${monthName}`
                                );
                                continue;
                            }
                        }

                        // Changed from 'let' to 'const' since it's never reassigned
                        const finalAmount = feeItem.amount;
                        let advanceUsed = 0;
                        let paidAmount = 0;
                        let status = 'unpaid';

                        // Check advance balance for this fee
                        if (advanceBalance > 0 && finalAmount > 0) {
                            const advanceToUse = Math.min(advanceBalance, finalAmount);
                            advanceUsed = advanceToUse;
                            paidAmount = advanceToUse;
                            advanceBalance -= advanceToUse;

                            console.log(`   💰 ${student.name}: Using ৳${advanceToUse} from advance for ${feeItem.feeType}`);
                        }

                        const dueAmount = finalAmount - paidAmount;
                        if (dueAmount <= 0) status = 'paid';

                        // ✅ For Admission Fee, month field set to "Admission Fee" (not month name)
                        // For monthly fees, use the month name
                        const feeMonth = feeItem.feeType === 'Admission Fee' ? 'Admission Fee' : monthName;

                        // ✅ Due date for Admission Fee: 30 days from generation
                        // For monthly fees: 10th of the month
                        const feeDueDate = feeItem.feeType === 'Admission Fee'
                            ? new Date(year, month - 1, 30)
                            : dueDate;

                        const feeRecord = new Fees({
                            student: student._id,
                            class: studentClassName,
                            month: feeMonth,
                            amount: finalAmount,
                            paidAmount,
                            advanceUsed,
                            dueAmount,
                            discount: 0,
                            waiver: 0,
                            feeType: feeItem.feeType,
                            status,
                            academicYear,
                            isCurrentMonth: feeItem.feeType !== 'Admission Fee' &&
                                month === new Date().getMonth() + 1 &&
                                year === new Date().getFullYear(),
                            dueDate: feeDueDate,
                        });

                        await feeRecord.save({ session });
                        studentFees.push(feeRecord);
                        generatedCount++;

                        if (feeItem.feeType === 'Admission Fee') {
                            admissionFeeCount++;
                            console.log(
                                `✅ ${student.name}: ${feeItem.feeType} ৳${finalAmount} (One-time fee for class ${studentClassName})`
                            );
                        } else {
                            console.log(
                                `✅ ${student.name}: ${feeItem.feeType} ৳${finalAmount} (${monthName} ${year})`
                            );
                        }
                    }

                    // Update student's advance balance if used
                    if (studentWithBalance && studentWithBalance.advanceBalance !== advanceBalance) {
                        await Student.updateOne(
                            { _id: student._id },
                            { $set: { advanceBalance: advanceBalance } }
                        ).session(session);
                    }

                    if (studentFees.length > 0) {
                        const feeIds = studentFees.map((f) => f._id);
                        await Student.updateOne(
                            { _id: student._id },
                            { $addToSet: { fees: { $each: feeIds } } }
                        ).session(session);

                        generatedFees.push({
                            studentId: student._id,
                            studentName: student.name,
                            className: studentClassName,
                            category: studentCategory,
                            fees: studentFees.map((fee) => ({
                                feeType: fee.feeType,
                                amount: fee.amount,
                                dueAmount: fee.dueAmount,
                                status: fee.status,
                                feeId: fee._id,
                                month: fee.month,
                            })),
                            totalAmount: studentFees.reduce(
                                (s, f) => s + f.amount, 0
                            ),
                            totalDue: studentFees.reduce(
                                (s, f) => s + f.dueAmount, 0
                            ),
                        });
                    } else {
                        skippedCount++;
                    }
                } catch (error: any) {
                    errorCount++;
                    errors.push({
                        studentId: student._id,
                        studentName: student.name,
                        error: error.message,
                    });
                    console.error(`❌ ${student.name}:`, error.message);
                }
            }

            await session.commitTransaction();
            session.endSession();

            const totalAmount = generatedFees.reduce(
                (s, st) => s + st.totalAmount, 0
            );
            const totalDue = generatedFees.reduce(
                (s, st) => s + st.totalDue, 0
            );

            console.log(`\n═══════════════════════════════════════════════════`);
            console.log(`✅ মাসিক ফি জেনারেশন সম্পূর্ণ`);
            console.log(`   জেনারেটেড রেকর্ড: ${generatedCount}`);
            console.log(`   Admission Fee জেনারেটেড: ${admissionFeeCount} (একবার করে সব student এর জন্য)`);
            console.log(`   Monthly Fees: ${generatedCount - admissionFeeCount}`);
            console.log(`   স্কিপড: ${skippedCount} | ত্রুটি: ${errorCount}`);
            console.log(`   মোট পরিমাণ: ৳${totalAmount.toLocaleString()}`);
            console.log(`   বাকি পরিমাণ: ৳${totalDue.toLocaleString()}`);
            console.log(`   ⚠️  Meal Fee আলাদাভাবে মাস শেষে generate হবে`);
            console.log(`═══════════════════════════════════════════════════\n`);

            this.isRunning = false;

            return {
                success: true,
                message: `${monthName} ${year} ফি জেনারেশন সম্পূর্ণ (Meal Fee বাদে)`,
                data: {
                    totalStudents: students.length,
                    generatedFeeRecords: generatedCount,
                    admissionFeesGenerated: admissionFeeCount,
                    monthlyFeesGenerated: generatedCount - admissionFeeCount,
                    studentsProcessed: generatedFees.length,
                    skippedCount,
                    errorCount,
                    totalAmount,
                    totalDue,
                    generatedFees,
                    errors: errors.slice(0, 100),
                    note: 'Admission Fee generated only ONCE per student (lifetime). Monthly fees generated every month.',
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
        return await this.generateMonthlyFees(
            now.getMonth() + 1,
            now.getFullYear()
        );
    }
}

export const feeGenerationService = FeeGenerationService.getInstance();