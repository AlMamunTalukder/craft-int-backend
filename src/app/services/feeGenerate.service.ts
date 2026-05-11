/* eslint-disable @typescript-eslint/no-explicit-any */

import { Student } from "../modules/student/student.model";
import { Fees } from "../modules/fees/model";
import { FeeCategory } from "../modules/feeCategory/model";

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

    async generateMonthlyFees(month: number, year: number) {
        if (this.isRunning) {
            console.log('⚠️ Fee generation already running, skipping...');
            return { success: false, message: 'Already running' };
        }

        this.isRunning = true;

        try {
            const monthName = this.getMonthName(month);
            const academicYear = year.toString();

            const students = await Student.find({
                status: 'active',
                admissionStatus: 'enrolled',
            }).populate("className").lean();

            let generatedCount = 0;
            let skippedCount = 0;
            let errorCount = 0;
            let admissionFeeCount = 0;
            const generatedFees: any[] = [];
            const errors: any[] = [];

            // Process students in batches
            const BATCH_SIZE = 10;
            for (let i = 0; i < students.length; i += BATCH_SIZE) {
                const batch = students.slice(i, i + BATCH_SIZE);

                // Process each batch in parallel for speed
                await Promise.all(batch.map(async (student) => {
                    try {
                        const studentClassName = this.getStudentClassInfo(student);
                        if (!studentClassName) {
                            errorCount++;
                            errors.push({
                                studentId: student._id,
                                studentName: student.name,
                                error: 'No class assigned',
                            });
                            return;
                        }

                        const studentCategory = student.category || student.studentType || 'Residential';

                        let feeCategory = await FeeCategory.findOne({
                            categoryName: studentCategory,
                            className: studentClassName,
                        });

                        if (!feeCategory) {
                            feeCategory = await FeeCategory.findOne({
                                categoryName: { $regex: new RegExp(`^${studentCategory}$`, 'i') },
                                className: { $regex: new RegExp(`^${studentClassName}$`, 'i') },
                            });
                        }

                        if (!feeCategory) {
                            errorCount++;
                            errors.push({
                                studentId: student._id,
                                studentName: student.name,
                                error: `No fee category: ${studentCategory} - ${studentClassName}`,
                            });
                            return;
                        }

                        const dueDate = this.calculateDueDate(month, year);
                        const studentFees: any[] = [];

                        // Read advance balance fresh
                        const studentWithBalance = await Student.findById(student._id);
                        let advanceBalance = studentWithBalance?.advanceBalance || 0;

                        for (const feeItem of feeCategory.feeItems) {
                            if (SKIP_FEE_TYPES.includes(feeItem.feeType)) {
                                console.log(`  ${student.name}: ${feeItem.feeType} skipped`);
                                continue;
                            }

                            // --- Idempotency check: skip if fee already exists ---
                            if (feeItem.feeType === 'Admission Fee') {
                                const existingAdmission = await Fees.findOne({
                                    student: student._id,
                                    feeType: 'Admission Fee',
                                });
                                if (existingAdmission) {
                                    console.log(`  ${student.name}: Admission Fee already exists, skipping`);
                                    continue;
                                }
                            } else {
                                const existingFee = await Fees.findOne({
                                    student: student._id,
                                    month: monthName,
                                    academicYear,
                                    feeType: feeItem.feeType,
                                });
                                if (existingFee) {
                                    console.log(`  ${student.name}: ${feeItem.feeType} already exists for ${monthName}`);
                                    continue;
                                }
                            }

                            // --- Advance balance logic ---
                            const finalAmount = feeItem.amount;
                            let advanceUsed = 0;
                            let paidAmount = 0;
                            let status = 'unpaid';

                            if (advanceBalance > 0 && finalAmount > 0) {
                                const advanceToUse = Math.min(advanceBalance, finalAmount);
                                advanceUsed = advanceToUse;
                                paidAmount = advanceToUse;
                                advanceBalance -= advanceToUse;
                                console.log(`   💰 ${student.name}: Using ৳${advanceToUse} from advance for ${feeItem.feeType}`);
                            }

                            const dueAmount = finalAmount - paidAmount;
                            if (dueAmount <= 0) status = 'paid';

                            const feeDueDate = feeItem.feeType === 'Admission Fee'
                                ? new Date(year, month - 1, 30)
                                : dueDate;

                            // --- Safe insert: no transaction needed, idempotent by design ---
                            const feeRecord = await Fees.create({
                                student: student._id,
                                class: studentClassName,
                                month: monthName,
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

                            studentFees.push(feeRecord);
                            generatedCount++;

                            if (feeItem.feeType === 'Admission Fee') {
                                admissionFeeCount++;
                                console.log(` ✅ ${student.name}: ${feeItem.feeType} ৳${finalAmount} (One-time fee)`);
                            } else {
                                console.log(` ✅ ${student.name}: ${feeItem.feeType} ৳${finalAmount} (${monthName} ${year})`);
                            }
                        }

                        // Update advance balance if it changed
                        if (studentWithBalance && studentWithBalance.advanceBalance !== advanceBalance) {
                            await Student.updateOne(
                                { _id: student._id },
                                { $set: { advanceBalance } }
                            );
                        }

                        // Link fee IDs to student
                        if (studentFees.length > 0) {
                            const feeIds = studentFees.map((f) => f._id);
                            await Student.updateOne(
                                { _id: student._id },
                                { $addToSet: { fees: { $each: feeIds } } }
                            );

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
                                totalAmount: studentFees.reduce((s, f) => s + f.amount, 0),
                                totalDue: studentFees.reduce((s, f) => s + f.dueAmount, 0),
                            });
                        } else {
                            skippedCount++;
                        }
                    } catch (error: any) {
                        errorCount++;
                        errors.push({
                            studentId: student._id,
                            studentName: (student as any).name,
                            error: error.message,
                        });
                        console.error(` ❌ ${(student as any).name}:`, error.message);
                    }
                }));

                // Small delay between batches
                if (i + BATCH_SIZE < students.length) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }

            const totalAmount = generatedFees.reduce((s, st) => s + st.totalAmount, 0);
            const totalDue = generatedFees.reduce((s, st) => s + st.totalDue, 0);

            console.log(`\n═══════════════════════════════════════════════════`);
            console.log(`📊 মাসিক ফি জেনারেশন সম্পূর্ণ`);
            console.log(`   জেনারেটেড রেকর্ড: ${generatedCount}`);
            console.log(`   Admission Fee জেনারেটেড: ${admissionFeeCount}`);
            console.log(`   Monthly Fees: ${generatedCount - admissionFeeCount}`);
            console.log(`   স্কিপড: ${skippedCount} | ত্রুটি: ${errorCount}`);
            console.log(`   মোট পরিমাণ: ৳${totalAmount.toLocaleString()}`);
            console.log(`   বাকি পরিমাণ: ৳${totalDue.toLocaleString()}`);
            console.log(`═══════════════════════════════════════════════════\n`);

            return {
                success: true,
                message: `${monthName} ${year} ফি জেনারেশন সম্পূর্ণ`,
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
                    timestamp: new Date().toISOString(),
                },
            };
        } catch (error: any) {
            console.error('❌ ফি জেনারেশন ব্যর্থ:', error);
            throw error;
        } finally {
            this.isRunning = false;
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