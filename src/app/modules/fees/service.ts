/* eslint-disable @typescript-eslint/no-explicit-any */
// service.ts
import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { Fees } from './model';
import { IFees } from './interface';
import { Enrollment } from '../enrollment/model';
import { Student } from '../student/student.model';
import mongoose from 'mongoose';

/**
 * মাসিক ফি রেকর্ড তৈরি করার ফাংশন (বছরের জন্য)
 */
const generateMonthlyFees = async (
  studentId: string,
  enrollmentId: string,
  studentClass: string,
  yearlyFee: number,
  startYear = new Date().getFullYear()
) => {
  const monthlyFee = Math.round(yearlyFee / 12); // মাসিক ফি ক্যালকুলেশন
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // সকল মাসের জন্য ফি রেকর্ড তৈরি
  const feeRecords = months.map((month) => ({
    student: studentId,
    enrollment: enrollmentId,
    class: studentClass,
    month: `${month}-${startYear}`,
    amount: monthlyFee,
    paidAmount: 0,
    advanceUsed: 0,
    dueAmount: monthlyFee, // শুরুতে পুরো টাকা due
    discount: 0,
    waiver: 0,
    status: 'unpaid' as const,
  }));

  const createdFees = await Fees.insertMany(feeRecords);

  // স্টুডেন্ট এবং এনরোলমেন্টে ফি রেকর্ড আপডেট
  await Student.findByIdAndUpdate(studentId, {
    $push: { fees: { $each: createdFees.map(fee => fee._id) } }
  });

  await Enrollment.findByIdAndUpdate(enrollmentId, {
    $push: { fees: { $each: createdFees.map(fee => fee._id) } }
  });

  return createdFees;
};

/**
 * ফি পেমেন্ট প্রসেস করার ফাংশন - এডভান্স ম্যানেজমেন্ট সহ
 */
const payFee = async (
  feeId: string,
  amountPaid: number,
  paymentMethod: IFees['paymentMethod'],
  transactionId?: string,
  receiptNo?: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const fee = await Fees.findById(feeId).session(session);
    if (!fee) throw new AppError(httpStatus.NOT_FOUND, 'Fee record not found');

    // বাকি due amount
    const remainingDue = fee.dueAmount - amountPaid;
    let advanceUsed = 0;
    let newStatus: 'paid' | 'partial' | 'unpaid' = fee.status;

    if (remainingDue <= 0) {
      // বেশি পেমেন্ট করা হলে - advance হিসাবে স্টোর
      advanceUsed = -remainingDue;
      fee.dueAmount = 0;
      newStatus = 'paid';

      // এডভান্স স্টুডেন্ট প্রোফাইলে সেভ করুন
      if (advanceUsed > 0) {
        await Student.findByIdAndUpdate(
          fee.student,
          { $inc: { advanceBalance: advanceUsed } },
          { session }
        );
      }
    } else {
      // partially paid
      fee.dueAmount = remainingDue;
      newStatus = 'partial';
    }

    // ফি রেকর্ড আপডেট
    fee.paidAmount += amountPaid;
    fee.advanceUsed += advanceUsed;
    fee.status = newStatus;
    fee.paymentMethod = paymentMethod;
    fee.transactionId = transactionId;
    fee.receiptNo = receiptNo;
    fee.paymentDate = new Date();

    await fee.save({ session });
    await session.commitTransaction();

    return fee;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * এডভান্স বালেন্স ব্যবহার করে ফি পে করা
 */
const payFeeWithAdvance = async (
  feeId: string,
  cashPaid: number = 0,
  advanceUsed: number = 0,
  paymentMethod: IFees['paymentMethod'] = 'cash',
  transactionId?: string,
  receiptNo?: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const fee = await Fees.findById(feeId).session(session);
    if (!fee) throw new AppError(httpStatus.NOT_FOUND, 'Fee record not found');

    const student = await Student.findById(fee.student).session(session);
    if (!student) throw new AppError(httpStatus.NOT_FOUND, 'Student not found');

    // এডভান্স বালেন্স চেক
    if (advanceUsed > 0 && (!student.advanceBalance || student.advanceBalance < advanceUsed)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Insufficient advance balance');
    }

    const totalPaid = cashPaid + advanceUsed;
    const remainingDue = fee.dueAmount - totalPaid;

    if (remainingDue < 0) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Payment exceeds due amount');
    }

    // ফি আপডেট
    fee.paidAmount += totalPaid;
    fee.advanceUsed += advanceUsed;
    fee.dueAmount = remainingDue;
    fee.status = remainingDue === 0 ? 'paid' : 'partial';
    fee.paymentMethod = paymentMethod;
    fee.transactionId = transactionId;
    fee.receiptNo = receiptNo;
    fee.paymentDate = new Date();

    // এডভান্স বালেন্স আপডেট
    if (advanceUsed > 0) {
      student.advanceBalance = (student.advanceBalance || 0) - advanceUsed;
      await student.save({ session });
    }

    await fee.save({ session });
    await session.commitTransaction();

    return fee;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * স্টুডেন্টের সকল due ফি দেখানো
 */
const getStudentDueFees = async (studentId: string, year?: number) => {
  const currentYear = year || new Date().getFullYear();

  const dueFees = await Fees.find({
    student: studentId,
    dueAmount: { $gt: 0 },
    month: { $regex: `${currentYear}$` }
  }).sort({ month: 1 });

  const totalDue = dueFees.reduce((sum, fee) => sum + fee.dueAmount, 0);
  const paidFees = await Fees.find({
    student: studentId,
    dueAmount: 0,
    month: { $regex: `${currentYear}$` }
  }).sort({ month: 1 });

  return {
    dueFees,
    paidFees,
    totalDue,
    totalPaid: paidFees.reduce((sum, fee) => sum + fee.paidAmount, 0)
  };
};

/**
 * মাস অনুযায়ী ফি স্ট্যাটাস
 */
const getMonthlyFeeStatus = async (studentId: string, month: string, year: number) => {
  const monthYear = `${month}-${year}`;

  const fee = await Fees.findOne({
    student: studentId,
    month: monthYear
  });

  if (!fee) {
    return {
      month: monthYear,
      amount: 0,
      paidAmount: 0,
      dueAmount: 0,
      status: 'not-generated',
      paymentDate: null
    };
  }

  return fee;
};

/**
 * বাল্ক ফি জেনারেট - একসাথে অনেক স্টুডেন্টের জন্য
 */
const generateBulkMonthlyFees = async (feeData: Array<{
  studentId: string;
  enrollmentId: string;
  studentClass: string;
  yearlyFee: number;
  startYear?: number;
}>) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const results = [];

    for (const data of feeData) {
      const fees = await generateMonthlyFees(
        data.studentId,
        data.enrollmentId,
        data.studentClass,
        data.yearlyFee,
        data.startYear
      );
      results.push(fees);
    }

    await session.commitTransaction();
    return results.flat();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// অন্যান্য ফাংশনগুলো আগের মতোই থাকবে
const getAllFees = async (query: Record<string, any>) => {
  const queryBuilder = new QueryBuilder(
    Fees.find().populate('enrollment student'),
    query
  )
    .search(['class', 'month', 'status'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const data = await queryBuilder.modelQuery;

  return { meta, data };
};

const getSingleFee = async (id: string) => {
  const fee = await Fees.findById(id).populate('student enrollment');
  if (!fee) throw new AppError(httpStatus.NOT_FOUND, 'Fee record not found');
  return fee;
};

const updateFee = async (id: string, payload: Partial<IFees>) => {
  const fee = await Fees.findById(id);
  if (!fee) throw new AppError(httpStatus.NOT_FOUND, 'Fee record not found');

  Object.assign(fee, payload);

  return await fee.save();
};

const deleteFee = async (id: string) => {
  const fee = await Fees.findByIdAndDelete(id);
  if (!fee) throw new AppError(httpStatus.NOT_FOUND, 'Fee record not found');
  return fee;
};

export const feesServices = {
  generateMonthlyFees,
  generateBulkMonthlyFees,
  payFee,
  payFeeWithAdvance,
  getStudentDueFees,
  getMonthlyFeeStatus,
  getAllFees,
  getSingleFee,
  updateFee,
  deleteFee,
};