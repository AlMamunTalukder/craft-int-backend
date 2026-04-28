// app/controllers/feeGeneration.controller.ts
import { Request, Response } from 'express';
// import { feeGenerationService } from '../../services/feeGeneration.service'; // পাথ ঠিক করুন
import { Student } from '../student/student.model';
import { Fees } from './model';
import { feeGenerationService } from '../../services/feeGenerate.service';

export const triggerFeeGeneration = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.body;
        let result;

        if (month && year) {
            console.log(`📅 নির্দিষ্ট মাসের ফি জেনারেট করা হচ্ছে: ${month}/${year}`);
            result = await feeGenerationService.generateMonthlyFees(month, year);
        } else {
            console.log(`📅 বর্তমান মাসের ফি জেনারেট করা হচ্ছে`);
            result = await feeGenerationService.generateCurrentMonthFees();
        }

        res.status(200).json(result);
    } catch (error: any) {
        console.error('❌ ফি জেনারেশন এ ত্রুটি:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
};

export const getFeeGenerationStatus = async (req: Request, res: Response) => {
    try {
        const currentDate = new Date();
        const monthName = currentDate.toLocaleString('default', { month: 'long' });
        const year = currentDate.getFullYear();

        const currentMonthFees = await Fees.countDocuments({
            month: monthName,
            academicYear: year.toString(),
            isLateFeeRecord: { $ne: true },
        });

        const totalStudents = await Student.countDocuments({
            status: 'active',
            admissionStatus: 'enrolled',
        });

        const mealFeesGenerated = await Fees.countDocuments({
            month: monthName,
            academicYear: year.toString(),
            feeType: 'Meal Fee',
            isLateFeeRecord: { $ne: true },
        });

        const monthlyFeesGenerated = await Fees.countDocuments({
            month: monthName,
            academicYear: year.toString(),
            feeType: 'Monthly Fee',
            isLateFeeRecord: { $ne: true },
        });

        const tuitionFeesGenerated = await Fees.countDocuments({
            month: monthName,
            academicYear: year.toString(),
            feeType: 'Tuition Fee',
            isLateFeeRecord: { $ne: true },
        });

        const seatRentFeesGenerated = await Fees.countDocuments({
            month: monthName,
            academicYear: year.toString(),
            feeType: 'Seat Rent',
            isLateFeeRecord: { $ne: true },
        });

        const admissionFeesGenerated = await Fees.countDocuments({
            month: monthName,
            academicYear: year.toString(),
            feeType: 'Admission Fee',
            isLateFeeRecord: { $ne: true },
        });

        const expectedFeesPerStudent = 5;
        const totalExpectedFees = totalStudents * expectedFeesPerStudent;
        const totalGeneratedFees = currentMonthFees;

        res.status(200).json({
            success: true,
            data: {
                currentMonth: monthName,
                currentYear: year,
                totalStudents,
                statistics: {
                    totalFeesGenerated: totalGeneratedFees,
                    totalExpectedFees: totalExpectedFees,
                    completionRate: totalExpectedFees > 0
                        ? ((totalGeneratedFees / totalExpectedFees) * 100).toFixed(2)
                        : '0',
                    isComplete: totalGeneratedFees >= totalExpectedFees,
                },
                breakdown: {
                    admissionFee: {
                        generated: admissionFeesGenerated,
                        expected: totalStudents,
                        percentage: totalStudents > 0
                            ? ((admissionFeesGenerated / totalStudents) * 100).toFixed(2)
                            : '0',
                    },
                    monthlyFee: {
                        generated: monthlyFeesGenerated,
                        expected: totalStudents,
                        percentage: totalStudents > 0
                            ? ((monthlyFeesGenerated / totalStudents) * 100).toFixed(2)
                            : '0',
                    },
                    tuitionFee: {
                        generated: tuitionFeesGenerated,
                        expected: totalStudents,
                        percentage: totalStudents > 0
                            ? ((tuitionFeesGenerated / totalStudents) * 100).toFixed(2)
                            : '0',
                    },
                    mealFee: {
                        generated: mealFeesGenerated,
                        expected: totalStudents,
                        percentage: totalStudents > 0
                            ? ((mealFeesGenerated / totalStudents) * 100).toFixed(2)
                            : '0',
                    },
                    seatRent: {
                        generated: seatRentFeesGenerated,
                        expected: totalStudents,
                        percentage: totalStudents > 0
                            ? ((seatRentFeesGenerated / totalStudents) * 100).toFixed(2)
                            : '0',
                    },
                },
                status: totalGeneratedFees >= totalExpectedFees ? 'completed' : 'pending',
                lastGeneratedAt: new Date().toISOString(),
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getStudentFeeStatus = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const currentDate = new Date();
        const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
        const currentYear = currentDate.getFullYear();

        const studentFees = await Fees.find({
            student: studentId,
            month: currentMonth,
            academicYear: currentYear.toString(),
            isLateFeeRecord: { $ne: true },
        }).lean();

        const student = await Student.findById(studentId).lean();

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found',
            });
        }

        const feeSummary = {
            totalAmount: studentFees.reduce((sum, fee) => sum + fee.amount, 0),
            totalPaid: studentFees.reduce((sum, fee) => sum + fee.paidAmount, 0),
            totalDue: studentFees.reduce((sum, fee) => sum + fee.dueAmount, 0),
            totalAdvanceUsed: studentFees.reduce((sum, fee) => sum + (fee.advanceUsed || 0), 0),
            fees: studentFees.map(fee => ({
                feeType: fee.feeType,
                amount: fee.amount,
                paidAmount: fee.paidAmount,
                advanceUsed: fee.advanceUsed || 0,
                dueAmount: fee.dueAmount,
                status: fee.status,
                dueDate: fee.dueDate,
            })),
        };

        const mealFee = studentFees.find(fee => fee.feeType === 'Meal Fee');
        let mealAdjustmentInfo = null;

        if (mealFee && mealFee.advanceUsed && mealFee.advanceUsed > 0) {
            mealAdjustmentInfo = {
                adjustmentApplied: true,
                advanceUsed: mealFee.advanceUsed,
                originalAmount: mealFee.amount,
                netPayable: mealFee.amount - mealFee.advanceUsed,
                paidAmount: mealFee.paidAmount,
                dueAmount: mealFee.dueAmount,
                message: `আগের মাসের অ্যাডভান্স ৳${mealFee.advanceUsed} এই মাসের মিল ফি থেকে কেটে নেওয়া হয়েছে`,
            };
        }

        res.status(200).json({
            success: true,
            data: {
                studentId: student.studentId,
                studentName: student.name,
                currentMonth,
                currentYear,
                advanceBalance: student.advanceBalance || 0,
                feeSummary,
                mealAdjustmentInfo,
                admissionStatus: student.admissionStatus,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getFeeDetailsByMonth = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.params;
        const monthName = new Date(`${year}-${month}-01`).toLocaleString('default', { month: 'long' });

        const fees = await Fees.find({
            month: monthName,
            academicYear: year,
            isLateFeeRecord: { $ne: true },
        })
            .populate('student', 'name studentId class category')
            .lean();

        const summary = {
            month: monthName,
            year,
            totalFees: fees.reduce((sum, fee) => sum + fee.amount, 0),
            totalPaid: fees.reduce((sum, fee) => sum + fee.paidAmount, 0),
            totalDue: fees.reduce((sum, fee) => sum + fee.dueAmount, 0),
            totalAdvanceUsed: fees.reduce((sum, fee) => sum + (fee.advanceUsed || 0), 0),
            byFeeType: {
                admissionFee: {
                    total: fees.filter(f => f.feeType === 'Admission Fee').reduce((sum, f) => sum + f.amount, 0),
                    paid: fees.filter(f => f.feeType === 'Admission Fee').reduce((sum, f) => sum + f.paidAmount, 0),
                    due: fees.filter(f => f.feeType === 'Admission Fee').reduce((sum, f) => sum + f.dueAmount, 0),
                },
                monthlyFee: {
                    total: fees.filter(f => f.feeType === 'Monthly Fee').reduce((sum, f) => sum + f.amount, 0),
                    paid: fees.filter(f => f.feeType === 'Monthly Fee').reduce((sum, f) => sum + f.paidAmount, 0),
                    due: fees.filter(f => f.feeType === 'Monthly Fee').reduce((sum, f) => sum + f.dueAmount, 0),
                },
                tuitionFee: {
                    total: fees.filter(f => f.feeType === 'Tuition Fee').reduce((sum, f) => sum + f.amount, 0),
                    paid: fees.filter(f => f.feeType === 'Tuition Fee').reduce((sum, f) => sum + f.paidAmount, 0),
                    due: fees.filter(f => f.feeType === 'Tuition Fee').reduce((sum, f) => sum + f.dueAmount, 0),
                },
                mealFee: {
                    total: fees.filter(f => f.feeType === 'Meal Fee').reduce((sum, f) => sum + f.amount, 0),
                    paid: fees.filter(f => f.feeType === 'Meal Fee').reduce((sum, f) => sum + f.paidAmount, 0),
                    due: fees.filter(f => f.feeType === 'Meal Fee').reduce((sum, f) => sum + f.dueAmount, 0),
                    advanceUsed: fees.filter(f => f.feeType === 'Meal Fee').reduce((sum, f) => sum + (f.advanceUsed || 0), 0),
                },
                seatRent: {
                    total: fees.filter(f => f.feeType === 'Seat Rent').reduce((sum, f) => sum + f.amount, 0),
                    paid: fees.filter(f => f.feeType === 'Seat Rent').reduce((sum, f) => sum + f.paidAmount, 0),
                    due: fees.filter(f => f.feeType === 'Seat Rent').reduce((sum, f) => sum + f.dueAmount, 0),
                },
            },
            feesList: fees.map(fee => ({
                studentName: (fee.student as any)?.name,
                studentId: (fee.student as any)?.studentId,
                className: fee.class,
                category: (fee.student as any)?.category,
                feeType: fee.feeType,
                amount: fee.amount,
                paidAmount: fee.paidAmount,
                advanceUsed: fee.advanceUsed,
                dueAmount: fee.dueAmount,
                status: fee.status,
            })),
        };

        res.status(200).json({
            success: true,
            data: summary,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};