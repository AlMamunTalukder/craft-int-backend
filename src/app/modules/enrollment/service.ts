/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import { Enrollment } from './model';
import QueryBuilder from '../../builder/QueryBuilder';
import mongoose, { Types } from 'mongoose';
import { Student } from '../student/student.model';
import { Fees } from '../fees/model';
import { User } from '../user/user.model';
import { generateStudentId } from '../student/student.utils';
import { Payment } from '../payment/model';
import { Class } from '../class/class.model';
import { Receipt } from '../receipt/model';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const getAllEnrollments = async (query: Record<string, any>) => {
  const queryBuilder = new QueryBuilder(Enrollment.find(), query)
    .filter()
    .sort()
    .paginate()
    .fields()
    .populate(['student', 'className', 'fees', 'promotedFrom', 'promotedTo']);

  const meta = await queryBuilder.countTotal();
  const data = await queryBuilder.modelQuery;

  return { meta, data };
};

const getSingleEnrollment = async (id: string) => {
  const enrollment = await Enrollment.findById(id)
    .populate({
      path: 'student',
      populate: {
        path: 'className',
      },
    })
    .populate({
      path: 'className',
    })

    .populate({
      path: 'fees',
    })
    .populate({
      path: 'promotedFrom',
      populate: { path: 'className' },
    })
    .populate({
      path: 'promotedTo',
      populate: { path: 'className' },
    });

  if (!enrollment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Enrollment not found');
  }

  return enrollment;
};

export const createEnrollment = async (payload: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Normalize Class Data
    let classIds: any[] = [];
    let primaryClassName = '';
    let classNameForId = ''; // For student ID generation
    console.log('payload this ', payload);

    if (Array.isArray(payload.className)) {
      classIds = payload.className
        .filter((cls: any) => cls && cls !== '')
        .map((cls: any) => {
          if (typeof cls === 'object') {
            if (cls.className && !primaryClassName)
              primaryClassName = cls.className;
            if (cls.label && !primaryClassName) primaryClassName = cls.label;
            return cls._id?.toString() || cls.value?.toString() || '';
          }
          const strVal = typeof cls === 'string' ? cls.trim() : '';
          if (
            strVal &&
            !mongoose.Types.ObjectId.isValid(strVal) &&
            !primaryClassName
          )
            primaryClassName = strVal;
          return strVal;
        })
        .filter((id: any) => id !== '');
    } else if (payload.className) {
      const cls = payload.className;
      if (typeof cls === 'object') {
        if (cls.className && !primaryClassName)
          primaryClassName = cls.className;
        if (cls.label && !primaryClassName) primaryClassName = cls.label;
        const id =
          cls._id?.toString() || cls.value?.toString() || cls.id?.toString();
        if (id) classIds.push(id);
      } else if (typeof cls === 'string' && cls.trim()) {
        const strVal = cls.trim();
        if (mongoose.Types.ObjectId.isValid(strVal)) classIds.push(strVal);
        else {
          classIds.push(strVal);
          if (!primaryClassName) primaryClassName = strVal;
        }
      }
    }

    const validClassIds = classIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );

    // Get class name for ID generation
    if (validClassIds.length > 0) {
      const classDoc = await Class.findById(validClassIds[0]).session(session);
      // Use proper field name from TClass interface
      primaryClassName = classDoc?.className || validClassIds[0];
      classNameForId = classDoc?.className || '';
    }

    if (!primaryClassName)
      primaryClassName =
        payload.studentDepartment === 'hifz' ? 'Hifz' : 'Class One';

    // 2. Prepare Enrollment Data
    const enrollmentData: any = {
      studentId: payload.studentId || '',
      studentName: payload.studentName || '',
      nameBangla: payload.nameBangla || '',
      studentPhoto: payload.studentPhoto || '',
      mobileNo: payload.mobileNo || '',
      rollNumber: payload.rollNumber || '',
      className: validClassIds.length > 0 ? validClassIds[0] : null, // IEnrollment expects single ObjectId, not array
      section: payload.section || '',
      session: payload.session || new Date().getFullYear().toString(),
      batch: payload.group || '',
      studentType: payload.studentType || payload.category || 'Residential',
      studentDepartment: payload.studentDepartment || 'hifz',
      fatherName: payload.fatherName || '',
      fatherNameBangla: payload.fatherNameBangla || '',
      fatherMobile: payload.fatherMobile || '',
      motherName: payload.motherName || '',
      motherNameBangla: payload.motherNameBangla || '',
      presentAddress: payload.presentAddress || {},
      permanentAddress: payload.permanentAddress || {},
      guardianInfo: payload.guardianInfo || {},
      documents: payload.documents || {},
      termsAccepted: payload.termsAccepted || false,
      // Use the correct field names from IEnrollment
      totalAmount: payload.totalAmount || 0,
      paidAmount: payload.paidAmount || 0,
      dueAmount: payload.dueAmount || 0,
      paymentMethod: payload.paymentMethod || 'cash',
      totalDiscount: payload.totalDiscount || 0,
      paymentStatus: payload.paymentStatus || 'pending',
      // Additional fields
      birthDate: payload.birthDate,
      birthRegistrationNo: payload.birthRegistrationNo,
      bloodGroup: payload.bloodGroup,
      nationality: payload.nationality,
      fatherNid: payload.fatherNid,
      fatherProfession: payload.fatherProfession,
      fatherIncome: payload.fatherIncome,
      motherNid: payload.motherNid,
      motherProfession: payload.motherProfession,
      motherIncome: payload.motherIncome,
      roll: payload.roll || payload.rollNumber,
      previousSchool: payload.previousSchool || {},
      admissionType: 'admission',
      status: 'active',
    };

    // 3. Handle Student
    let studentDoc: any = null;
    let userDoc: any = null;

    // Try to find existing student by ID or mobile
    if (payload.studentId && payload.studentId.trim() !== '') {
      studentDoc = await Student.findOne({
        studentId: payload.studentId,
      }).session(session);
    }
    if (!studentDoc && payload.mobileNo) {
      studentDoc = await Student.findOne({ mobile: payload.mobileNo }).session(
        session,
      );
    }

    // Create new student if not found
    if (!studentDoc) {
      // Generate student ID using the class name
      const newStudentId = await generateStudentId(classNameForId);

      // Generate email from student name or mobile
      const email =
        payload.email ||
        `${payload.studentName?.toLowerCase().replace(/\s+/g, '.')}@student.craft.edu` ||
        `student${Date.now().toString().slice(-6)}@craft.edu`;

      // Generate default password (you might want to send this via SMS/email)
      const defaultPassword = `Craft@${Date.now().toString().slice(-6)}`;

      // Check if user already exists with this email
      const existingUser = await User.findOne({ email }).session(session);

      if (!existingUser) {
        // Create user account for student
        const userData = {
          email: email,
          name: payload.studentName || 'Student',
          password: defaultPassword,
          needPasswordChange: true,
          role: 'student',
          status: 'active',
          isDeleted: false,
        };

        const [newUser] = await User.create([userData], { session });
        userDoc = newUser;

        console.log('User created for student:', {
          email: userDoc.email,
          role: userDoc.role,
          userId: userDoc._id,
        });
      } else {
        userDoc = existingUser;
        console.log('Existing user found for student:', {
          email: userDoc.email,
          role: userDoc.role,
          userId: userDoc._id,
        });
      }

      const studentData: any = {
        studentId: newStudentId,
        name: payload.studentName,
        nameBangla: payload.nameBangla,
        email: email,
        mobile: payload.mobileNo,
        className: validClassIds.map((id) => new mongoose.Types.ObjectId(id)), // Student expects array
        studentDepartment: payload.studentDepartment,
        advanceBalance: payload.advanceBalance || 0,
        // Initialize empty arrays
        payments: [],
        receipts: [],
        fees: [],
        fatherName: payload.fatherName,
        fatherMobile: payload.fatherMobile,
        motherName: payload.motherName,
        motherMobile: payload.motherMobile,
        presentAddress: payload.presentAddress,
        permanentAddress: payload.permanentAddress,
        guardianInfo: payload.guardianInfo,
        // Add reference to user
        user: userDoc?._id,
        // Additional fields
        birthDate: payload.birthDate,
        birthRegistrationNo: payload.birthRegistrationNo,
        bloodGroup: payload.bloodGroup,
        gender: payload.gender,
        fatherProfession: payload.fatherProfession,
        fatherIncome: payload.fatherIncome,
        motherProfession: payload.motherProfession,
        motherIncome: payload.motherIncome,
        previousSchool: payload.previousSchool,
        documents: payload.documents,
      };

      const [newStudent] = await Student.create([studentData], { session });
      studentDoc = newStudent;
      enrollmentData.studentId = newStudentId;
      enrollmentData.student = studentDoc._id;

      console.log('Generated Student ID:', newStudentId);
    } else {
      // If student exists, check if they have a user account
      if (!studentDoc.user) {
        // Create user for existing student
        const email =
          payload.email ||
          `${studentDoc.name?.toLowerCase().replace(/\s+/g, '.')}@student.craft.edu` ||
          `student${Date.now().toString().slice(-6)}@craft.edu`;

        const defaultPassword = `Craft@${Date.now().toString().slice(-6)}`;

        const existingUser = await User.findOne({ email }).session(session);

        if (!existingUser) {
          const userData = {
            email: email,
            name: studentDoc.name || 'Student',
            password: defaultPassword,
            needPasswordChange: true,
            role: 'student',
            status: 'active',
            isDeleted: false,
          };

          const [newUser] = await User.create([userData], { session });
          userDoc = newUser;

          // Update student with user reference
          studentDoc.user = userDoc._id;
          await studentDoc.save({ session });
        } else {
          userDoc = existingUser;
          // Update student with existing user reference
          studentDoc.user = userDoc._id;
          await studentDoc.save({ session });
        }
      } else {
        userDoc = await User.findById(studentDoc.user).session(session);
      }

      enrollmentData.student = studentDoc._id;
    }

    // 4. Create Enrollment
    const [newEnrollment] = await Enrollment.create([enrollmentData], {
      session,
    });

    // 5. Process Fees
    const feeDocs: mongoose.Types.ObjectId[] = [];
    const paidFeeIds: mongoose.Types.ObjectId[] = [];
    let totalTransactionAmount = 0;
    const MONTHS = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    // Track total paid amount from payload
    const totalPaidAmount = Number(payload.paidAmount) || 0;
    let remainingPayment = totalPaidAmount;

    if (payload.fees && Array.isArray(payload.fees)) {
      // First, calculate total fee amount to determine payment distribution
      const allFeeItems: any[] = [];

      // Collect all fee items first
      for (const fee of payload.fees) {
        if (fee.isMonthly) {
          const amount = Number(fee.amount) || 0;
          const discountRangeStart = fee.discountRangeStart || '';
          const discountRangeEnd = fee.discountRangeEnd || '';
          const discountRangeAmount = Number(fee.discountRangeAmount) || 0;
          const flatDiscount = Number(fee.discount) || 0;

          const startIndex = MONTHS.indexOf(discountRangeStart);
          const endIndex = MONTHS.indexOf(discountRangeEnd);

          for (let i = 0; i < 12; i++) {
            const month = MONTHS[i];
            const monthLabel = `Monthly Fee - ${month}`;

            let itemDiscount = flatDiscount;
            if (
              discountRangeStart &&
              discountRangeEnd &&
              startIndex !== -1 &&
              endIndex !== -1 &&
              i >= startIndex &&
              i <= endIndex
            ) {
              itemDiscount = discountRangeAmount;
            }

            allFeeItems.push({
              feeType: monthLabel,
              amount: amount,
              discount: itemDiscount,
              month: month,
              isMonthly: true,
              className: primaryClassName,
            });
          }
        } else {
          if (!fee.feeType) continue;

          const feeTypeStr =
            typeof fee.feeType === 'string'
              ? fee.feeType
              : fee.feeType?.value || '';
          const amount = Number(fee.amount) || 0;
          const discount = Number(fee.discount) || 0;

          allFeeItems.push({
            feeType: feeTypeStr,
            amount: amount,
            discount: discount,
            month: fee.month || 'Admission',
            isMonthly: false,
            className: primaryClassName,
          });
        }
      }

      // Sort fee items: Admission fee first, then monthly fees in order
      allFeeItems.sort((a, b) => {
        if (a.month === 'Admission') return -1;
        if (b.month === 'Admission') return 1;
        return MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month);
      });

      // Create fee documents with proper paid amount distribution
      for (const item of allFeeItems) {
        const netAmount = item.amount - item.discount;

        // Determine paid amount for this fee item
        let paidForThisItem = 0;
        if (remainingPayment > 0) {
          paidForThisItem = Math.min(remainingPayment, netAmount);
          remainingPayment -= paidForThisItem;
        }

        const dueAmount = Math.max(0, netAmount - paidForThisItem);

        const feeData = {
          enrollment: newEnrollment._id,
          student: studentDoc._id,
          studentId: enrollmentData.studentId,
          feeType: item.feeType,
          amount: item.amount,
          discount: item.discount,
          paidAmount: paidForThisItem,
          dueAmount: dueAmount,
          className: item.className,
          month: item.month,
          academicYear: payload.session || new Date().getFullYear().toString(),
          paymentMethod: payload.paymentMethod || 'cash',
          status:
            paidForThisItem >= netAmount
              ? 'paid'
              : paidForThisItem > 0
                ? 'partial'
                : 'unpaid',
        };

        const [createdFee] = await Fees.create([feeData], { session });
        feeDocs.push(createdFee._id);

        if (paidForThisItem > 0) {
          totalTransactionAmount += paidForThisItem;
          paidFeeIds.push(createdFee._id);
        }
      }
    }

    // IMPORTANT: Check if any fees were created
    if (feeDocs.length === 0) {
      throw new Error('No fee items were created');
    }

    // Update enrollment with fees
    newEnrollment.fees = feeDocs;
    await newEnrollment.save({ session });

    // Update student with fees
    studentDoc.fees = [...(studentDoc.fees || []), ...feeDocs];
    await studentDoc.save({ session });

    // 6. Create Payment & Receipt (if any payment was made)
    let createdPayment: any = null;
    let createdReceipt: any = null;

    if (totalTransactionAmount > 0 && paidFeeIds.length > 0) {
      // Generate unique receipt number
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      const receiptNo = `RCP-${timestamp}-${random}`;
      const transactionId = `TXN-${timestamp}`;

      // Create Payment
      const paymentData = {
        student: studentDoc._id,
        enrollment: newEnrollment._id,
        fees: paidFeeIds,
        totalAmount: totalTransactionAmount,
        paymentMethod: payload.paymentMethod || 'cash',
        receiptNo: receiptNo,
        transactionId: transactionId,
        status: 'completed',
        collectedBy: payload.collectedBy || 'Admin',
        paymentDate: new Date(),
      };

      const [payment] = await Payment.create([paymentData], { session });
      createdPayment = payment;

      // Get detailed fees for receipt
      const detailedReceiptFees = await Fees.find({
        _id: { $in: paidFeeIds },
      })
        .session(session)
        .lean();

      const receiptFeesStructure = detailedReceiptFees.map((f: any) => {
        const netAmount = Math.max(0, f.amount - (f.discount || 0));

        // Extract month for receipt
        let month = 'Admission';
        if (f.feeType && f.feeType.includes('Monthly Fee - ')) {
          const parts = f.feeType.split(' - ');
          if (parts.length > 1) month = parts[1];
        } else if (f.month) {
          month = f.month;
        }

        return {
          feeType: f.feeType,
          month: month,
          originalAmount: f.amount,
          discount: f.discount || 0,
          waiver: 0,
          netAmount: netAmount,
          paidAmount: f.paidAmount,
        };
      });

      const totalReceiptDiscount = receiptFeesStructure.reduce(
        (sum, item) => sum + (item.discount || 0),
        0,
      );

      // Create Receipt
      const receiptData = {
        receiptNo: receiptNo,
        student: studentDoc._id,
        studentName: payload.studentName,
        studentId: enrollmentData.studentId,
        className: primaryClassName,
        paymentId: createdPayment._id,
        totalAmount: totalTransactionAmount,
        paymentMethod: payload.paymentMethod || 'cash',
        paymentDate: new Date(),
        collectedBy: payload.collectedBy || 'Admin',
        transactionId: transactionId,
        fees: receiptFeesStructure,
        summary: {
          totalItems: receiptFeesStructure.length,
          subtotal: receiptFeesStructure.reduce(
            (sum, item) => sum + item.originalAmount,
            0,
          ),
          totalDiscount: totalReceiptDiscount,
          totalWaiver: 0,
          totalNetAmount: receiptFeesStructure.reduce(
            (sum, item) => sum + item.netAmount,
            0,
          ),
          amountPaid: totalTransactionAmount,
        },
        status: 'active',
      };

      const [receipt] = await Receipt.create([receiptData], { session });
      createdReceipt = receipt;

      // Update student document with payment and receipt references
      studentDoc.payments = [
        ...(studentDoc.payments || []),
        createdPayment._id,
      ];
      studentDoc.receipts = [
        ...(studentDoc.receipts || []),
        createdReceipt._id,
      ];
      await studentDoc.save({ session });

      // Update enrollment with payment reference
      newEnrollment.payment = createdPayment._id;
      await newEnrollment.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    // Populate all relations for the response - use type assertion to avoid TypeScript errors
    const populatedEnrollment = (await Enrollment.findById(newEnrollment._id)
      .populate({
        path: 'student',
        populate: [
          { path: 'payments' },
          { path: 'receipts' },
          { path: 'fees' },
          { path: 'user' },
        ],
      })
      .populate('className')
      .populate('fees')
      .lean()) as any; // Use type assertion to avoid TypeScript errors

    // Get the fully populated student with all relations
    const populatedStudent = (await Student.findById(studentDoc._id)
      .populate('payments')
      .populate('receipts')
      .populate('fees')
      .populate('user')
      .lean()) as any; // Use type assertion to avoid TypeScript errors

    // Get the populated payment and receipt
    let populatedPayment = null;
    let populatedReceipt = null;

    if (createdPayment) {
      populatedPayment = (await Payment.findById(createdPayment._id)
        .populate('fees')
        .lean()) as any;
    }

    if (createdReceipt) {
      populatedReceipt = (await Receipt.findById(createdReceipt._id)
        .populate('student')
        .lean()) as any;
    }

    return {
      success: true,
      message: 'Enrollment created successfully',
      data: {
        ...populatedEnrollment,
        student: populatedStudent,
        payment: populatedPayment,
        receipt: populatedReceipt,
        userCredentials: userDoc
          ? {
              email: userDoc.email,
              role: userDoc.role,
              // Don't send password in response
            }
          : null,
      },
    };
  } catch (error: any) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    console.error('Enrollment creation error:', error);
    return {
      success: false,
      message: error.message || 'Internal Server Error',
      error: error,
    };
  }
};
export const updateEnrollment = async (id: string, payload: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const enrollment = await Enrollment.findById(id).session(session);

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    // 1. Update Basic Enrollment Fields (excluding fees and financial totals)
    Object.keys(payload).forEach((key) => {
      if (
        key !== 'fees' &&
        key !== 'totalAmount' &&
        key !== 'paidAmount' &&
        key !== 'dueAmount' &&
        payload[key] !== undefined
      ) {
        // FIX: Cast enrollment to 'any' to allow dynamic key assignment
        (enrollment as any)[key] = payload[key];
      }
    });

    await enrollment.save({ session });

    // 2. Process Fees if provided in payload
    if (
      payload.fees &&
      Array.isArray(payload.fees) &&
      payload.fees.length > 0
    ) {
      // A. Clean up old data to prevent conflicts
      // Find old fee IDs
      const oldFees = await Fees.find({ enrollment: enrollment._id }).session(
        session,
      );
      const oldFeeIds = oldFees.map((f: any) => f._id);

      if (oldFeeIds.length > 0) {
        // Find and delete Payments linked to old fees
        const oldPayments = await Payment.find({
          fees: { $in: oldFeeIds },
        }).session(session);
        const oldPaymentIds = oldPayments.map((p: any) => p._id);

        if (oldPaymentIds.length > 0) {
          // Delete Receipts linked to old payments
          await Receipt.deleteMany({
            paymentId: { $in: oldPaymentIds },
          }).session(session);
          // Delete Payments
          await Payment.deleteMany({ _id: { $in: oldPaymentIds } }).session(
            session,
          );
        }

        // Remove old fees from Student document
        const studentDoc = await Student.findById(enrollment.student).session(
          session,
        );
        if (studentDoc) {
          studentDoc.fees = studentDoc.fees?.filter(
            (fid: any) => !oldFeeIds.includes(fid),
          );
          studentDoc.payments = studentDoc.payments?.filter(
            (pid: any) => !oldPaymentIds.includes(pid),
          );
          // Note: Receipts might need filtering too if stored on student, but usually not required for basic logic
          await studentDoc.save({ session });
        }

        // Delete Old Fees
        await Fees.deleteMany({ enrollment: enrollment._id }).session(session);
      }

      // B. Create New Fees (Logic similar to createEnrollment)
      const feeDocs: mongoose.Types.ObjectId[] = [];
      const paymentFeesLink: {
        fee: mongoose.Types.ObjectId;
        amountPaid: number;
      }[] = [];
      const receiptFeesData: any[] = [];

      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      const currentDate = new Date();
      const currentMonthIndex = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Variables to recalculate exact totals
      let calculatedTotalAmount = 0;
      let calculatedPaidAmount = 0;
      let calculatedDueAmount = 0;

      // Group fees
      const monthlyFees = payload.fees.filter((fee: any) =>
        String(fee.feeType).toLowerCase().includes('monthly'),
      );
      const otherFees = payload.fees.filter(
        (fee: any) => !String(fee.feeType).toLowerCase().includes('monthly'),
      );

      // A. Process Monthly Fees (Create 12 records)
      for (const fee of monthlyFees) {
        if (!fee.feeType || !fee.className) continue;

        const actualFeeType =
          typeof fee.feeType === 'object'
            ? fee.feeType.label || fee.feeType.value
            : fee.feeType;
        const actualClassName =
          typeof fee.className === 'object'
            ? fee.className.label || fee.className.value
            : fee.className;
        const category = fee.category || '';
        const amountPerMonth = Number(fee.amount) || 0;

        // Discount logic
        const totalDiscountInput = Number(fee.discount) || 0;
        const discountPerMonth = totalDiscountInput / 12;

        const transactionPaidAmount = Number(fee.advanceAmount) || 0;

        for (let i = 0; i < 12; i++) {
          const isCurrentMonth = i === currentMonthIndex;
          const monthName = monthNames[i];
          const monthKey = `${monthName}-${currentYear}`;

          let monthPaidAmount = 0;

          // KEY LOGIC: Only pay the current month
          if (isCurrentMonth) {
            monthPaidAmount = transactionPaidAmount;
          } else {
            monthPaidAmount = 0;
          }

          const netAmount = Math.max(0, amountPerMonth - discountPerMonth);
          const monthDueAmount = Math.max(0, netAmount - monthPaidAmount);

          let status = 'unpaid';
          if (monthDueAmount <= 0) status = 'paid';
          else if (monthPaidAmount > 0) status = 'partial';

          const feeData: any = {
            enrollment: enrollment._id,
            student: enrollment.student,
            feeType: actualFeeType,
            class: actualClassName,
            category: category,
            month: monthKey,
            amount: amountPerMonth,
            discount: discountPerMonth,
            paidAmount: monthPaidAmount,
            dueAmount: monthDueAmount,
            status: status,
            academicYear: currentYear.toString(),
            isCurrentMonth: isCurrentMonth,
            paymentMethod: fee.paymentMethod || payload.paymentMethod || 'cash',
          };

          const [createdFee] = await Fees.create([feeData], { session });
          feeDocs.push(createdFee._id);

          // Update running totals
          calculatedTotalAmount += amountPerMonth;
          calculatedPaidAmount += monthPaidAmount;
          calculatedDueAmount += monthDueAmount;

          // Add to Payment/Receipt if paid
          if (monthPaidAmount > 0) {
            paymentFeesLink.push({
              fee: createdFee._id,
              amountPaid: monthPaidAmount,
            });
            receiptFeesData.push({
              feeType: actualFeeType,
              month: monthName,
              originalAmount: amountPerMonth,
              discount: discountPerMonth,
              waiver: 0,
              netAmount: netAmount,
              paidAmount: monthPaidAmount,
            });
          }
        }
      }

      // B. Process Other Fees (Create 1 record)
      for (const fee of otherFees) {
        if (!fee.feeType || !fee.className) continue;

        const actualFeeType =
          typeof fee.feeType === 'object'
            ? fee.feeType.label || fee.feeType.value
            : fee.feeType;
        const actualClassName =
          typeof fee.className === 'object'
            ? fee.className.label || fee.className.value
            : fee.className;
        const category = fee.category || '';

        const amount = Number(fee.amount) || 0;
        const discount = Number(fee.discount) || 0;
        const transactionPaidAmount = Number(fee.advanceAmount) || 0;

        const netAmount = Math.max(0, amount - discount);
        const dueAmount = Math.max(0, netAmount - transactionPaidAmount);

        let status = 'unpaid';
        if (dueAmount <= 0) status = 'paid';
        else if (transactionPaidAmount > 0) status = 'partial';

        const feeData: any = {
          enrollment: enrollment._id,
          student: enrollment.student,
          feeType: actualFeeType,
          class: actualClassName,
          category: category,
          month: `${monthNames[currentMonthIndex]}-${currentYear}`,
          amount: amount,
          discount: discount,
          paidAmount: transactionPaidAmount,
          dueAmount: dueAmount,
          status: status,
          academicYear: currentYear.toString(),
          isCurrentMonth: true,
          paymentMethod: fee.paymentMethod || payload.paymentMethod || 'cash',
        };

        const [createdFee] = await Fees.create([feeData], { session });
        feeDocs.push(createdFee._id);

        calculatedTotalAmount += amount;
        calculatedPaidAmount += transactionPaidAmount;
        calculatedDueAmount += dueAmount;

        if (transactionPaidAmount > 0) {
          paymentFeesLink.push({
            fee: createdFee._id,
            amountPaid: transactionPaidAmount,
          });
          receiptFeesData.push({
            feeType: actualFeeType,
            month: 'One-time',
            originalAmount: amount,
            discount: discount,
            waiver: 0,
            netAmount: netAmount,
            paidAmount: transactionPaidAmount,
          });
        }
      }

      // C. Update Enrollment Totals
      enrollment.fees = feeDocs;
      enrollment.totalAmount = calculatedTotalAmount;
      enrollment.paidAmount = calculatedPaidAmount;
      enrollment.dueAmount = calculatedDueAmount;
      enrollment.totalDiscount = payload.totalDiscount || 0;

      // Determine final payment status
      if (calculatedDueAmount <= 0) enrollment.paymentStatus = 'paid';
      else if (calculatedPaidAmount > 0) enrollment.paymentStatus = 'partial';
      else enrollment.paymentStatus = 'pending';

      await enrollment.save({ session });

      // D. Link Fees to Student
      const studentDoc = await Student.findById(enrollment.student).session(
        session,
      );
      if (studentDoc) {
        const existingFees = studentDoc.fees || [];
        // Add new fee IDs
        studentDoc.fees = [
          ...existingFees,
          ...feeDocs.map((id) => id.toString()),
        ]
          .filter((value, index, self) => self.indexOf(value) === index) // Unique
          .map((id) => new mongoose.Types.ObjectId(id));

        await studentDoc.save({ session });
      }

      // E. Create Payment Document (If anything was paid)
      let createdPaymentId = null;
      if (paymentFeesLink.length > 0) {
        const totalTransactionAmount = paymentFeesLink.reduce(
          (sum, item) => sum + item.amountPaid,
          0,
        );

        const paymentData = {
          student: enrollment.student,
          enrollment: enrollment._id,
          fees: paymentFeesLink.map((d) => d.fee),
          totalAmount: totalTransactionAmount,
          paymentMethod: payload.paymentMethod || 'cash',
          paymentDate: new Date(),
          receiptNo: `RCP-UPD-${Date.now()}`,
          transactionId: `TXN-UPD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          note: 'Enrollment Update Payment',
          collectedBy: 'System',
          status: 'completed',
          receiptType: 'bulk',
          receiptData: { items: paymentFeesLink },
        };

        const [newPayment] = await Payment.create([paymentData], { session });
        createdPaymentId = newPayment._id;

        // Link Payment to Student
        if (studentDoc) {
          const existingPayments = studentDoc.payments || [];
          if (!existingPayments.includes(createdPaymentId)) {
            studentDoc.payments = [...existingPayments, createdPaymentId];
            await studentDoc.save({ session });
          }
        }
      }

      // F. Create Receipt Document (If payment exists)
      if (createdPaymentId && receiptFeesData.length > 0) {
        const totalItems = receiptFeesData.length;
        const subtotal = receiptFeesData.reduce(
          (sum, item) => sum + item.originalAmount,
          0,
        );
        const totalDiscount = receiptFeesData.reduce(
          (sum, item) => sum + item.discount,
          0,
        );
        const totalNetAmount = receiptFeesData.reduce(
          (sum, item) => sum + item.netAmount,
          0,
        );
        const amountPaid = receiptFeesData.reduce(
          (sum, item) => sum + item.paidAmount,
          0,
        );

        const receiptData: any = {
          receiptNo: `RCP-UPD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          student: enrollment.student,
          studentName: enrollment.studentName,
          studentId: enrollment.studentId,
          className: enrollment.className, // ID
          paymentId: createdPaymentId,
          totalAmount: amountPaid,
          paymentMethod: payload.paymentMethod || 'cash',
          paymentDate: new Date(),
          collectedBy: 'System',
          fees: receiptFeesData,
          summary: {
            totalItems,
            subtotal,
            totalDiscount,
            totalWaiver: 0,
            totalNetAmount,
            amountPaid,
          },
          status: 'active',
        };

        const [newReceipt] = await Receipt.create([receiptData], { session });

        // Link Receipt to Student
        if (studentDoc) {
          studentDoc.receipts = studentDoc.receipts || [];
          if (!studentDoc.receipts.includes(newReceipt._id)) {
            studentDoc.receipts.push(newReceipt._id);
            await studentDoc.save({ session });
          }
        }
      }
    }

    await session.commitTransaction();
    session.endSession();

    const updatedEnrollment = await Enrollment.findById(id)
      .populate('student')
      .populate('fees')
      .populate('className');

    return {
      success: true,
      message: 'Enrollment updated successfully',
      data: updatedEnrollment,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error('Enrollment update error:', error);
    return {
      success: false,
      message: error.message || 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }
};

export const deleteEnrollment = async (id: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existing = await Enrollment.findById(id).session(session);
    if (!existing) {
      throw new AppError(httpStatus.NOT_FOUND, 'Enrollment not found');
    }
    await Fees.deleteMany({ enrollment: id }).session(session);

    await Enrollment.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      message: 'Enrollment and associated fees deleted successfully',
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete');
  }
};

const promoteEnrollment = async (
  studentId: string,
  newClassId: string,
  rollNumber?: string,
  section?: string,
) => {
  const sessionTransaction = await mongoose.startSession();
  sessionTransaction.startTransaction();

  try {
    // 1. Find Student
    const student =
      await Student.findById(studentId).session(sessionTransaction);
    if (!student) {
      throw new AppError(httpStatus.NOT_FOUND, 'Student not found');
    }

    // 2. Find the CURRENT ACTIVE enrollment (No session filter)
    const currentEnrollment = await Enrollment.findOne({
      student: studentId,
      status: 'active', // Currently active class (e.g., Hifz)
    })
      .sort({ createdAt: -1 })
      .populate('className')
      .session(sessionTransaction);

    if (!currentEnrollment) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'No active enrollment found for this student',
      );
    }

    // 3. Validate the Target Class (e.g., Class 1)
    const newClass =
      await Class.findById(newClassId).session(sessionTransaction);
    if (!newClass) {
      throw new AppError(httpStatus.NOT_FOUND, 'Target class not found');
    }

    // 4. Prevent duplicate promotion (Check if already active in this class)
    const alreadyEnrolledInClass = await Enrollment.findOne({
      student: studentId,
      className: newClassId,
      status: 'active',
    }).session(sessionTransaction);

    if (alreadyEnrolledInClass) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Student is already active in this class',
      );
    }

    // 5. Prepare Data for New Enrollment
    const currentYear = new Date().getFullYear();

    // Note: We store year just for record keeping, but promotion is based on class hierarchy
    const newEnrollmentData: any = {
      student: new Types.ObjectId(studentId),
      studentId: student.studentId || '',
      studentName: student.name || '',
      nameBangla: student.nameBangla || '',
      mobileNo: student.mobile || currentEnrollment.mobileNo || '',
      rollNumber:
        rollNumber ||
        (currentEnrollment.rollNumber
          ? String(Number(currentEnrollment.rollNumber) + 1)
          : '1'),
      gender: student.gender || currentEnrollment.gender || '',
      birthDate: student.birthDate || currentEnrollment.birthDate || '',

      // KEY CHANGE: New Class ID
      className: [new Types.ObjectId(newClassId)],

      section: section || currentEnrollment.section || '',
      roll:
        rollNumber ||
        (currentEnrollment.roll
          ? String(Number(currentEnrollment.roll) + 1)
          : '1'),

      // Session is just the year for record, logic doesn't depend on it
      session: currentYear.toString(),

      batch: currentEnrollment.batch || '',
      studentType: currentEnrollment.studentType || '',
      studentDepartment: currentEnrollment.studentDepartment || 'hifz',
      fatherName: currentEnrollment.fatherName || student.fatherName || '',
      fatherMobile:
        currentEnrollment.fatherMobile || student.fatherMobile || '',
      motherName: currentEnrollment.motherName || student.motherName || '',
      motherMobile:
        currentEnrollment.motherMobile || student.motherMobile || '',
      guardianInfo:
        currentEnrollment.guardianInfo || student.guardianInfo || {},
      presentAddress:
        currentEnrollment.presentAddress || student.presentAddress || {},
      permanentAddress:
        currentEnrollment.permanentAddress || student.permanentAddress || {},
      documents: currentEnrollment.documents || student.documents || {},
      previousSchool:
        currentEnrollment.previousSchool || student.previousSchool || {},
      termsAccepted: true,
      admissionType: 'promotion',
      promotedFrom: currentEnrollment._id,
      status: 'active',
      paymentStatus: 'pending',
      fees: [],
    };

    // 6. Create New Enrollment
    const [newEnrollment] = await Enrollment.create([newEnrollmentData], {
      session: sessionTransaction,
    });

    // 7. Update OLD Enrollment to 'passed'
    currentEnrollment.promotedTo = newEnrollment._id;
    currentEnrollment.status = 'passed';
    await currentEnrollment.save({ session: sessionTransaction });

    // 8. Update Student's Current Class
    student.className = [new Types.ObjectId(newClassId)];
    await student.save({ session: sessionTransaction });

    // 9. Generate Fees based on NEW Class (Hifz -> Class 1 fees will be different)
    const feeDocs: mongoose.Types.ObjectId[] = [];
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth();
    const currentMonth = monthNames[currentMonthIndex];

    if (newClass.feeStructure && Array.isArray(newClass.feeStructure)) {
      for (const feeStructure of newClass.feeStructure) {
        const feeType = feeStructure.feeType || '';
        const amount = feeStructure.amount || 0;
        const isMonthly = feeStructure.isMonthly || false;

        if (isMonthly && amount > 0) {
          const monthlyAmount = amount;

          for (let i = 0; i < 12; i++) {
            const isCurrentMonth = i === currentMonthIndex;
            const monthName = monthNames[i];
            const monthKey = `${monthName}-${currentYear}`;

            const monthFeeData: any = {
              enrollment: newEnrollment._id,
              student: new Types.ObjectId(studentId),
              feeType: feeType,
              class: newClass.className || newClassId,
              month: monthKey,
              amount: monthlyAmount,
              paidAmount: 0,
              discount: 0,
              waiver: 0,
              dueAmount: monthlyAmount,
              status: 'unpaid',
              academicYear: currentYear.toString(),
              isCurrentMonth: isCurrentMonth,
              isMonthly: true,
            };

            const [monthlyFee] = await Fees.create([monthFeeData], {
              session: sessionTransaction,
            });
            feeDocs.push(monthlyFee._id as mongoose.Types.ObjectId);
          }
        } else if (amount > 0) {
          // One-time fee
          const feeData: any = {
            enrollment: newEnrollment._id,
            student: new Types.ObjectId(studentId),
            feeType: feeType,
            class: newClass.className || newClassId,
            month: `${currentMonth}-${currentYear}`,
            amount: amount,
            paidAmount: 0,
            discount: 0,
            waiver: 0,
            dueAmount: amount,
            status: 'unpaid',
            academicYear: currentYear.toString(),
            isCurrentMonth: true,
          };

          const [newFee] = await Fees.create([feeData], {
            session: sessionTransaction,
          });
          feeDocs.push(newFee._id as mongoose.Types.ObjectId);
        }
      }

      // Link Fees
      if (feeDocs.length > 0) {
        newEnrollment.fees = feeDocs;
        await newEnrollment.save({ session: sessionTransaction });

        const existingStudentFees = student.fees
          ? student.fees.map((id: any) => id.toString())
          : [];

        const newFeeIds = feeDocs
          .map((id) => id.toString())
          .filter((id) => !existingStudentFees.includes(id));

        if (newFeeIds.length > 0) {
          const allFeeIds = [...existingStudentFees, ...newFeeIds];
          student.fees = allFeeIds.map((id) => new Types.ObjectId(id));
          await student.save({ session: sessionTransaction });
        }
      }
    }

    await sessionTransaction.commitTransaction();
    sessionTransaction.endSession();

    const populatedEnrollment = await Enrollment.findById(newEnrollment._id)
      .populate('student')
      .populate('className')
      .populate('fees')
      .populate({
        path: 'promotedFrom',
        populate: { path: 'className' },
      });

    return {
      success: true,
      message: 'Student promoted successfully',
      data: {
        oldEnrollment: {
          id: currentEnrollment._id,
          class: currentEnrollment.className,
          status: currentEnrollment.status,
        },
        newEnrollment: populatedEnrollment,
      },
    };
  } catch (error: any) {
    await sessionTransaction.abortTransaction();
    sessionTransaction.endSession();
    console.error('Promotion error:', error);

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to promote student',
    );
  }
};

const bulkPromoteEnrollments = async (promotions: any[]) => {
  const sessionTransaction = await mongoose.startSession();
  sessionTransaction.startTransaction();

  try {
    const results: any[] = [];
    const errors: any[] = [];

    for (const promotion of promotions) {
      try {
        const { studentId, newClassId, rollNumber, section } = promotion;

        // 1. Validation
        if (!studentId || !newClassId) {
          errors.push({
            studentId: studentId || 'unknown',
            error: 'Student ID and Class ID are required',
          });
          continue;
        }

        // 2. Find Student
        const student =
          await Student.findById(studentId).session(sessionTransaction);
        if (!student) {
          errors.push({ studentId, error: 'Student not found' });
          continue;
        }

        // 3. Find Current Active Enrollment (No Session Check)
        const currentEnrollment = await Enrollment.findOne({
          student: studentId,
          status: 'active',
        })
          .sort({ createdAt: -1 })
          .session(sessionTransaction);

        if (!currentEnrollment) {
          errors.push({ studentId, error: 'No active enrollment found' });
          continue;
        }

        // 4. Validate New Class
        const newClass =
          await Class.findById(newClassId).session(sessionTransaction);
        if (!newClass) {
          errors.push({ studentId, error: 'New class not found' });
          continue;
        }

        // 5. Check if already enrolled
        const alreadyEnrolled = await Enrollment.findOne({
          student: studentId,
          className: newClassId,
          status: 'active',
        }).session(sessionTransaction);

        if (alreadyEnrolled) {
          errors.push({ studentId, error: 'Already active in this class' });
          continue;
        }

        // 6. Create New Enrollment
        const currentYear = new Date().getFullYear();
        const newEnrollmentData: any = {
          student: new Types.ObjectId(studentId),
          studentId: student.studentId || '',
          studentName: student.name || '',
          className: [new Types.ObjectId(newClassId)],
          section: section || currentEnrollment.section || '',
          roll:
            rollNumber ||
            (currentEnrollment.roll
              ? String(Number(currentEnrollment.roll) + 1)
              : '1'),
          session: currentYear.toString(),
          admissionType: 'promotion',
          promotedFrom: currentEnrollment._id,
          status: 'active',
          paymentStatus: 'pending',
          fees: [],
          termsAccepted: true,
        };

        const [newEnrollment] = await Enrollment.create([newEnrollmentData], {
          session: sessionTransaction,
        });

        currentEnrollment.promotedTo = newEnrollment._id;
        currentEnrollment.status = 'passed';
        await currentEnrollment.save({ session: sessionTransaction });

        student.className = [new Types.ObjectId(newClassId)];
        await student.save({ session: sessionTransaction });

        results.push({
          studentId,
          studentName: student.name,
          oldClass: currentEnrollment.className,
          newClassId: newClassId,
          newEnrollmentId: newEnrollment._id,
        });
      } catch (error: any) {
        errors.push({
          studentId: promotion.studentId,
          error: error.message,
        });
      }
    }

    await sessionTransaction.commitTransaction();
    sessionTransaction.endSession();

    return {
      success: true,
      message: `Bulk promotion completed. Success: ${results.length}, Failed: ${errors.length}`,
      data: { results, errors },
    };
  } catch (error: any) {
    await sessionTransaction.abortTransaction();
    sessionTransaction.endSession();
    throw error;
  }
};

const getPromotionHistory = async (studentId: string) => {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid student ID');
  }

  const student = await Student.findById(studentId);
  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, 'Student not found');
  }

  const enrollments = await Enrollment.find({ student: studentId })
    .sort({ createdAt: 1 })
    .populate('className', 'className')
    .select('className status admissionType createdAt roll promotedFrom');

  const history = enrollments.map((enrollment: any) => ({
    enrollmentId: enrollment._id,
    className: enrollment.className?.[0]?.className || 'N/A',
    status: enrollment.status,
    admissionType: enrollment.admissionType,
    roll: enrollment.roll,
    createdAt: enrollment.createdAt,
  }));

  return {
    success: true,
    message: 'Promotion history retrieved successfully',
    data: {
      studentName: student.name,
      studentId: student.studentId,
      history: history,
    },
  };
};

const getPromotionEligibleStudents = async (classId: string) => {
  if (!mongoose.Types.ObjectId.isValid(classId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid Class ID');
  }

  const classExists = await Class.findById(classId);
  if (!classExists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Class not found');
  }

  const eligibleEnrollments = await Enrollment.find({
    className: classId,
    status: 'active',
  })
    .populate({
      path: 'student',
      select: 'name studentId mobile fatherName',
    })
    .populate('className', 'className')
    .sort({ roll: 1 });

  if (!eligibleEnrollments || eligibleEnrollments.length === 0) {
    return {
      success: true,
      message: 'No active students found in this class',
      data: [],
    };
  }

  const formattedStudents = eligibleEnrollments.map((enrollment: any) => ({
    enrollmentId: enrollment._id,
    studentId: enrollment.student._id,
    studentIdentifier: enrollment.student.studentId,
    studentName: enrollment.student.name,
    currentClass: enrollment.className?.[0]?.className || 'N/A',
    currentRoll: enrollment.roll,
    section: enrollment.section,
    fatherName: enrollment.student.fatherName,
    mobile: enrollment.student.mobile,
  }));

  return {
    success: true,
    message: 'Eligible students retrieved successfully',
    data: {
      sourceClass: classExists.className,
      students: formattedStudents,
    },
  };
};

const bulkRetainEnrollments = async (promotions: any[]) => {
  const sessionTransaction = await mongoose.startSession();
  sessionTransaction.startTransaction();

  try {
    const results: any[] = [];
    const errors: any[] = [];

    for (const promotion of promotions) {
      try {
        const { studentId, rollNumber, section } = promotion;

        if (!studentId) {
          errors.push({
            studentId: studentId || 'unknown',
            error: 'Student ID is required',
          });
          continue;
        }

        // fin student
        const student =
          await Student.findById(studentId).session(sessionTransaction);
        if (!student) {
          errors.push({ studentId, error: 'Student not found' });
          continue;
        }

        // 3. find Active Enrollment
        const currentEnrollment = await Enrollment.findOne({
          student: studentId,
          status: 'active',
        })
          .sort({ createdAt: -1 })
          .session(sessionTransaction);

        if (!currentEnrollment) {
          errors.push({ studentId, error: 'No active enrollment found' });
          continue;
        }

        // const currentClassId = currentEnrollment.className[0] ;
        const currentClassId = (currentEnrollment.className as any)[0];

        const currentClass =
          await Class.findById(currentClassId).session(sessionTransaction);

        if (!currentClass) {
          errors.push({ studentId, error: 'Current class data not found' });
          continue;
        }

        const currentYear = new Date().getFullYear();

        const newEnrollmentData: any = {
          student: new Types.ObjectId(studentId),
          studentId: student.studentId || '',
          studentName: student.name || '',

          className: [new Types.ObjectId(currentClassId)],

          section: section || currentEnrollment.section || '',
          roll:
            rollNumber ||
            (currentEnrollment.roll
              ? String(Number(currentEnrollment.roll) + 1)
              : '1'),
          session: currentYear.toString(),

          admissionType: 'admission',
          promotedFrom: currentEnrollment._id,
          status: 'active',
          paymentStatus: 'pending',
          fees: [],
          termsAccepted: true,

          fatherName: currentEnrollment.fatherName,
          motherName: currentEnrollment.motherName,
          mobileNo: currentEnrollment.mobileNo,
          studentDepartment: currentEnrollment.studentDepartment,
        };

        const [newEnrollment] = await Enrollment.create([newEnrollmentData], {
          session: sessionTransaction,
        });

        currentEnrollment.promotedTo = newEnrollment._id;
        currentEnrollment.status = 'failed';
        await currentEnrollment.save({ session: sessionTransaction });

        student.className = [new Types.ObjectId(currentClassId)];
        await student.save({ session: sessionTransaction });

        const feeDocs: mongoose.Types.ObjectId[] = [];
        const monthNames = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];

        const currentDate = new Date();
        const currentMonthIndex = currentDate.getMonth();
        const currentMonth = monthNames[currentMonthIndex];

        if (
          currentClass.feeStructure &&
          Array.isArray(currentClass.feeStructure)
        ) {
          for (const feeStructure of currentClass.feeStructure) {
            const feeType = feeStructure.feeType || '';
            const amount = feeStructure.amount || 0;
            const isMonthly = feeStructure.isMonthly || false;

            if (isMonthly && amount > 0) {
              const monthlyAmount = amount;

              for (let i = 0; i < 12; i++) {
                const isCurrentMonth = i === currentMonthIndex;
                const monthName = monthNames[i];
                const monthKey = `${monthName}-${currentYear}`;

                const monthFeeData: any = {
                  enrollment: newEnrollment._id,
                  student: new Types.ObjectId(studentId),
                  feeType: feeType,
                  class: currentClass.className || currentClassId,
                  month: monthKey,
                  amount: monthlyAmount,
                  paidAmount: 0,
                  discount: 0,
                  waiver: 0,
                  dueAmount: monthlyAmount,
                  status: 'unpaid',
                  academicYear: currentYear.toString(),
                  isCurrentMonth: isCurrentMonth,
                  isMonthly: true,
                };

                const [monthlyFee] = await Fees.create([monthFeeData], {
                  session: sessionTransaction,
                });
                feeDocs.push(monthlyFee._id as mongoose.Types.ObjectId);
              }
            } else if (amount > 0) {
              // One-time fee
              const feeData: any = {
                enrollment: newEnrollment._id,
                student: new Types.ObjectId(studentId),
                feeType: feeType,
                class: currentClass.className || currentClassId,
                month: `${currentMonth}-${currentYear}`,
                amount: amount,
                paidAmount: 0,
                discount: 0,
                waiver: 0,
                dueAmount: amount,
                status: 'unpaid',
                academicYear: currentYear.toString(),
                isCurrentMonth: true,
              };

              const [newFee] = await Fees.create([feeData], {
                session: sessionTransaction,
              });
              feeDocs.push(newFee._id as mongoose.Types.ObjectId);
            }
          }

          // ফি অ্যাটাচ করুন
          if (feeDocs.length > 0) {
            newEnrollment.fees = feeDocs;
            await newEnrollment.save({ session: sessionTransaction });

            const existingStudentFees = student.fees
              ? student.fees.map((id: any) => id.toString())
              : [];
            const newFeeIds = feeDocs
              .map((id) => id.toString())
              .filter((id) => !existingStudentFees.includes(id));

            if (newFeeIds.length > 0) {
              const allFeeIds = [...existingStudentFees, ...newFeeIds];
              student.fees = allFeeIds.map((id) => new Types.ObjectId(id));
              await student.save({ session: sessionTransaction });
            }
          }
        }

        results.push({
          studentId,
          studentName: student.name,
          status: 'retained',
          newEnrollmentId: newEnrollment._id,
        });
      } catch (error: any) {
        errors.push({
          studentId: promotion.studentId,
          error: error.message,
        });
      }
    }

    await sessionTransaction.commitTransaction();
    sessionTransaction.endSession();

    return {
      success: true,
      message: `Bulk retention completed. Success: ${results.length}, Failed: ${errors.length}`,
      data: { results, errors },
    };
  } catch (error: any) {
    await sessionTransaction.abortTransaction();
    sessionTransaction.endSession();
    throw error;
  }
};

export const enrollmentServices = {
  createEnrollment,
  promoteEnrollment,
  bulkPromoteEnrollments,
  getAllEnrollments,
  getSingleEnrollment,
  updateEnrollment,
  deleteEnrollment,
  getPromotionHistory,
  getPromotionEligibleStudents,
  bulkRetainEnrollments,
};
