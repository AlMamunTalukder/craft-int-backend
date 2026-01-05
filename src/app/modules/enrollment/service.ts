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

// Promote a single student
const promoteEnrollment = async (
  studentId: string,
  newClassId: string,
  session: string,
  rollNumber?: string,
  section?: string,
) => {
  const sessionTransaction = await mongoose.startSession();
  sessionTransaction.startTransaction();

  try {
    // Find the student
    const student =
      await Student.findById(studentId).session(sessionTransaction);
    if (!student) {
      throw new AppError(httpStatus.NOT_FOUND, 'Student not found');
    }

    // Find the latest enrollment of the student
    const lastEnrollment = await Enrollment.findOne({ student: studentId })
      .sort({ session: -1, createdAt: -1 })
      .populate('className')
      .session(sessionTransaction);

    if (!lastEnrollment) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'No enrollment found for this student',
      );
    }

    // Check if the student already has an enrollment for the target session
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      session: session,
    }).session(sessionTransaction);

    if (existingEnrollment) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Student already enrolled for this session',
      );
    }

    // Validate new class exists
    const newClass =
      await Class.findById(newClassId).session(sessionTransaction);
    if (!newClass) {
      throw new AppError(httpStatus.NOT_FOUND, 'New class not found');
    }

    // Create new enrollment data by copying from last enrollment
    const newEnrollmentData: any = {
      student: studentId,
      studentId: student.studentId,
      studentName: student.name,
      nameBangla: student.nameBangla || '',
      studentPhoto: student.studentPhoto || lastEnrollment.studentPhoto,
      mobileNo: student.mobile || lastEnrollment.mobileNo,
      rollNumber:
        rollNumber ||
        (lastEnrollment.rollNumber
          ? `${parseInt(lastEnrollment.rollNumber) + 1}`
          : '1'),
      gender: student.gender || lastEnrollment.gender,
      birthDate: student.birthDate || lastEnrollment.birthDate,
      birthRegistrationNo:
        student.birthRegistrationNo || lastEnrollment.birthRegistrationNo,
      bloodGroup: student.bloodGroup || lastEnrollment.bloodGroup,
      nationality:
        student.nationality || lastEnrollment.nationality || 'Bangladesh',
      className: newClassId,
      section: section || lastEnrollment.section,
      roll:
        rollNumber ||
        (lastEnrollment.roll ? `${parseInt(lastEnrollment.roll) + 1}` : '1'),
      session: session,
      batch: lastEnrollment.batch,
      studentType: lastEnrollment.studentType,
      studentDepartment: lastEnrollment.studentDepartment,
      fatherName: lastEnrollment.fatherName || student.fatherName,
      fatherNameBangla:
        lastEnrollment.fatherNameBangla || student.fatherNameBangla,
      fatherMobile: lastEnrollment.fatherMobile || student.fatherMobile,
      fatherNid: lastEnrollment.fatherNid || student.fatherNid,
      fatherProfession:
        lastEnrollment.fatherProfession || student.fatherProfession,
      fatherIncome: lastEnrollment.fatherIncome || student.fatherIncome || 0,
      motherName: lastEnrollment.motherName || student.motherName,
      motherNameBangla:
        lastEnrollment.motherNameBangla || student.motherNameBangla,
      motherMobile: lastEnrollment.motherMobile || student.motherMobile,
      motherNid: lastEnrollment.motherNid || student.motherNid,
      motherProfession:
        lastEnrollment.motherProfession || student.motherProfession,
      motherIncome: lastEnrollment.motherIncome || student.motherIncome || 0,
      guardianInfo: lastEnrollment.guardianInfo || student.guardianInfo,
      presentAddress: lastEnrollment.presentAddress || student.presentAddress,
      permanentAddress:
        lastEnrollment.permanentAddress || student.permanentAddress,
      documents: lastEnrollment.documents || student.documents,
      previousSchool: lastEnrollment.previousSchool || student.previousSchool,
      termsAccepted: true,
      admissionType: 'promotion',
      promotedFrom: lastEnrollment._id,
      status: 'active',
      paymentStatus: 'pending',
    };

    // Clean up undefined values
    Object.keys(newEnrollmentData).forEach((key) => {
      if (newEnrollmentData[key] === undefined) {
        delete newEnrollmentData[key];
      }
    });

    // Create new enrollment
    const [newEnrollment] = await Enrollment.create([newEnrollmentData], {
      session: sessionTransaction,
    });

    // Update old enrollment's promotedTo field
    lastEnrollment.promotedTo = newEnrollment._id;
    lastEnrollment.status = 'passed';
    await lastEnrollment.save({ session: sessionTransaction });

    // Update student's current class
    student.className = [newClassId];
    await student.save({ session: sessionTransaction });

    // Commit transaction
    await sessionTransaction.commitTransaction();
    sessionTransaction.endSession();

    // Populate the new enrollment before returning
    const populatedEnrollment = await Enrollment.findById(newEnrollment._id)
      .populate('student')
      .populate('className')
      .populate('promotedFrom');

    return {
      success: true,
      message: 'Student promoted successfully',
      data: {
        oldEnrollment: {
          id: lastEnrollment._id,
          class: lastEnrollment.className,
          session: lastEnrollment.session,
          status: lastEnrollment.status,
        },
        newEnrollment: populatedEnrollment,
      },
    };
  } catch (error: any) {
    await sessionTransaction.abortTransaction();
    sessionTransaction.endSession();
    throw error;
  }
};

// Bulk promote multiple students
const bulkPromoteEnrollments = async (promotions: any[], session: string) => {
  const sessionTransaction = await mongoose.startSession();
  sessionTransaction.startTransaction();

  try {
    const results = [];
    const errors = [];

    for (const promotion of promotions) {
      try {
        const { studentId, newClassId, rollNumber, section } = promotion;

        // Find the student
        const student =
          await Student.findById(studentId).session(sessionTransaction);
        if (!student) {
          errors.push({ studentId, error: 'Student not found' });
          continue;
        }

        // Find the latest enrollment
        const lastEnrollment = await Enrollment.findOne({ student: studentId })
          .sort({ session: -1, createdAt: -1 })
          .session(sessionTransaction);

        if (!lastEnrollment) {
          errors.push({ studentId, error: 'No enrollment found' });
          continue;
        }

        // Check for existing enrollment in target session
        const existingEnrollment = await Enrollment.findOne({
          student: studentId,
          session: session,
        }).session(sessionTransaction);

        if (existingEnrollment) {
          errors.push({
            studentId,
            error: 'Already enrolled for this session',
          });
          continue;
        }

        // Validate new class
        const newClass =
          await Class.findById(newClassId).session(sessionTransaction);
        if (!newClass) {
          errors.push({ studentId, error: 'New class not found' });
          continue;
        }

        // Create new enrollment
        const newEnrollmentData: any = {
          student: studentId,
          studentId: student.studentId,
          studentName: student.name,
          nameBangla: student.nameBangla || '',
          className: newClassId,
          section: section || lastEnrollment.section,
          roll:
            rollNumber ||
            (lastEnrollment.roll
              ? `${parseInt(lastEnrollment.roll) + 1}`
              : '1'),
          session: session,
          batch: lastEnrollment.batch,
          studentType: lastEnrollment.studentType,
          studentDepartment: lastEnrollment.studentDepartment,
          admissionType: 'promotion',
          promotedFrom: lastEnrollment._id,
          status: 'active',
          paymentStatus: 'pending',
        };

        // Copy important fields from last enrollment
        const fieldsToCopy = [
          'fatherName',
          'fatherMobile',
          'motherName',
          'motherMobile',
          'presentAddress',
          'permanentAddress',
          'guardianInfo',
          'documents',
          'previousSchool',
          'termsAccepted',
        ];

        fieldsToCopy.forEach((field) => {
          if (lastEnrollment[field]) {
            newEnrollmentData[field] = lastEnrollment[field];
          }
        });

        const [newEnrollment] = await Enrollment.create([newEnrollmentData], {
          session: sessionTransaction,
        });

        // Update old enrollment
        lastEnrollment.promotedTo = newEnrollment._id;
        lastEnrollment.status = 'passed';
        await lastEnrollment.save({ session: sessionTransaction });

        // Update student's class
        student.className = [newClassId];
        await student.save({ session: sessionTransaction });

        results.push({
          studentId,
          studentName: student.name,
          oldClass: lastEnrollment.className,
          newClass: newClassId,
          newEnrollmentId: newEnrollment._id,
        });
      } catch (error: any) {
        errors.push({
          studentId: promotion.studentId,
          error: error.message || 'Promotion failed',
        });
      }
    }

    // Commit transaction
    await sessionTransaction.commitTransaction();
    sessionTransaction.endSession();

    return {
      success: true,
      message: `Promotion completed: ${results.length} successful, ${errors.length} failed`,
      results,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    await sessionTransaction.abortTransaction();
    sessionTransaction.endSession();
    throw error;
  }
};

// Get promotion history for a student
const getPromotionHistory = async (studentId: string) => {
  const enrollments = await Enrollment.find({ student: studentId })
    .sort({ session: 1, createdAt: 1 })
    .populate('className', 'className')
    .populate('promotedFrom', 'session className')
    .populate('promotedTo', 'session className');

  if (!enrollments.length) {
    throw new AppError(httpStatus.NOT_FOUND, 'No enrollment history found');
  }

  const history = enrollments.map((enrollment) => ({
    id: enrollment._id,
    session: enrollment.session,
    class: enrollment.className,
    admissionType: enrollment.admissionType,
    status: enrollment.status,
    rollNumber: enrollment.rollNumber,
    promotedFrom: enrollment.promotedFrom,
    promotedTo: enrollment.promotedTo,
    createdAt: enrollment.createdAt,
  }));

  return {
    success: true,
    message: 'Promotion history retrieved successfully',
    data: history,
  };
};

// Get students eligible for promotion (active students from previous session)
const getPromotionEligibleStudents = async (currentSession: string) => {
  // Extract year from session (e.g., "2024-2025" -> 2024)
  const currentYear = parseInt(currentSession.split('-')[0]);
  const previousSession = `${currentYear - 1}-${currentYear}`;

  const eligibleStudents = await Enrollment.find({
    session: previousSession,
    status: { $in: ['active', 'passed'] },
  })
    .populate('student', 'name studentId mobile')
    .populate('className', 'className')
    .sort({ 'student.name': 1 });

  const formattedStudents = eligibleStudents.map((enrollment) => ({
    enrollmentId: enrollment._id,
    studentId: enrollment.student._id,
    studentName: enrollment.student.name,
    studentIdentifier: enrollment.student.studentId,
    currentClass: enrollment.className,
    currentSession: enrollment.session,
    currentRollNumber: enrollment.rollNumber,
    currentSection: enrollment.section,
  }));

  return {
    success: true,
    message: 'Eligible students retrieved successfully',
    data: {
      previousSession,
      currentSession,
      eligibleStudents: formattedStudents,
    },
  };
};

// Get promotion summary (statistics)
const getPromotionSummary = async () => {
  const currentYear = new Date().getFullYear();
  const currentSession = `${currentYear}-${currentYear + 1}`;
  const previousSession = `${currentYear - 1}-${currentYear}`;

  // Get counts
  const totalPreviousEnrollments = await Enrollment.countDocuments({
    session: previousSession,
  });

  const totalPromoted = await Enrollment.countDocuments({
    session: currentSession,
    admissionType: 'promotion',
  });

  const totalNewAdmissions = await Enrollment.countDocuments({
    session: currentSession,
    admissionType: 'admission',
  });

  // Get class-wise promotion count
  const classWisePromotions = await Enrollment.aggregate([
    {
      $match: {
        session: currentSession,
        admissionType: 'promotion',
      },
    },
    {
      $lookup: {
        from: 'classes',
        localField: 'className',
        foreignField: '_id',
        as: 'class',
      },
    },
    {
      $unwind: '$class',
    },
    {
      $group: {
        _id: '$class.className',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  return {
    success: true,
    message: 'Promotion summary retrieved successfully',
    data: {
      previousSession,
      currentSession,
      summary: {
        totalPreviousEnrollments,
        totalPromoted,
        totalNewAdmissions,
        promotionRate:
          totalPreviousEnrollments > 0
            ? ((totalPromoted / totalPreviousEnrollments) * 100).toFixed(2) +
              '%'
            : '0%',
      },
      classWisePromotions,
    },
  };
};

export const enrollmentServices = {
  createEnrollment,
  promoteEnrollment,
  bulkPromoteEnrollments,
  getPromotionHistory,
  getPromotionEligibleStudents,
  getPromotionSummary,
  getAllEnrollments,
  getSingleEnrollment,
  updateEnrollment,
  deleteEnrollment,
};
