/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import { Enrollment } from './model';
import QueryBuilder from '../../builder/QueryBuilder';
import mongoose, { Types } from 'mongoose';
import { Student } from '../student/student.model';
import { Fees } from '../fees/model';
import { User } from '../user/user.model';
import { IEnrollment } from './interface';
import { IStudent } from '../student/student.interface';
import { FeeAdjustment } from '../feeAdjustment/model';
import { generateStudentId } from '../student/student.utils';
import { Payment } from '../payment/model';
import { Class } from '../class/class.model';

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

// export const createEnrollment = async (payload: any) => {
//   console.log('payload this ', payload);
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     let classIds: string[] = [];

//     // Process class names - FIXED ISSUE HERE
//     if (Array.isArray(payload.className)) {
//       classIds = payload.className
//         .filter((cls: any) => cls && cls !== '')
//         .map((cls: any) => {
//           if (typeof cls === 'object') {
//             // Handle different possible object structures
//             if (cls._id) return cls._id.toString();
//             if (cls.value) return cls.value.toString();
//             if (cls.id) return cls.id.toString();
//             // If it's a Mongoose document
//             if (cls.toString && cls.toString().match(/^[0-9a-fA-F]{24}$/)) {
//               return cls.toString();
//             }
//           }

//           return typeof cls === 'string' ? cls.trim() : cls;
//         });
//     } else if (payload.className) {
//       const cls = payload.className;
//       if (typeof cls === 'object') {
//         if (cls._id) classIds = [cls._id.toString()];
//         else if (cls.value) classIds = [cls.value.toString()];
//         else if (cls.id) classIds = [cls.id.toString()];
//         else if (cls.toString && cls.toString().match(/^[0-9a-fA-F]{24}$/)) {
//           classIds = [cls.toString()];
//         }
//       } else if (typeof cls === 'string' && cls.trim()) {
//         classIds = [cls.trim()];
//       }
//     }

//     if (!classIds.length) {
//       throw new Error('At least one class is required');
//     }

//     // Validate ObjectIds
//     const validClassIds = classIds.filter((id) =>
//       mongoose.Types.ObjectId.isValid(id),
//     );

//     if (validClassIds.length === 0) {
//       throw new Error('Invalid class ID(s) provided');
//     }

//     classIds = validClassIds;

//     // Normalize data to match schema
//     const enrollmentData: any = {
//       studentId: payload.studentId || '', // Added studentId field
//       studentName: payload.studentName || '',
//       nameBangla: payload.nameBangla || '',
//       studentPhoto: payload.studentPhoto || '',
//       mobileNo: payload.mobileNo || '',
//       rollNumber: payload.rollNumber || '',
//       gender: payload.gender || '',
//       birthDate: payload.birthDate || '',
//       birthRegistrationNo: payload.birthRegistrationNo || '',
//       bloodGroup: payload.bloodGroup || '',
//       nationality: payload.nationality || 'Bangladesh',
//       className: classIds[0], // Use first class as primary
//       section: payload.section || '',
//       roll: payload.roll || payload.rollNumber || '',
//       session: payload.session || '',
//       batch: payload.batch || '',
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
//       guardianInfo: payload.guardianInfo || {},
//       presentAddress: payload.presentAddress || {},
//       permanentAddress: payload.permanentAddress || {},
//       documents: payload.documents || {
//         birthCertificate: false,
//         transferCertificate: false,
//         characterCertificate: false,
//         markSheet: false,
//         photographs: false,
//       },
//       previousSchool: payload.previousSchool || {},
//       termsAccepted: payload.termsAccepted || false,
//       admissionType: payload.admissionType || 'admission',
//       paymentStatus: payload.paymentStatus || 'pending',
//       status: payload.status || 'active',
//     };

//     // Clean up enrollment data
//     Object.keys(enrollmentData).forEach((key) => {
//       if (enrollmentData[key] === undefined || enrollmentData[key] === null) {
//         delete enrollmentData[key];
//       }
//       if (
//         typeof enrollmentData[key] === 'object' &&
//         Object.keys(enrollmentData[key]).length === 0
//       ) {
//         delete enrollmentData[key];
//       }
//     });

//     // Create or find Student
//     let studentDoc: any = null;
//     let studentId = null;

//     // Check if student already exists by studentId first
//     if (payload.studentId && payload.studentId.trim() !== '') {
//       studentDoc = await Student.findOne({
//         studentId: payload.studentId,
//       }).session(session);

//       if (studentDoc) {
//         console.log(`Student found with ID: ${payload.studentId}`);
//         studentId = studentDoc._id;

//         // Update existing student information if needed
//         const updateData: any = {};

//         // Only update if fields are provided and different
//         if (payload.studentName && studentDoc.name !== payload.studentName) {
//           updateData.name = payload.studentName;
//         }
//         if (payload.mobileNo && studentDoc.mobile !== payload.mobileNo) {
//           updateData.mobile = payload.mobileNo;
//         }
//         if (
//           payload.nameBangla &&
//           studentDoc.nameBangla !== payload.nameBangla
//         ) {
//           updateData.nameBangla = payload.nameBangla;
//         }

//         // Update class if provided
//         if (classIds.length > 0) {
//           const classObjectIds = classIds.map(
//             (id) => new mongoose.Types.ObjectId(id),
//           );
//           if (
//             JSON.stringify(studentDoc.className) !==
//             JSON.stringify(classObjectIds)
//           ) {
//             updateData.className = classObjectIds;
//           }
//         }

//         if (Object.keys(updateData).length > 0) {
//           await Student.findByIdAndUpdate(
//             studentDoc._id,
//             { $set: updateData },
//             { session },
//           );
//         }
//       } else {
//         console.log(
//           `Student with ID ${payload.studentId} not found, creating new student`,
//         );
//       }
//     }

//     // If no student found by studentId, check by mobile number
//     if (!studentDoc && payload.mobileNo && payload.mobileNo.trim() !== '') {
//       studentDoc = await Student.findOne({ mobile: payload.mobileNo }).session(
//         session,
//       );

//       if (studentDoc) {
//         console.log(`Student found with mobile: ${payload.mobileNo}`);
//         studentId = studentDoc._id;
//         enrollmentData.studentId = studentDoc.studentId; // Use existing student ID

//         // Update existing student information if needed
//         const updateData: any = {};

//         if (payload.studentName && studentDoc.name !== payload.studentName) {
//           updateData.name = payload.studentName;
//         }
//         if (
//           payload.nameBangla &&
//           studentDoc.nameBangla !== payload.nameBangla
//         ) {
//           updateData.nameBangla = payload.nameBangla;
//         }

//         // Update class if provided
//         if (classIds.length > 0) {
//           const classObjectIds = classIds.map(
//             (id) => new mongoose.Types.ObjectId(id),
//           );
//           if (
//             JSON.stringify(studentDoc.className) !==
//             JSON.stringify(classObjectIds)
//           ) {
//             updateData.className = classObjectIds;
//           }
//         }

//         if (Object.keys(updateData).length > 0) {
//           await Student.findByIdAndUpdate(
//             studentDoc._id,
//             { $set: updateData },
//             { session },
//           );
//         }
//       }
//     }

//     // If still no student found, create new student
//     if (!studentDoc) {
//       console.log('Creating new student...');

//       // Generate new student ID
//       const newStudentId = await generateStudentId();
//       console.log(`Generated new student ID: ${newStudentId}`);

//       // Check if email exists to create user
//       let user = null;
//       const email = payload.email || `${newStudentId}@craft.edu.bd`;

//       // Check if user already exists with this email
//       user = await User.findOne({ email }).session(session);

//       if (!user && payload.createUser !== false) {
//         // Create new user for the student
//         const [newUser] = await User.create(
//           [
//             {
//               name: payload.studentName || `Student ${newStudentId}`,
//               email: email,
//               password: 'student123',
//               role: 'student',
//               needsPasswordChange: true,
//             },
//           ],
//           { session },
//         );
//         user = newUser;
//         console.log(`Created new user for student: ${user._id}`);
//       }

//       // Prepare student data
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
//         documents: payload.documents || {
//           birthCertificate: false,
//           transferCertificate: false,
//           characterCertificate: false,
//           markSheet: false,
//           photographs: false,
//         },
//         status: 'active',
//       };

//       // Clean up student data
//       Object.keys(studentData).forEach((key) => {
//         if (studentData[key] === undefined || studentData[key] === null) {
//           delete studentData[key];
//         }
//         if (
//           typeof studentData[key] === 'object' &&
//           Object.keys(studentData[key]).length === 0
//         ) {
//           delete studentData[key];
//         }
//       });

//       // Create new student
//       const [newStudent] = await Student.create([studentData], { session });
//       studentDoc = newStudent;
//       studentId = newStudent._id;
//       enrollmentData.studentId = newStudentId; // Set the generated studentId

//       console.log(
//         `Created new student: ${studentId} with studentId: ${newStudentId}`,
//       );
//     } else {
//       console.log(
//         `Using existing student: ${studentId} with studentId: ${studentDoc.studentId}`,
//       );
//     }

//     // Now create the enrollment
//     console.log('Creating enrollment for student:', studentId);

//     const [newEnrollment] = await Enrollment.create(
//       [{ ...enrollmentData, student: studentId }],
//       { session },
//     );

//     console.log(`Enrollment created: ${newEnrollment._id}`);

//     // Process Fees - MONTHLY FEE FIX
//     const feeDocs: mongoose.Types.ObjectId[] = [];
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
//     const currentMonth = monthNames[currentMonthIndex];
//     const currentYear = currentDate.getFullYear();

//     // Process all fees from payload
//     if (
//       payload.fees &&
//       Array.isArray(payload.fees) &&
//       payload.fees.length > 0
//     ) {
//       console.log(`Processing ${payload.fees.length} fee records...`);

//       for (const fee of payload.fees) {
//         // Skip if essential data is missing
//         if (!fee.feeType || !fee.className || !fee.feeAmount) {
//           console.log('Skipping fee due to missing data:', fee);
//           continue;
//         }

//         const feeTypeValue = Array.isArray(fee.feeType)
//           ? fee.feeType[0]
//           : fee.feeType;
//         const classNameValue = Array.isArray(fee.className)
//           ? fee.className[0]
//           : fee.className;

//         // Extract actual values
//         const actualFeeType =
//           typeof feeTypeValue === 'object'
//             ? feeTypeValue.label || feeTypeValue.value || feeTypeValue
//             : feeTypeValue;

//         const actualClassName =
//           typeof classNameValue === 'object'
//             ? classNameValue.label || classNameValue.value || classNameValue
//             : classNameValue;

//         const feeType = String(actualFeeType).trim();
//         const feeAmount = Number(fee.feeAmount) || 0;
//         const paidAmount = Number(fee.paidAmount) || 0;
//         const discountAmount = Number(fee.discount) || 0;
//         const waiverAmount = Number(fee.waiver) || 0;

//         // Validate adjustments
//         if (discountAmount + waiverAmount > feeAmount) {
//           throw new Error(
//             `Total adjustments (${discountAmount + waiverAmount}) cannot exceed fee amount (${feeAmount}) for ${feeType}`,
//           );
//         }

//         // Check fee type
//         const isMonthlyFee = feeType.toLowerCase().includes('monthly');
//         const isYearlyFee =
//           feeType.toLowerCase().includes('yearly') ||
//           feeType.toLowerCase().includes('annual');

//         if (isMonthlyFee && feeAmount > 0) {
//           // Monthly fee processing - create 12 monthly records
//           const monthlyAmount = feeAmount;
//           const monthlyDiscount = discountAmount / 12;
//           const monthlyWaiver = waiverAmount / 12;

//           for (let i = 0; i < 12; i++) {
//             const isCurrentMonth = i === currentMonthIndex;
//             const monthName = monthNames[i];
//             const monthKey = `${monthName}-${currentYear}`;

//             // Calculate monthly values
//             const monthlyNetAmount =
//               monthlyAmount - monthlyDiscount - monthlyWaiver;
//             const monthPaidAmount = isCurrentMonth ? paidAmount : 0;
//             const monthDueAmount = monthlyNetAmount - monthPaidAmount;

//             const monthFeeData: any = {
//               enrollment: newEnrollment._id,
//               student: studentId,
//               feeType: feeType,
//               class: actualClassName,
//               month: monthKey,
//               amount: monthlyAmount,
//               paidAmount: monthPaidAmount,
//               discount: monthlyDiscount,
//               waiver: monthlyWaiver,
//               dueAmount: Math.max(0, monthDueAmount),
//               status:
//                 monthDueAmount <= 0
//                   ? 'paid'
//                   : monthPaidAmount > 0
//                     ? 'partial'
//                     : 'unpaid',
//               academicYear: currentYear.toString(),
//               isCurrentMonth: isCurrentMonth,
//               isMonthly: true,
//             };

//             // Add payment info if applicable
//             if (isCurrentMonth && paidAmount > 0) {
//               monthFeeData.paymentMethod = fee.paymentMethod || 'cash';
//               monthFeeData.paymentDate = new Date();
//               monthFeeData.transactionId = `TXN${Date.now()}${i}`;
//             }

//             const [monthlyFee] = await Fees.create([monthFeeData], { session });
//             feeDocs.push(monthlyFee._id as mongoose.Types.ObjectId);
//           }
//         } else if (isYearlyFee && feeAmount > 0) {
//           // Yearly fee processing - divide by 12 for monthly breakdown
//           const monthlyAmount = feeAmount / 12;
//           const monthlyDiscount = discountAmount / 12;
//           const monthlyWaiver = waiverAmount / 12;

//           for (let i = 0; i < 12; i++) {
//             const isCurrentMonth = i === currentMonthIndex;
//             const isPastMonth = i < currentMonthIndex;
//             const monthName = monthNames[i];
//             const monthKey = `${monthName}-${currentYear}`;

//             const monthlyNetAmount =
//               monthlyAmount - monthlyDiscount - monthlyWaiver;
//             const monthPaidAmount = isCurrentMonth
//               ? paidAmount
//               : isPastMonth
//                 ? monthlyNetAmount
//                 : 0;
//             const monthDueAmount = monthlyNetAmount - monthPaidAmount;

//             const monthFeeData: any = {
//               enrollment: newEnrollment._id,
//               student: studentId,
//               feeType: feeType,
//               class: actualClassName,
//               month: monthKey,
//               amount: monthlyAmount,
//               paidAmount: monthPaidAmount,
//               discount: monthlyDiscount,
//               waiver: monthlyWaiver,
//               dueAmount: Math.max(0, monthDueAmount),
//               status:
//                 monthDueAmount <= 0
//                   ? 'paid'
//                   : monthPaidAmount > 0
//                     ? 'partial'
//                     : 'unpaid',
//               academicYear: currentYear.toString(),
//               isCurrentMonth: isCurrentMonth,
//               isYearly: true,
//             };

//             // Add payment info if applicable
//             if (isCurrentMonth && paidAmount > 0) {
//               monthFeeData.paymentMethod = fee.paymentMethod || 'cash';
//               monthFeeData.paymentDate = new Date();
//               monthFeeData.transactionId = `TXN${Date.now()}${i}`;
//             }

//             const [monthlyFee] = await Fees.create([monthFeeData], { session });
//             feeDocs.push(monthlyFee._id as mongoose.Types.ObjectId);
//           }
//         } else if (feeAmount > 0) {
//           // One-time fees (admission, exam, etc.)
//           const netAmount = feeAmount - discountAmount - waiverAmount;
//           const dueAmount = Math.max(0, netAmount - paidAmount);

//           const feeData: any = {
//             enrollment: newEnrollment._id,
//             student: studentId,
//             feeType: feeType,
//             class: actualClassName,
//             month: `${currentMonth}-${currentYear}`,
//             amount: feeAmount,
//             paidAmount: paidAmount,
//             discount: discountAmount,
//             waiver: waiverAmount,
//             dueAmount: dueAmount,
//             status:
//               dueAmount <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
//             academicYear: currentYear.toString(),
//             isCurrentMonth: true,
//           };

//           // Add payment info if payment was made
//           if (paidAmount > 0) {
//             feeData.paymentMethod = fee.paymentMethod || 'cash';
//             feeData.paymentDate = new Date();
//             feeData.transactionId = `TXN${Date.now()}`;
//           }

//           const [newFee] = await Fees.create([feeData], { session });
//           feeDocs.push(newFee._id as mongoose.Types.ObjectId);
//         }
//       }
//     } else {
//       console.log('⚠️ No fees found in payload or fee array is empty');
//     }

//     // Link Fees to Enrollment and Student
//     if (feeDocs.length > 0) {
//       // Update enrollment with fees
//       newEnrollment.fees = feeDocs;
//       await newEnrollment.save({ session });

//       // Update student with fees
//       const existingStudentFees = studentDoc.fees
//         ? studentDoc.fees.map((id: any) => id.toString())
//         : [];

//       const newFeeIds = feeDocs
//         .map((id) => id.toString())
//         .filter((id) => !existingStudentFees.includes(id));

//       if (newFeeIds.length > 0) {
//         const allFeeIds = [...existingStudentFees, ...newFeeIds];
//         studentDoc.fees = allFeeIds.map(
//           (id) => new mongoose.Types.ObjectId(id),
//         );
//         await studentDoc.save({ session });
//       }
//     }

//     // Create Fee Adjustment Records
//     if (payload.fees && Array.isArray(payload.fees) && feeDocs.length > 0) {
//       for (let i = 0; i < payload.fees.length; i++) {
//         const fee = payload.fees[i];
//         const discountAmount = Number(fee.discount) || 0;
//         const waiverAmount = Number(fee.waiver) || 0;

//         if (feeDocs[i]) {
//           // Create discount adjustment if applicable
//           if (discountAmount > 0) {
//             const discountAdjustment = {
//               student: studentId,
//               fee: feeDocs[i],
//               enrollment: newEnrollment._id,
//               type: 'discount',
//               adjustmentType: fee.discountType || 'flat',
//               value: discountAmount,
//               reason: fee.discountReason || 'Enrollment discount',
//               approvedBy: new mongoose.Types.ObjectId(),
//               startMonth: `${currentMonth}-${currentYear}`,
//               endMonth: `${currentMonth}-${currentYear}`,
//               academicYear: currentYear.toString(),
//               isActive: true,
//               isRecurring: false,
//             };
//             await FeeAdjustment.create([discountAdjustment], { session });
//           }

//           // Create waiver adjustment if applicable
//           if (waiverAmount > 0) {
//             const waiverAdjustment = {
//               student: studentId,
//               fee: feeDocs[i],
//               enrollment: newEnrollment._id,
//               type: 'waiver',
//               adjustmentType: fee.waiverType || 'flat',
//               value: waiverAmount,
//               reason: fee.waiverReason || 'Enrollment waiver',
//               approvedBy: new mongoose.Types.ObjectId(),
//               startMonth: `${currentMonth}-${currentYear}`,
//               endMonth: `${currentMonth}-${currentYear}`,
//               academicYear: currentYear.toString(),
//               isActive: true,
//               isRecurring: false,
//             };
//             await FeeAdjustment.create([waiverAdjustment], { session });
//           }
//         }
//       }
//     }

//     // Commit transaction
//     await session.commitTransaction();
//     session.endSession();

//     // Populate and return the enrollment
//     const populatedEnrollment = await Enrollment.findById(newEnrollment._id)
//       .populate('student')
//       .populate('fees')
//       .populate('className')
//       .populate({
//         path: 'fees',
//         populate: {
//           path: 'feeType',
//           select: 'name type',
//         },
//       });

//     return {
//       success: true,
//       message: 'Enrollment created successfully with linked student and fees',
//       data: populatedEnrollment,
//     };
//   } catch (error: any) {
//     // Abort transaction on error
//     await session.abortTransaction();
//     session.endSession();

//     console.error('Enrollment creation error:', error);

//     // Return structured error response
//     return {
//       success: false,
//       message: error.message || 'Failed to create enrollment',
//       error: {
//         message: error.message,
//         stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
//       },
//     };
//   }
// };

export const createEnrollment = async (payload: any) => {
  console.log('payload this ', payload);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let classIds: string[] = [];

    // Process class names - FIXED ISSUE HERE
    if (Array.isArray(payload.className)) {
      classIds = payload.className
        .filter((cls: any) => cls && cls !== '')
        .map((cls: any) => {
          if (typeof cls === 'object') {
            // Handle different possible object structures
            if (cls._id) return cls._id.toString();
            if (cls.value) return cls.value.toString();
            if (cls.id) return cls.id.toString();
            // If it's a Mongoose document
            if (cls.toString && cls.toString().match(/^[0-9a-fA-F]{24}$/)) {
              return cls.toString();
            }
          }

          return typeof cls === 'string' ? cls.trim() : cls;
        });
    } else if (payload.className) {
      const cls = payload.className;
      if (typeof cls === 'object') {
        if (cls._id) classIds = [cls._id.toString()];
        else if (cls.value) classIds = [cls.value.toString()];
        else if (cls.id) classIds = [cls.id.toString()];
        else if (cls.toString && cls.toString().match(/^[0-9a-fA-F]{24}$/)) {
          classIds = [cls.toString()];
        }
      } else if (typeof cls === 'string' && cls.trim()) {
        classIds = [cls.trim()];
      }
    }

    if (!classIds.length) {
      throw new Error('At least one class is required');
    }

    // Validate ObjectIds
    const validClassIds = classIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );

    if (validClassIds.length === 0) {
      throw new Error('Invalid class ID(s) provided');
    }

    classIds = validClassIds;

    // Normalize data to match schema
    const enrollmentData: any = {
      studentId: payload.studentId || '', // Added studentId field
      studentName: payload.studentName || '',
      nameBangla: payload.nameBangla || '',
      studentPhoto: payload.studentPhoto || '',
      mobileNo: payload.mobileNo || '',
      rollNumber: payload.rollNumber || '',
      gender: payload.gender || '',
      birthDate: payload.birthDate || '',
      birthRegistrationNo: payload.birthRegistrationNo || '',
      bloodGroup: payload.bloodGroup || '',
      nationality: payload.nationality || 'Bangladesh',
      className: classIds[0], // Use first class as primary
      section: payload.section || '',
      roll: payload.roll || payload.rollNumber || '',
      session: payload.session || '',
      batch: payload.batch || '',
      studentType: payload.studentType || '',
      studentDepartment: payload.studentDepartment || 'hifz',
      fatherName: payload.fatherName || '',
      fatherNameBangla: payload.fatherNameBangla || '',
      fatherMobile: payload.fatherMobile || '',
      fatherNid: payload.fatherNid || '',
      fatherProfession: payload.fatherProfession || '',
      fatherIncome: payload.fatherIncome || 0,
      motherName: payload.motherName || '',
      motherNameBangla: payload.motherNameBangla || '',
      motherMobile: payload.motherMobile || '',
      motherNid: payload.motherNid || '',
      motherProfession: payload.motherProfession || '',
      motherIncome: payload.motherIncome || 0,
      guardianInfo: payload.guardianInfo || {},
      presentAddress: payload.presentAddress || {},
      permanentAddress: payload.permanentAddress || {},
      documents: payload.documents || {
        birthCertificate: false,
        transferCertificate: false,
        characterCertificate: false,
        markSheet: false,
        photographs: false,
      },
      previousSchool: payload.previousSchool || {},
      termsAccepted: payload.termsAccepted || false,
      admissionType: payload.admissionType || 'admission',
      paymentStatus: payload.paymentStatus || 'pending',
      status: payload.status || 'active',
    };

    // Clean up enrollment data
    Object.keys(enrollmentData).forEach((key) => {
      if (enrollmentData[key] === undefined || enrollmentData[key] === null) {
        delete enrollmentData[key];
      }
      if (
        typeof enrollmentData[key] === 'object' &&
        Object.keys(enrollmentData[key]).length === 0
      ) {
        delete enrollmentData[key];
      }
    });

    // Create or find Student
    let studentDoc: any = null;
    let studentId = null;

    // Check if student already exists by studentId first
    if (payload.studentId && payload.studentId.trim() !== '') {
      studentDoc = await Student.findOne({
        studentId: payload.studentId,
      }).session(session);

      if (studentDoc) {
        console.log(`Student found with ID: ${payload.studentId}`);
        studentId = studentDoc._id;

        // Update existing student information if needed
        const updateData: any = {};

        // Only update if fields are provided and different
        if (payload.studentName && studentDoc.name !== payload.studentName) {
          updateData.name = payload.studentName;
        }
        if (payload.mobileNo && studentDoc.mobile !== payload.mobileNo) {
          updateData.mobile = payload.mobileNo;
        }
        if (
          payload.nameBangla &&
          studentDoc.nameBangla !== payload.nameBangla
        ) {
          updateData.nameBangla = payload.nameBangla;
        }

        // Update class if provided
        if (classIds.length > 0) {
          const classObjectIds = classIds.map(
            (id) => new mongoose.Types.ObjectId(id),
          );
          if (
            JSON.stringify(studentDoc.className) !==
            JSON.stringify(classObjectIds)
          ) {
            updateData.className = classObjectIds;
          }
        }

        if (Object.keys(updateData).length > 0) {
          await Student.findByIdAndUpdate(
            studentDoc._id,
            { $set: updateData },
            { session },
          );
        }
      } else {
        console.log(
          `Student with ID ${payload.studentId} not found, creating new student`,
        );
      }
    }

    // If no student found by studentId, check by mobile number
    if (!studentDoc && payload.mobileNo && payload.mobileNo.trim() !== '') {
      studentDoc = await Student.findOne({ mobile: payload.mobileNo }).session(
        session,
      );

      if (studentDoc) {
        console.log(`Student found with mobile: ${payload.mobileNo}`);
        studentId = studentDoc._id;
        enrollmentData.studentId = studentDoc.studentId; // Use existing student ID

        // Update existing student information if needed
        const updateData: any = {};

        if (payload.studentName && studentDoc.name !== payload.studentName) {
          updateData.name = payload.studentName;
        }
        if (
          payload.nameBangla &&
          studentDoc.nameBangla !== payload.nameBangla
        ) {
          updateData.nameBangla = payload.nameBangla;
        }

        // Update class if provided
        if (classIds.length > 0) {
          const classObjectIds = classIds.map(
            (id) => new mongoose.Types.ObjectId(id),
          );
          if (
            JSON.stringify(studentDoc.className) !==
            JSON.stringify(classObjectIds)
          ) {
            updateData.className = classObjectIds;
          }
        }

        if (Object.keys(updateData).length > 0) {
          await Student.findByIdAndUpdate(
            studentDoc._id,
            { $set: updateData },
            { session },
          );
        }
      }
    }

    // If still no student found, create new student
    if (!studentDoc) {
      console.log('Creating new student...');

      // Generate new student ID
      const newStudentId = await generateStudentId();
      console.log(`Generated new student ID: ${newStudentId}`);

      // Check if email exists to create user
      let user = null;
      const email = payload.email || `${newStudentId}@craft.edu.bd`;

      // Check if user already exists with this email
      user = await User.findOne({ email }).session(session);

      if (!user && payload.createUser !== false) {
        // Create new user for the student
        const [newUser] = await User.create(
          [
            {
              name: payload.studentName || `Student ${newStudentId}`,
              email: email,
              password: 'student123',
              role: 'student',
              needsPasswordChange: true,
            },
          ],
          { session },
        );
        user = newUser;
        console.log(`Created new user for student: ${user._id}`);
      }

      // Prepare student data
      const studentData: any = {
        studentId: newStudentId,
        smartIdCard: `CRAFT${Date.now()}`,
        name: payload.studentName || '',
        nameBangla: payload.nameBangla || '',
        mobile: payload.mobileNo || '',
        email: email,
        user: user?._id,
        className: classIds.map((id) => new mongoose.Types.ObjectId(id)),
        studentDepartment: payload.studentDepartment || 'hifz',
        birthDate: payload.birthDate || '',
        bloodGroup: payload.bloodGroup || '',
        fatherName: payload.fatherName || '',
        fatherMobile: payload.fatherMobile || '',
        motherName: payload.motherName || '',
        motherMobile: payload.motherMobile || '',
        presentAddress: payload.presentAddress || {},
        permanentAddress: payload.permanentAddress || {},
        documents: payload.documents || {
          birthCertificate: false,
          transferCertificate: false,
          characterCertificate: false,
          markSheet: false,
          photographs: false,
        },
        status: 'active',
      };

      // Clean up student data
      Object.keys(studentData).forEach((key) => {
        if (studentData[key] === undefined || studentData[key] === null) {
          delete studentData[key];
        }
        if (
          typeof studentData[key] === 'object' &&
          Object.keys(studentData[key]).length === 0
        ) {
          delete studentData[key];
        }
      });

      // Create new student
      const [newStudent] = await Student.create([studentData], { session });
      studentDoc = newStudent;
      studentId = newStudent._id;
      enrollmentData.studentId = newStudentId; // Set the generated studentId

      console.log(
        `Created new student: ${studentId} with studentId: ${newStudentId}`,
      );
    } else {
      console.log(
        `Using existing student: ${studentId} with studentId: ${studentDoc.studentId}`,
      );
    }

    // Now create the enrollment
    console.log('Creating enrollment for student:', studentId);

    const [newEnrollment] = await Enrollment.create(
      [{ ...enrollmentData, student: studentId }],
      { session },
    );

    console.log(`Enrollment created: ${newEnrollment._id}`);

    // Process Fees - MONTHLY FEE FIX
    const feeDocs: mongoose.Types.ObjectId[] = [];
    const paymentDocs: mongoose.Types.ObjectId[] = [];
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
    const currentYear = currentDate.getFullYear();

    // Generate receipt number
    const generateReceiptNo = () => {
      return `RCP-${Date.now()}`;
    };

    // Generate transaction ID
    const generateTransactionId = () => {
      return `TXN-${Date.now()}`;
    };

    // Process all fees from payload
    if (
      payload.fees &&
      Array.isArray(payload.fees) &&
      payload.fees.length > 0
    ) {
      console.log(`Processing ${payload.fees.length} fee records...`);

      for (const fee of payload.fees) {
        // Skip if essential data is missing
        if (!fee.feeType || !fee.className || !fee.feeAmount) {
          console.log('Skipping fee due to missing data:', fee);
          continue;
        }

        const feeTypeValue = Array.isArray(fee.feeType)
          ? fee.feeType[0]
          : fee.feeType;
        const classNameValue = Array.isArray(fee.className)
          ? fee.className[0]
          : fee.className;

        // Extract actual values
        const actualFeeType =
          typeof feeTypeValue === 'object'
            ? feeTypeValue.label || feeTypeValue.value || feeTypeValue
            : feeTypeValue;

        const actualClassName =
          typeof classNameValue === 'object'
            ? classNameValue.label || classNameValue.value || classNameValue
            : classNameValue;

        const feeType = String(actualFeeType).trim();
        const feeAmount = Number(fee.feeAmount) || 0;
        const paidAmount = Number(fee.paidAmount) || 0;
        const discountAmount = Number(fee.discount) || 0;
        const waiverAmount = Number(fee.waiver) || 0;

        // Validate adjustments
        if (discountAmount + waiverAmount > feeAmount) {
          throw new Error(
            `Total adjustments (${discountAmount + waiverAmount}) cannot exceed fee amount (${feeAmount}) for ${feeType}`,
          );
        }

        // Check fee type
        const isMonthlyFee = feeType.toLowerCase().includes('monthly');
        const isYearlyFee =
          feeType.toLowerCase().includes('yearly') ||
          feeType.toLowerCase().includes('annual');

        if (isMonthlyFee && feeAmount > 0) {
          // Monthly fee processing - create 12 monthly records
          const monthlyAmount = feeAmount;
          const monthlyDiscount = discountAmount / 12;
          const monthlyWaiver = waiverAmount / 12;

          for (let i = 0; i < 12; i++) {
            const isCurrentMonth = i === currentMonthIndex;
            // const isPastMonth = i < currentMonthIndex;
            const monthName = monthNames[i];
            const monthKey = `${monthName}-${currentYear}`;

            // Calculate monthly values
            const monthlyNetAmount =
              monthlyAmount - monthlyDiscount - monthlyWaiver;

            // For monthly fees: past months are unpaid unless paid in current enrollment
            let monthPaidAmount = 0;
            let monthDueAmount = monthlyNetAmount;

            if (isCurrentMonth) {
              // Current month gets the paid amount
              monthPaidAmount = paidAmount;
              monthDueAmount = Math.max(0, monthlyNetAmount - monthPaidAmount);
            }

            const monthFeeData: any = {
              enrollment: newEnrollment._id,
              student: studentId,
              feeType: feeType,
              class: actualClassName,
              month: monthKey,
              amount: monthlyAmount,
              paidAmount: monthPaidAmount,
              discount: monthlyDiscount,
              waiver: monthlyWaiver,
              dueAmount: monthDueAmount,
              status:
                monthDueAmount <= 0
                  ? 'paid'
                  : monthPaidAmount > 0
                    ? 'partial'
                    : 'unpaid',
              academicYear: currentYear.toString(),
              isCurrentMonth: isCurrentMonth,
              isMonthly: true,
            };

            // Create the fee record
            const [monthlyFee] = await Fees.create([monthFeeData], { session });
            feeDocs.push(monthlyFee._id as mongoose.Types.ObjectId);

            // Create Payment record if payment was made for current month
            if (isCurrentMonth && paidAmount > 0) {
              const paymentData = {
                student: studentId,
                enrollment: newEnrollment._id,
                fee: monthlyFee._id,
                amountPaid: paidAmount,
                paymentMethod: fee.paymentMethod || 'cash',
                paymentDate: new Date(),
                receiptNo: generateReceiptNo(),
                transactionId: generateTransactionId(),
                note: `Payment for ${feeType} - ${monthKey}`,
                collectedBy: payload.collectedBy || 'system',
              };

              const [payment] = await Payment.create([paymentData], {
                session,
              });
              paymentDocs.push(payment._id as mongoose.Types.ObjectId);

              // Update fee with payment info
              monthlyFee.paymentMethod = fee.paymentMethod || 'cash';
              monthlyFee.transactionId = paymentData.transactionId;
              monthlyFee.paymentDate = new Date();
              monthlyFee.receiptNo = paymentData.receiptNo;
              await monthlyFee.save({ session });
            }
          }
        } else if (isYearlyFee && feeAmount > 0) {
          // Yearly fee processing - create single yearly record
          const netAmount = feeAmount - discountAmount - waiverAmount;
          const dueAmount = Math.max(0, netAmount - paidAmount);

          const yearlyFeeData: any = {
            enrollment: newEnrollment._id,
            student: studentId,
            feeType: feeType,
            class: actualClassName,
            month: `${currentMonth}-${currentYear}`,
            amount: feeAmount,
            paidAmount: paidAmount,
            discount: discountAmount,
            waiver: waiverAmount,
            dueAmount: dueAmount,
            status:
              dueAmount <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
            academicYear: currentYear.toString(),
            isCurrentMonth: true,
            isYearly: true,
          };

          const [yearlyFee] = await Fees.create([yearlyFeeData], { session });
          feeDocs.push(yearlyFee._id as mongoose.Types.ObjectId);

          // Create Payment record if payment was made
          if (paidAmount > 0) {
            const paymentData = {
              student: studentId,
              enrollment: newEnrollment._id,
              fee: yearlyFee._id,
              amountPaid: paidAmount,
              paymentMethod: fee.paymentMethod || 'cash',
              paymentDate: new Date(),
              receiptNo: generateReceiptNo(),
              transactionId: generateTransactionId(),
              note: `Payment for ${feeType} - Year ${currentYear}`,
              collectedBy: payload.collectedBy || 'system',
            };

            const [payment] = await Payment.create([paymentData], { session });
            paymentDocs.push(payment._id as mongoose.Types.ObjectId);

            // Update fee with payment info
            yearlyFee.paymentMethod = fee.paymentMethod || 'cash';
            yearlyFee.transactionId = paymentData.transactionId;
            yearlyFee.paymentDate = new Date();
            yearlyFee.receiptNo = paymentData.receiptNo;
            await yearlyFee.save({ session });
          }
        } else if (feeAmount > 0) {
          // One-time fees (admission, exam, etc.)
          const netAmount = feeAmount - discountAmount - waiverAmount;
          const dueAmount = Math.max(0, netAmount - paidAmount);

          const feeData: any = {
            enrollment: newEnrollment._id,
            student: studentId,
            feeType: feeType,
            class: actualClassName,
            month: `${currentMonth}-${currentYear}`,
            amount: feeAmount,
            paidAmount: paidAmount,
            discount: discountAmount,
            waiver: waiverAmount,
            dueAmount: dueAmount,
            status:
              dueAmount <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
            academicYear: currentYear.toString(),
            isCurrentMonth: true,
          };

          const [newFee] = await Fees.create([feeData], { session });
          feeDocs.push(newFee._id as mongoose.Types.ObjectId);

          // Create Payment record if payment was made
          if (paidAmount > 0) {
            const paymentData = {
              student: studentId,
              enrollment: newEnrollment._id,
              fee: newFee._id,
              amountPaid: paidAmount,
              paymentMethod: fee.paymentMethod || 'cash',
              paymentDate: new Date(),
              receiptNo: generateReceiptNo(),
              transactionId: generateTransactionId(),
              note: `Payment for ${feeType}`,
              collectedBy: payload.collectedBy || 'system',
            };

            const [payment] = await Payment.create([paymentData], { session });
            paymentDocs.push(payment._id as mongoose.Types.ObjectId);

            // Update fee with payment info
            newFee.paymentMethod = fee.paymentMethod || 'cash';
            newFee.transactionId = paymentData.transactionId;
            newFee.paymentDate = new Date();
            newFee.receiptNo = paymentData.receiptNo;
            await newFee.save({ session });
          }
        }
      }
    } else {
      console.log('⚠️ No fees found in payload or fee array is empty');
    }

    // Link Fees to Enrollment and Student
    if (feeDocs.length > 0) {
      // Update enrollment with fees
      newEnrollment.fees = feeDocs;
      await newEnrollment.save({ session });

      // Update student with fees
      const existingStudentFees = studentDoc.fees
        ? studentDoc.fees.map((id: any) => id.toString())
        : [];

      const newFeeIds = feeDocs
        .map((id) => id.toString())
        .filter((id) => !existingStudentFees.includes(id));

      if (newFeeIds.length > 0) {
        const allFeeIds = [...existingStudentFees, ...newFeeIds];
        studentDoc.fees = allFeeIds.map(
          (id) => new mongoose.Types.ObjectId(id),
        );
        await studentDoc.save({ session });
      }
    }

    // Link Payments to Student
    if (paymentDocs.length > 0) {
      const existingStudentPayments = studentDoc.payments
        ? studentDoc.payments.map((id: any) => id.toString())
        : [];

      const newPaymentIds = paymentDocs
        .map((id) => id.toString())
        .filter((id) => !existingStudentPayments.includes(id));

      if (newPaymentIds.length > 0) {
        const allPaymentIds = [...existingStudentPayments, ...newPaymentIds];
        studentDoc.payments = allPaymentIds.map(
          (id) => new mongoose.Types.ObjectId(id),
        );
        await studentDoc.save({ session });
      }
    }

    // Create Fee Adjustment Records
    if (payload.fees && Array.isArray(payload.fees) && feeDocs.length > 0) {
      for (let i = 0; i < payload.fees.length; i++) {
        const fee = payload.fees[i];
        const discountAmount = Number(fee.discount) || 0;
        const waiverAmount = Number(fee.waiver) || 0;

        if (feeDocs[i]) {
          // Create discount adjustment if applicable
          if (discountAmount > 0) {
            const discountAdjustment = {
              student: studentId,
              fee: feeDocs[i],
              enrollment: newEnrollment._id,
              type: 'discount',
              adjustmentType: fee.discountType || 'flat',
              value: discountAmount,
              reason: fee.discountReason || 'Enrollment discount',
              approvedBy: new mongoose.Types.ObjectId(),
              startMonth: `${currentMonth}-${currentYear}`,
              endMonth: `${currentMonth}-${currentYear}`,
              academicYear: currentYear.toString(),
              isActive: true,
              isRecurring: false,
            };
            await FeeAdjustment.create([discountAdjustment], { session });
          }

          // Create waiver adjustment if applicable
          if (waiverAmount > 0) {
            const waiverAdjustment = {
              student: studentId,
              fee: feeDocs[i],
              enrollment: newEnrollment._id,
              type: 'waiver',
              adjustmentType: fee.waiverType || 'flat',
              value: waiverAmount,
              reason: fee.waiverReason || 'Enrollment waiver',
              approvedBy: new mongoose.Types.ObjectId(),
              startMonth: `${currentMonth}-${currentYear}`,
              endMonth: `${currentMonth}-${currentYear}`,
              academicYear: currentYear.toString(),
              isActive: true,
              isRecurring: false,
            };
            await FeeAdjustment.create([waiverAdjustment], { session });
          }
        }
      }
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Populate and return the enrollment
    const populatedEnrollment = await Enrollment.findById(newEnrollment._id)
      .populate('student')
      .populate('fees')
      .populate('className')
      .populate({
        path: 'fees',
        populate: {
          path: 'feeType',
          select: 'name type',
        },
      });

    // Get payment records
    const payments = await Payment.find({
      enrollment: newEnrollment._id,
    }).populate('fee');

    return {
      success: true,
      message:
        'Enrollment created successfully with linked student, fees and payments',
      data: {
        enrollment: populatedEnrollment,
        payments: payments,
        totalPayments: payments.reduce(
          (sum, payment) => sum + payment.amountPaid,
          0,
        ),
      },
    };
  } catch (error: any) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();

    console.error('Enrollment creation error:', error);

    // Return structured error response
    return {
      success: false,
      message: error.message || 'Failed to create enrollment',
      error: {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    };
  }
};

export const updateEnrollment = async (id: string, payload: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const enrollment = await Enrollment.findById(id).session(session);
    if (!enrollment) throw new Error('Enrollment not found');

    const student = (await Student.findById(enrollment.student).session(
      session,
    )) as mongoose.Document<unknown, IStudent> &
      IStudent & { _id: Types.ObjectId; className?: Types.ObjectId[] };
    if (!student) throw new Error('Linked student not found');

    // --- STEP 2: CLASS HANDLING ---
    let classIds: string[] = [];
    if (Array.isArray(payload.className)) {
      classIds = payload.className.filter((cls: any) => cls && cls !== '');
    } else if (payload.className) {
      classIds = [payload.className].filter((cls: any) => cls && cls !== '');
    } else if (enrollment.className) {
      classIds = [enrollment.className.toString()];
    }

    classIds.forEach((cls) => {
      if (!mongoose.Types.ObjectId.isValid(cls)) {
        throw new Error(`Invalid class ID: ${cls}`);
      }
    });

    // --- STEP 3: UPDATE ENROLLMENT ---
    const updateFields: Partial<IEnrollment> = {
      studentName: payload.studentName,
      nameBangla: payload.nameBangla,
      studentPhoto: payload.studentPhoto,
      mobileNo: payload.mobileNo,
      rollNumber: payload.rollNumber,
      gender: payload.gender,
      birthDate: payload.birthDate,
      birthRegistrationNo: payload.birthRegistrationNo,
      bloodGroup: payload.bloodGroup,
      nationality: payload.nationality,
      className: classIds.length
        ? new Types.ObjectId(classIds[0])
        : enrollment.className,
      section: payload.section,
      roll: payload.roll || payload.rollNumber,
      session: payload.session,
      batch: payload.batch,
      studentType: payload.studentType,
      studentDepartment: payload.studentDepartment,
      fatherName: payload.fatherName,
      fatherNameBangla: payload.fatherNameBangla,
      fatherMobile: payload.fatherMobile,
      fatherNid: payload.fatherNid,
      fatherProfession: payload.fatherProfession,
      fatherIncome: payload.fatherIncome,
      motherName: payload.motherName,
      motherNameBangla: payload.motherNameBangla,
      motherMobile: payload.motherMobile,
      motherNid: payload.motherNid,
      motherProfession: payload.motherProfession,
      motherIncome: payload.motherIncome,
      guardianInfo: payload.guardianInfo,
      presentAddress: payload.presentAddress,
      permanentAddress: payload.permanentAddress,
      documents: payload.documents,
      previousSchool: payload.previousSchool,
      termsAccepted: payload.termsAccepted,
      admissionType: payload.admissionType,
      paymentStatus: payload.paymentStatus,
      status: payload.status,
    };

    Object.entries(updateFields).forEach(([k, v]) => {
      if (v !== undefined && v !== null) (enrollment as any)[k] = v;
    });

    await enrollment.save({ session });

    // --- STEP 4: UPDATE STUDENT ---
    student.name = payload.studentName || student.name;
    student.nameBangla = payload.nameBangla || student.nameBangla;
    student.mobile = payload.mobileNo || student.mobile;
    student.gender = payload.gender || student.gender;
    student.birthDate = payload.birthDate || student.birthDate;
    student.bloodGroup = payload.bloodGroup || student.bloodGroup;
    student.studentDepartment =
      payload.studentDepartment || student.studentDepartment;

    const existingClasses = Array.isArray(student.className)
      ? student.className.map((c) => c.toString())
      : [];
    const newClasses = classIds.filter((id) => !existingClasses.includes(id));
    student.className = [...existingClasses, ...newClasses].map(
      (id) => new Types.ObjectId(id),
    );

    await student.save({ session });

    // --- STEP 5: DELETE OLD FEES ---
    if (enrollment.fees?.length) {
      await Fees.deleteMany({ _id: { $in: enrollment.fees } }).session(session);
    }

    // --- STEP 6: REBUILD FEES ---
    const feeDocs: Types.ObjectId[] = [];
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
    const now = new Date();
    const currIndex = now.getMonth();
    const currMonth = monthNames[currIndex];
    const currYear = now.getFullYear();

    if (Array.isArray(payload.fees)) {
      for (const fee of payload.fees) {
        if (!fee.feeType || !fee.className) continue;

        const feeTypeRaw = Array.isArray(fee.feeType)
          ? fee.feeType[0]
          : fee.feeType;
        const classRaw = Array.isArray(fee.className)
          ? fee.className[0]
          : fee.className;

        const feeType =
          typeof feeTypeRaw === 'object'
            ? feeTypeRaw.label || feeTypeRaw.value || feeTypeRaw
            : feeTypeRaw;
        const className =
          typeof classRaw === 'object'
            ? classRaw.label || classRaw.value || classRaw
            : classRaw;

        const totalAmount = Number(fee.feeAmount) || 0;
        const paidAmount = Number(fee.paidAmount) || 0;
        const isMonthly = /monthly|yearly|annual/i.test(feeType);

        if (isMonthly && totalAmount > 0) {
          const monthly = totalAmount / 12;
          for (let i = 0; i < 12; i++) {
            const isCurr = i === currIndex;
            const isPast = i < currIndex;
            const paid = isCurr ? paidAmount : isPast ? monthly : 0;
            const due = monthly - paid;

            const [rec] = await Fees.create(
              [
                {
                  enrollment: enrollment._id,
                  student: student._id,
                  feeType,
                  class: className,
                  month: monthNames[i],
                  year: currYear,
                  amount: monthly,
                  paidAmount: paid,
                  advanceUsed: 0,
                  dueAmount: due,
                  discount: 0,
                  waiver: 0,
                  status: due <= 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
                  academicYear: currYear.toString(),
                  isCurrentMonth: isCurr,
                  paymentMethod: isCurr && paidAmount > 0 ? 'cash' : undefined,
                  paymentDate:
                    isCurr && paidAmount > 0 ? new Date() : undefined,
                },
              ],
              { session },
            );

            feeDocs.push(rec._id as Types.ObjectId);
          }
        } else if (totalAmount > 0) {
          const [rec] = await Fees.create(
            [
              {
                enrollment: enrollment._id,
                student: student._id,
                feeType,
                class: className,
                month: currMonth,
                year: currYear,
                amount: totalAmount,
                paidAmount,
                advanceUsed: 0,
                dueAmount: Math.max(0, totalAmount - paidAmount),
                discount: 0,
                waiver: 0,
                status:
                  paidAmount >= totalAmount
                    ? 'paid'
                    : paidAmount > 0
                      ? 'partial'
                      : 'unpaid',
                academicYear: currYear.toString(),
                isCurrentMonth: true,
                paymentMethod: paidAmount > 0 ? 'cash' : undefined,
                paymentDate: paidAmount > 0 ? new Date() : undefined,
              },
            ],
            { session },
          );

          feeDocs.push(rec._id as Types.ObjectId);
        }
      }
    }

    // --- STEP 7: LINK FEES ---
    enrollment.fees = feeDocs;
    student.fees = feeDocs;

    await enrollment.save({ session });
    await student.save({ session });

    // --- STEP 8: COMMIT ---
    await session.commitTransaction();
    session.endSession();

    const populated = await Enrollment.findById(id)
      .populate('student')
      .populate('fees')
      .populate('className');

    return {
      success: true,
      message: 'Enrollment updated successfully',
      data: populated,
    };
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    console.error('Update Enrollment Error:', err);

    throw {
      status: 500,
      data: {
        success: false,
        message: err.message || 'Failed to update enrollment',
        errorMessages: err.message || 'Failed to update enrollment',
      },
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
      console.log(
        `Creating fees for student promoted to ${newClass.className}...`,
      );

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

        // 1. ভ্যালিডেশন
        if (!studentId) {
          errors.push({
            studentId: studentId || 'unknown',
            error: 'Student ID is required',
          });
          continue;
        }

        // 2. স্টুডেন্ট খুঁজুন
        const student =
          await Student.findById(studentId).session(sessionTransaction);
        if (!student) {
          errors.push({ studentId, error: 'Student not found' });
          continue;
        }

        // 3. বর্তমান Active Enrollment খুঁজুন
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

        // 4. বর্তমান ক্লাসের ডিটেইলস নিন (নতুন ফি জেনারেট করার জন্য)
        // আমরা একই ক্লাসে রিটেইন করবো, তাই currentEnrollment.className ব্যবহার করবো
        const currentClassId = currentEnrollment.className[0]; // className এরে, তাই প্রথমটি নিলাম
        const currentClass =
          await Class.findById(currentClassId).session(sessionTransaction);

        if (!currentClass) {
          errors.push({ studentId, error: 'Current class data not found' });
          continue;
        }

        // 5. নতুন Enrollment তৈরি (রিটেইন করার জন্য)
        const currentYear = new Date().getFullYear();

        const newEnrollmentData: any = {
          student: new Types.ObjectId(studentId),
          studentId: student.studentId || '',
          studentName: student.name || '',
          // লক্ষ্য করুন: className এখানে আগের মতোই আছে (পরিবর্তন হয়নি)
          className: [new Types.ObjectId(currentClassId)],

          section: section || currentEnrollment.section || '',
          roll:
            rollNumber ||
            (currentEnrollment.roll
              ? String(Number(currentEnrollment.roll) + 1)
              : '1'),
          session: currentYear.toString(),

          admissionType: 'admission', // পুনরায় ভর্তি হওয়ার জন্য 'admission' বা আলাদা টাইপ ব্যবহার করতে পারেন
          promotedFrom: currentEnrollment._id,
          status: 'active',
          paymentStatus: 'pending',
          fees: [],
          termsAccepted: true,

          // অন্যান্য তথ্য কপি
          fatherName: currentEnrollment.fatherName,
          motherName: currentEnrollment.motherName,
          mobileNo: currentEnrollment.mobileNo,
          studentDepartment: currentEnrollment.studentDepartment,
        };

        const [newEnrollment] = await Enrollment.create([newEnrollmentData], {
          session: sessionTransaction,
        });

        // 6. পুরোনো Enrollment আপডেট করুন -> 'failed'
        currentEnrollment.promotedTo = newEnrollment._id;
        currentEnrollment.status = 'failed'; // <--- এটাই মূল পার্থক্য
        await currentEnrollment.save({ session: sessionTransaction });

        // 7. স্টুডেন্টের ক্লাস আপডেট (একই ক্লাসে থাকবে)
        student.className = [new Types.ObjectId(currentClassId)];
        await student.save({ session: sessionTransaction });

        // 8. নতুন ফি জেনারেট করুন (নতুন সেশনের জন্য)
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
