import httpStatus from 'http-status';
import sendResponse from '../../../utils/sendResponse';
import { catchAsync } from '../../../utils/catchAsync';
import { enrollmentServices } from './service';

// export const createEnrollment = async (payload: any) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // 1. Normalize Class Data
//     let classIds: string[] = [];
//     if (Array.isArray(payload.className)) {
//       classIds = payload.className
//         .filter((cls: any) => cls && cls !== '')
//         .map((cls: any) => {
//           if (typeof cls === 'object') {
//             if (cls._id) return cls._id.toString();
//             if (cls.value) return cls.value.toString();
//             if (cls.id) return cls.id.toString();
//           }
//           return typeof cls === 'string' ? cls.trim() : cls;
//         });
//     } else if (payload.className) {
//       const cls = payload.className;
//       if (typeof cls === 'object' && (cls._id || cls.value || cls.id)) {
//         classIds = [(cls._id || cls.value || cls.id).toString()];
//       } else if (typeof cls === 'string' && cls.trim()) {
//         classIds = [cls.trim()];
//       }
//     }

//     console.log('conver class id this ', classIds);

//     if (!classIds.length) throw new Error('At least one class is required');

//     const validClassIds = classIds.filter((id) =>
//       mongoose.Types.ObjectId.isValid(id),
//     );
//     if (validClassIds.length === 0)
//       throw new Error('Invalid class ID(s) provided');
//     classIds = validClassIds;

//     // 2. Prepare Enrollment Data
//     const enrollmentData: any = {
//       studentId: payload.studentId || '',
//       studentName: payload.studentName || '',
//       nameBangla: payload.nameBangla || '',
//       studentPhoto: payload.studentPhoto || '',
//       mobileNo: payload.mobileNo || '',
//       rollNumber: payload.rollNumber || '',
//       gender: payload.gender || '',
//       birthDate: payload.birthDate || '',
//       birthRegistrationNo: payload.birthRegistrationNo || '',
//       bloodGroup: payload.bloodGroup || '',
//       nationality: payload.nationality || 'Bangladeshi',
//       className: classIds[0],
//       section: payload.section || '',
//       roll: payload.roll || payload.rollNumber || '',
//       session: payload.session || new Date().getFullYear().toString(),
//       batch: payload.group || '',
//       studentType: payload.studentType || '',
//       studentDepartment: payload.studentDepartment || 'hifz',
//       fatherName: payload.fatherName || '',
//       fatherNameBangla: payload.fatherNameBangla || '',
//       fatherMobile: payload.fatherMobile || '',
//       fatherNid: payload.fatherNid || '',
//       fatherProfession: payload.fatherProfession || '',
//       fatherIncome: payload.fatherIncome || 0,
//       motherName: payload.motherName || '',
//       motherNameBangla: payload.motherNameBangla || '',
//       motherMobile: payload.motherMobile || '',
//       motherNid: payload.motherNid || '',
//       motherProfession: payload.motherProfession || '',
//       motherIncome: payload.motherIncome || 0,
//       presentAddress: payload.presentAddress || {},
//       permanentAddress: payload.permanentAddress || {},
//       guardianInfo: payload.guardianInfo || {},
//       previousSchool: payload.previousSchool || {},
//       documents: payload.documents || {},
//       termsAccepted: payload.termsAccepted || false,
//       admissionType: payload.admissionType || 'admission',
//       paymentStatus: 'pending', // Will be updated later
//       status: 'active',
//       // We will calculate totals based on created fees for accuracy
//       totalAmount: 0,
//       totalDiscount: 0,
//       netPayable: 0,
//       paidAmount: 0,
//       dueAmount: 0,
//       advanceBalance: payload.advanceBalance || 0,
//       discountType: payload.discountType || 'flat',
//       discountAmount: payload.discountAmount || 0,
//       paymentMethod: payload.paymentMethod || 'cash',
//     };

//     // 3. Handle Student (Create or Update)
//     let studentDoc: any = null;
//     let studentId = null;

//     if (payload.studentId && payload.studentId.trim() !== '') {
//       studentDoc = await Student.findOne({
//         studentId: payload.studentId,
//       }).session(session);
//     }
//     if (!studentDoc && payload.mobileNo && payload.mobileNo.trim() !== '') {
//       studentDoc = await Student.findOne({ mobile: payload.mobileNo }).session(
//         session,
//       );
//     }

//     if (studentDoc) {
//       studentId = studentDoc._id;
//       enrollmentData.studentId = studentDoc.studentId;
//       // Update logic (if needed) or just use existing student
//     } else {
//       // Create new student
//       const newStudentId = await generateStudentId();
//       const email = payload.email || `${newStudentId}@craft.edu.bd`;

//       let user = null;
//       if (payload.createUser !== false) {
//         const [newUser] = await User.create(
//           [
//             {
//               name: payload.studentName || `Student ${newStudentId}`,
//               email,
//               password: 'student123',
//               role: 'student',
//               needsPasswordChange: true,
//             },
//           ],
//           { session },
//         );
//         user = newUser;
//       }

//       const studentData: any = {
//         studentId: newStudentId,
//         smartIdCard: `CRAFT${Date.now()}`,
//         name: payload.studentName || '',
//         nameBangla: payload.nameBangla || '',
//         mobile: payload.mobileNo || '',
//         email: email,
//         user: user?._id,
//         className: classIds.map((id) => new mongoose.Types.ObjectId(id)),
//         studentDepartment: payload.studentDepartment || 'hifz',
//         birthDate: payload.birthDate || '',
//         bloodGroup: payload.bloodGroup || '',
//         fatherName: payload.fatherName || '',
//         fatherMobile: payload.fatherMobile || '',
//         motherName: payload.motherName || '',
//         motherMobile: payload.motherMobile || '',
//         presentAddress: payload.presentAddress || {},
//         permanentAddress: payload.permanentAddress || {},
//         documents: payload.documents || {},
//         advanceBalance: payload.advanceBalance || 0,
//         status: 'active',
//       };
//       const [newStudent] = await Student.create([studentData], { session });
//       studentDoc = newStudent;
//       studentId = newStudent._id;
//       enrollmentData.studentId = newStudentId;
//     }

//     // 4. Create Enrollment
//     const [newEnrollment] = await Enrollment.create(
//       [{ ...enrollmentData, student: studentId }],
//       { session },
//     );

//     // 5. Process Fees & Payments (THE CORRECTED LOGIC)
//     const feeDocs: mongoose.Types.ObjectId[] = [];
//     const paymentFeesLink: {
//       fee: mongoose.Types.ObjectId;
//       amountPaid: number;
//     }[] = [];
//     const receiptFeesData: any[] = [];

//     const monthNames = [
//       'January',
//       'February',
//       'March',
//       'April',
//       'May',
//       'June',
//       'July',
//       'August',
//       'September',
//       'October',
//       'November',
//       'December',
//     ];
//     const currentDate = new Date();
//     const currentMonthIndex = currentDate.getMonth();
//     const currentYear = currentDate.getFullYear();

//     // Variables to recalculate exact totals for the Enrollment document
//     let calculatedTotalAmount = 0;
//     let calculatedPaidAmount = 0;
//     let calculatedDueAmount = 0;

//     if (
//       payload.fees &&
//       Array.isArray(payload.fees) &&
//       payload.fees.length > 0
//     ) {
//       // Group fees by type (Monthly vs Others)
//       const monthlyFees = payload.fees.filter((fee: any) =>
//         String(fee.feeType).toLowerCase().includes('monthly'),
//       );
//       const otherFees = payload.fees.filter(
//         (fee: any) => !String(fee.feeType).toLowerCase().includes('monthly'),
//       );

//       // A. Process Monthly Fees (Create 12 records)
//       for (const fee of monthlyFees) {
//         if (!fee.feeType || !fee.className) continue;

//         const actualFeeType =
//           typeof fee.feeType === 'object'
//             ? fee.feeType.label || fee.feeType.value
//             : fee.feeType;
//         const actualClassName =
//           typeof fee.className === 'object'
//             ? fee.className.label || fee.className.value
//             : fee.className;
//         const category = fee.category || '';
//         const amountPerMonth = Number(fee.amount) || 0;

//         // Discount logic: Assume input discount is for the whole year or monthly?
//         // Assuming input 'discount' is total for the year, divide by 12
//         const totalDiscountInput = Number(fee.discount) || 0;
//         const discountPerMonth = totalDiscountInput / 12;

//         const transactionPaidAmount = Number(fee.advanceAmount) || 0;

//         for (let i = 0; i < 12; i++) {
//           const isCurrentMonth = i === currentMonthIndex;
//           const monthName = monthNames[i];
//           const monthKey = `${monthName}-${currentYear}`;

//           let monthPaidAmount = 0;

//           // KEY LOGIC: Only pay the current month if it is a monthly fee.
//           // Future months remain unpaid (0).
//           if (isCurrentMonth) {
//             monthPaidAmount = transactionPaidAmount;
//           } else {
//             monthPaidAmount = 0;
//           }

//           const netAmount = Math.max(0, amountPerMonth - discountPerMonth);
//           const monthDueAmount = Math.max(0, netAmount - monthPaidAmount);

//           let status = 'unpaid';
//           if (monthDueAmount <= 0) status = 'paid';
//           else if (monthPaidAmount > 0) status = 'partial';

//           const feeData: any = {
//             enrollment: newEnrollment._id,
//             student: studentId,
//             feeType: actualFeeType,
//             class: actualClassName,
//             category: category,
//             month: monthKey,
//             amount: amountPerMonth,
//             discount: discountPerMonth,
//             paidAmount: monthPaidAmount,
//             dueAmount: monthDueAmount,
//             status: status,
//             academicYear: currentYear.toString(),
//             isCurrentMonth: isCurrentMonth,
//             paymentMethod: fee.paymentMethod || payload.paymentMethod || 'cash',
//           };

//           const [createdFee] = await Fees.create([feeData], { session });
//           feeDocs.push(createdFee._id);

//           // Update running totals for Enrollment
//           calculatedTotalAmount += amountPerMonth;
//           calculatedPaidAmount += monthPaidAmount;
//           calculatedDueAmount += monthDueAmount;

//           // If this month was paid, add to Payment & Receipt
//           if (monthPaidAmount > 0) {
//             paymentFeesLink.push({
//               fee: createdFee._id,
//               amountPaid: monthPaidAmount,
//             });
//             receiptFeesData.push({
//               feeType: actualFeeType,
//               month: monthName,
//               originalAmount: amountPerMonth,
//               discount: discountPerMonth,
//               waiver: 0,
//               netAmount: netAmount,
//               paidAmount: monthPaidAmount,
//             });
//           }
//         }
//       }

//       // B. Process Other Fees (Admission, Exam, etc.) - Create 1 record
//       for (const fee of otherFees) {
//         if (!fee.feeType || !fee.className) continue;

//         const actualFeeType =
//           typeof fee.feeType === 'object'
//             ? fee.feeType.label || fee.feeType.value
//             : fee.feeType;
//         const actualClassName =
//           typeof fee.className === 'object'
//             ? fee.className.label || fee.className.value
//             : fee.className;
//         const category = fee.category || '';

//         const amount = Number(fee.amount) || 0;
//         const discount = Number(fee.discount) || 0;
//         const transactionPaidAmount = Number(fee.advanceAmount) || 0;

//         const netAmount = Math.max(0, amount - discount);
//         const dueAmount = Math.max(0, netAmount - transactionPaidAmount);

//         let status = 'unpaid';
//         if (dueAmount <= 0) status = 'paid';
//         else if (transactionPaidAmount > 0) status = 'partial';

//         const feeData: any = {
//           enrollment: newEnrollment._id,
//           student: studentId,
//           feeType: actualFeeType,
//           class: actualClassName,
//           category: category,
//           month: `${monthNames[currentMonthIndex]}-${currentYear}`, // Assign to current month context
//           amount: amount,
//           discount: discount,
//           paidAmount: transactionPaidAmount,
//           dueAmount: dueAmount,
//           status: status,
//           academicYear: currentYear.toString(),
//           isCurrentMonth: true,
//           paymentMethod: fee.paymentMethod || payload.paymentMethod || 'cash',
//         };

//         const [createdFee] = await Fees.create([feeData], { session });
//         feeDocs.push(createdFee._id);

//         // Update running totals
//         calculatedTotalAmount += amount;
//         calculatedPaidAmount += transactionPaidAmount;
//         calculatedDueAmount += dueAmount;

//         if (transactionPaidAmount > 0) {
//           paymentFeesLink.push({
//             fee: createdFee._id,
//             amountPaid: transactionPaidAmount,
//           });
//           receiptFeesData.push({
//             feeType: actualFeeType,
//             month: 'One-time',
//             originalAmount: amount,
//             discount: discount,
//             waiver: 0,
//             netAmount: netAmount,
//             paidAmount: transactionPaidAmount,
//           });
//         }
//       }
//     }

//     // 6. Create SINGLE Payment Document (If anything was paid)
//     let createdPaymentId = null;
//     if (paymentFeesLink.length > 0) {
//       const totalTransactionAmount = paymentFeesLink.reduce(
//         (sum, item) => sum + item.amountPaid,
//         0,
//       );

//       const paymentData = {
//         student: studentId,
//         enrollment: newEnrollment._id,
//         fees: paymentFeesLink.map((d) => d.fee), // Array of fee IDs
//         totalAmount: totalTransactionAmount,
//         paymentMethod: payload.paymentMethod || 'cash',
//         paymentDate: new Date(),
//         receiptNo: `RCP-${Date.now()}`,
//         transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
//         note: 'Enrollment Payment',
//         collectedBy: 'System',
//         status: 'completed',
//         receiptType: 'bulk',
//         receiptData: { items: paymentFeesLink },
//       };

//       const [newPayment] = await Payment.create([paymentData], { session });
//       createdPaymentId = newPayment._id;
//     }

//     // 7. Create SINGLE Receipt Document (If payment exists)
//     if (createdPaymentId && receiptFeesData.length > 0) {
//       const totalItems = receiptFeesData.length;
//       const subtotal = receiptFeesData.reduce(
//         (sum, item) => sum + item.originalAmount,
//         0,
//       );
//       const totalDiscount = receiptFeesData.reduce(
//         (sum, item) => sum + item.discount,
//         0,
//       );
//       const totalNetAmount = receiptFeesData.reduce(
//         (sum, item) => sum + item.netAmount,
//         0,
//       );
//       const amountPaid = receiptFeesData.reduce(
//         (sum, item) => sum + item.paidAmount,
//         0,
//       );

//       const receiptData: any = {
//         receiptNo: `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
//         student: studentId,
//         studentName: enrollmentData.studentName,
//         studentId: enrollmentData.studentId,
//         className: enrollmentData.className, // ID
//         paymentId: createdPaymentId,
//         totalAmount: amountPaid, // Receipt shows what was actually paid
//         paymentMethod: payload.paymentMethod || 'cash',
//         paymentDate: new Date(),
//         collectedBy: 'System',
//         fees: receiptFeesData,
//         summary: {
//           totalItems,
//           subtotal,
//           totalDiscount,
//           totalWaiver: 0,
//           totalNetAmount,
//           amountPaid,
//         },
//         status: 'active',
//       };

//       const [newReceipt] = await Receipt.create([receiptData], { session });

//       // Link receipt to student if needed
//       studentDoc.receipts = studentDoc.receipts || [];
//       studentDoc.receipts.push(newReceipt._id);
//     }

//     // 8. Update Enrollment Totals & Documents
//     if (feeDocs.length > 0) {
//       newEnrollment.fees = feeDocs;

//       // IMPORTANT: Update enrollment totals based on ACTUAL fees created, not just payload input
//       newEnrollment.totalAmount = calculatedTotalAmount;
//       newEnrollment.paidAmount = calculatedPaidAmount;
//       newEnrollment.dueAmount = calculatedDueAmount;
//       newEnrollment.totalDiscount = payload.totalDiscount || 0; // Or sum of discounts from fees

//       // Determine final payment status
//       if (calculatedDueAmount <= 0) newEnrollment.paymentStatus = 'paid';
//       else if (calculatedPaidAmount > 0)
//         newEnrollment.paymentStatus = 'partial';

//       await newEnrollment.save({ session });

//       // Link fees to student
//       const existingFees = studentDoc.fees || [];
//       const newFeeIds = feeDocs
//         .map((id) => id.toString())
//         .filter((id) => !existingFees.includes(id));

//       if (newFeeIds.length > 0) {
//         studentDoc.fees = [...existingFees, ...newFeeIds].map(
//           (id) => new mongoose.Types.ObjectId(id),
//         );

//         // Link payment to student
//         if (createdPaymentId) {
//           const existingPayments = studentDoc.payments || [];
//           if (!existingPayments.includes(createdPaymentId)) {
//             studentDoc.payments = [...existingPayments, createdPaymentId];
//           }
//         }
//         await studentDoc.save({ session });
//       }
//     }

//     await session.commitTransaction();
//     session.endSession();

//     // Populate and return
//     const populatedEnrollment = await Enrollment.findById(newEnrollment._id)
//       .populate('student')
//       .populate('fees')
//       .populate('className');

//     return {
//       success: true,
//       message: 'Enrollment created successfully',
//       data: populatedEnrollment,
//     };
//   } catch (error: any) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error('Enrollment creation error:', error);
//     return {
//       success: false,
//       message: error.message || 'Internal Server Error',
//       error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
//     };
//   }
// };

const createEnrollment = catchAsync(async (req, res) => {
  const result = await enrollmentServices.createEnrollment(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Enrollment created successfully',
    data: result,
  });
});

const getAllEnrollments = catchAsync(async (req, res) => {
  const result = await enrollmentServices.getAllEnrollments(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Enrollments retrieved successfully',
    data: result,
  });
});

const getSingleEnrollment = catchAsync(async (req, res) => {
  const result = await enrollmentServices.getSingleEnrollment(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Enrollment retrieved successfully',
    data: result,
  });
});

const updateEnrollment = catchAsync(async (req, res) => {
  const result = await enrollmentServices.updateEnrollment(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Enrollment updated successfully',
    data: result,
  });
});

const deleteEnrollment = catchAsync(async (req, res) => {
  const result = await enrollmentServices.deleteEnrollment(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Enrollment deleted successfully',
    data: result,
  });
});

const promoteEnrollment = catchAsync(async (req, res) => {
  const { studentId, newClassId, session, rollNumber } = req.body;

  const result = await enrollmentServices.promoteEnrollment(
    studentId,
    newClassId,
    session,
    rollNumber,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});

const bulkPromoteEnrollments = catchAsync(async (req, res) => {
  const { promotions } = req.body;

  if (!promotions || !Array.isArray(promotions) || promotions.length === 0) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Promotions array and session are required',
      data: null,
    });
  }

  const result = await enrollmentServices.bulkPromoteEnrollments(promotions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});

const getPromotionHistory = catchAsync(async (req, res) => {
  const { studentId } = req.params;

  const result = await enrollmentServices.getPromotionHistory(studentId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Promotion history retrieved',
    data: result.data,
  });
});

const getPromotionEligibleStudents = catchAsync(async (req, res) => {
  const { classId } = req.query;
  console.log('this is class id ', classId);

  if (!classId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Class ID is required to find eligible students',
      data: null,
    });
  }

  const result = await enrollmentServices.getPromotionEligibleStudents(
    classId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Eligible students retrieved',
    data: result.data,
  });
});

const bulkRetainStudents = catchAsync(async (req, res) => {
  const { promotions } = req.body;

  if (!promotions || !Array.isArray(promotions) || promotions.length === 0) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Promotions array is required',
      data: null,
    });
  }

  const result = await enrollmentServices.bulkRetainEnrollments(promotions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});
export const enrollmentControllers = {
  createEnrollment,
  promoteEnrollment,
  bulkPromoteEnrollments,
  getAllEnrollments,
  getSingleEnrollment,
  updateEnrollment,
  deleteEnrollment,
  getPromotionHistory,
  getPromotionEligibleStudents,
  bulkRetainStudents,
};
