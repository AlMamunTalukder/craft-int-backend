/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { Fees } from './model';
import { IFees } from './interface';
import { Enrollment } from '../enrollment/model';
import { Student } from '../student/student.model';
import { Payment } from '../payment/model';
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
    academicYear: startYear.toString(),
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

    // পেমেন্ট রেকর্ড তৈরি
    const paymentData = {
      student: fee.student,
      enrollment: fee.enrollment,
      fee: fee._id,
      amountPaid: amountPaid,
      paymentMethod: paymentMethod,
      paymentDate: new Date(),
      transactionId: transactionId || `TXN-${Date.now()}`,
      receiptNo: receiptNo || `RCP-${Date.now()}`,
      note: `Payment for ${fee.feeType} - ${fee.month}`,
      collectedBy: 'System'
    };

    const payment = await Payment.create([paymentData], { session });

    await session.commitTransaction();

    // আপডেটেড ফি রেকর্ড এবং পেমেন্ট রেকর্ড রিটার্ন
    return {
      fee,
      payment: payment[0]
    };
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

    // পেমেন্ট রেকর্ড তৈরি
    const paymentData = {
      student: fee.student,
      enrollment: fee.enrollment,
      fee: fee._id,
      amountPaid: totalPaid,
      paymentMethod: paymentMethod,
      paymentDate: new Date(),
      transactionId: transactionId || `TXN-${Date.now()}`,
      receiptNo: receiptNo || `RCP-${Date.now()}`,
      note: `Payment for ${fee.feeType} - ${fee.month}`,
      collectedBy: 'System'
    };

    const payment = await Payment.create([paymentData], { session });

    await session.commitTransaction();

    // আপডেটেড ফি রেকর্ড এবং পেমেন্ট রেকর্ড রিটার্ন
    return {
      fee,
      payment: payment[0]
    };
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
    academicYear: currentYear.toString()
  }).sort({ month: 1 });

  const totalDue = dueFees.reduce((sum, fee) => sum + fee.dueAmount, 0);
  const paidFees = await Fees.find({
    student: studentId,
    dueAmount: 0,
    academicYear: currentYear.toString()
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


export const getAllDueFees = async (query: Record<string, any>) => {
  const { year, class: className } = query;
  const academicYear = (year || new Date().getFullYear()).toString();

  const matchStage: any = {
    academicYear,
  };
  if (className) matchStage.class = className;

  const pipeline: any[] = [
    { $match: matchStage },
    {
      $addFields: {
        computedDue: {
          $subtract: [
            '$amount',
            { $add: [{ $ifNull: ['$paidAmount', 0] }, { $ifNull: ['$discount', 0] }, { $ifNull: ['$waiver', 0] }, { $ifNull: ['$advanceUsed', 0] }] }
          ]
        }
      }
    },
    // filter only records that have computedDue > 0.009 (basically > 0)
    { $match: { computedDue: { $gt: 0.009 } } },
    // Populate student and enrollment
    {
      $lookup: {
        from: 'students',
        localField: 'student',
        foreignField: '_id',
        as: 'studentDoc'
      }
    },
    { $unwind: '$studentDoc' },
    {
      $lookup: {
        from: 'enrollments',
        localField: 'enrollment',
        foreignField: '_id',
        as: 'enrollDoc'
      }
    },
    { $unwind: { path: '$enrollDoc', preserveNullAndEmptyArrays: true } },
    // sort by student and month
    { $sort: { 'student': 1, month: 1 } },
    // group by student
    {
      $group: {
        _id: '$student',
        student: { $first: '$studentDoc' },
        enrollment: { $first: '$enrollDoc' },
        fees: {
          $push: {
            _id: '$_id',
            feeType: '$feeType',
            month: '$month',
            class: '$class',
            amount: '$amount',
            paidAmount: { $ifNull: ['$paidAmount', 0] },
            discount: { $ifNull: ['$discount', 0] },
            waiver: { $ifNull: ['$waiver', 0] },
            advanceUsed: { $ifNull: ['$advanceUsed', 0] },
            computedDue: '$computedDue',
            status: '$status',
            paymentDate: '$paymentDate'
          }
        },
        totalDue: { $sum: '$computedDue' },
        totalPaid: { $sum: { $ifNull: ['$paidAmount', 0] } },
        totalAmount: { $sum: { $ifNull: ['$amount', 0] } },
        count: { $sum: 1 }
      }
    },
    // project final shape
    {
      $project: {
        _id: 0,
        student: {
          _id: '$student._id',
          name: '$student.name',
          studentId: '$student.studentId',
          mobile: '$student.mobile'
        },
        enrollment: {
          _id: '$enrollment._id',
          rollNumber: '$enrollment.rollNumber'
        },
        fees: 1,
        totalDue: { $round: ['$totalDue', 2] },
        totalPaid: 1,
        totalAmount: 1,
        feesCount: '$count'
      }
    }
  ];

  const students = await Fees.aggregate(pipeline).allowDiskUse(true);

  // summary
  const summary = {
    totalStudents: students.length,
    totalFees: students.reduce((s: number, st: any) => s + (st.feesCount || 0), 0),
    totalDueAmount: students.reduce((s: number, st: any) => s + (st.totalDue || 0), 0),
    totalPaidAmount: students.reduce((s: number, st: any) => s + (st.totalPaid || 0), 0),
    totalAmount: students.reduce((s: number, st: any) => s + (st.totalAmount || 0), 0),
    academicYear
  };

  return { summary, students };
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
  getAllDueFees,
};
