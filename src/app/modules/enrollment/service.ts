/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import { Enrollment } from './model';
import mongoose, { Types } from 'mongoose';
import { Student } from '../student/student.model';
import { Fees } from '../fees/model';
import { User } from '../user/user.model';
import { generateStudentId } from '../student/student.utils';
import { Payment } from '../payment/model';
import { Class } from '../class/class.model';
import { Receipt } from '../receipt/model';
import { AdmissionApplication } from '../onlineAdmission/model';
import { getCurrentAcademicYear } from '../../../utils/getCurrentAcademicYear';

const getAllEnrollments = async (query: Record<string, any>) => {
  const page = Number(query?.page) || 1;
  const limit = Number(query?.limit) || 1000;
  const skip = (page - 1) * limit;

  const matchStage: any = {};

  if (query?.searchTerm) {
    matchStage.$or = [
      { studentName: { $regex: query.searchTerm, $options: 'i' } },
      { studentId: { $regex: query.searchTerm, $options: 'i' } },
    ];
  }

  const pipeline: any[] = [
    { $match: matchStage },

    {
      $lookup: {
        from: 'students',
        localField: 'student',
        foreignField: '_id',
        as: 'student',
      },
    },
    { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: 'fees',
        localField: 'student.fees',
        foreignField: '_id',
        as: 'student.fees',
      },
    },

    {
      $lookup: {
        from: 'payments',
        localField: 'student.payments',
        foreignField: '_id',
        as: 'student.payments',
      },
    },

    {
      $lookup: {
        from: 'receipts',
        localField: 'student.receipts',
        foreignField: '_id',
        as: 'student.receipts',
      },
    },

    {
      $lookup: {
        from: 'classes',
        localField: 'className',
        foreignField: '_id',
        as: 'className',
      },
    },
    {
      $lookup: {
        from: 'classes',
        localField: 'promotedFrom',
        foreignField: '_id',
        as: 'promotedFrom',
      },
    },

    {
      $lookup: {
        from: 'classes',
        localField: 'promotedTo',
        foreignField: '_id',
        as: 'promotedTo',
      },
    },

    {
      $addFields: {
        className: { $arrayElemAt: ['$className', 0] },
        promotedFrom: { $arrayElemAt: ['$promotedFrom', 0] },
        promotedTo: { $arrayElemAt: ['$promotedTo', 0] },
      },
    },
    { $skip: skip },
    { $limit: limit },
  ];

  const data = await Enrollment.aggregate(pipeline);

  const total = await Enrollment.countDocuments(matchStage);

  const meta = {
    page,
    limit,
    total,
    totalPage: Math.ceil(total / limit),
  };

  return { meta, data };
};
const getSingleEnrollment = async (id: string) => {
  const pipeline: any[] = [
    { $match: { _id: new mongoose.Types.ObjectId(id) } },

    {
      $lookup: {
        from: 'students',
        localField: 'student',
        foreignField: '_id',
        as: 'student',
      },
    },
    { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },

    // Populate student's class
    {
      $lookup: {
        from: 'classes',
        localField: 'student.className',
        foreignField: '_id',
        as: 'student.className',
      },
    },
    {
      $unwind: { path: '$student.className', preserveNullAndEmptyArrays: true },
    },

    // Populate student's fees
    {
      $lookup: {
        from: 'fees',
        localField: 'student.fees',
        foreignField: '_id',
        as: 'student.fees',
      },
    },

    // Populate student's payments
    {
      $lookup: {
        from: 'payments',
        localField: 'student.payments',
        foreignField: '_id',
        as: 'student.payments',
      },
    },

    // Populate student's receipts
    {
      $lookup: {
        from: 'receipts',
        localField: 'student.receipts',
        foreignField: '_id',
        as: 'student.receipts',
      },
    },

    // Populate enrollment's class
    {
      $lookup: {
        from: 'classes',
        localField: 'className',
        foreignField: '_id',
        as: 'className',
      },
    },
    { $unwind: { path: '$className', preserveNullAndEmptyArrays: true } },

    // Populate enrollment's fees
    {
      $lookup: {
        from: 'fees',
        localField: 'fees',
        foreignField: '_id',
        as: 'fees',
      },
    },

    // Populate promotedFrom with class details
    {
      $lookup: {
        from: 'enrollments',
        localField: 'promotedFrom',
        foreignField: '_id',
        as: 'promotedFrom',
      },
    },
    { $unwind: { path: '$promotedFrom', preserveNullAndEmptyArrays: true } },

    // Populate promotedFrom's class
    {
      $lookup: {
        from: 'classes',
        localField: 'promotedFrom.className',
        foreignField: '_id',
        as: 'promotedFrom.className',
      },
    },
    {
      $unwind: {
        path: '$promotedFrom.className',
        preserveNullAndEmptyArrays: true,
      },
    },

    // Populate promotedTo with class details
    {
      $lookup: {
        from: 'enrollments',
        localField: 'promotedTo',
        foreignField: '_id',
        as: 'promotedTo',
      },
    },
    { $unwind: { path: '$promotedTo', preserveNullAndEmptyArrays: true } },

    // Populate promotedTo's class
    {
      $lookup: {
        from: 'classes',
        localField: 'promotedTo.className',
        foreignField: '_id',
        as: 'promotedTo.className',
      },
    },
    {
      $unwind: {
        path: '$promotedTo.className',
        preserveNullAndEmptyArrays: true,
      },
    },

    // Populate enrollment's payments
    {
      $lookup: {
        from: 'payments',
        localField: 'payments',
        foreignField: '_id',
        as: 'payments',
      },
    },

    // Populate enrollment's receipts
    {
      $lookup: {
        from: 'receipts',
        localField: 'receipts',
        foreignField: '_id',
        as: 'receipts',
      },
    },
  ];

  const enrollments = await Enrollment.aggregate(pipeline);

  if (!enrollments.length) {
    throw new AppError(httpStatus.NOT_FOUND, 'Enrollment not found');
  }

  return enrollments[0];
};

// export const createEnrollment = async (
//   payload: any,
//   applicationId?: string,
// ) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   console.log('payload', payload);

//   try {
//     let classIds: any[] = [];
//     let primaryClassName = '';
//     let classNameForId = '';

//     // ----- CLASS NAME RESOLUTION -----
//     if (Array.isArray(payload.className)) {
//       const rawClassIds = payload.className
//         .filter((cls: any) => cls && cls !== '')
//         .map((cls: any) => {
//           if (typeof cls === 'object') {
//             if (cls.className && !primaryClassName)
//               primaryClassName = cls.className;
//             if (cls.label && !primaryClassName) primaryClassName = cls.label;
//             return cls._id?.toString() || cls.value?.toString() || '';
//           }
//           const strVal = typeof cls === 'string' ? cls.trim() : '';
//           if (
//             strVal &&
//             !mongoose.Types.ObjectId.isValid(strVal) &&
//             !primaryClassName
//           ) {
//             primaryClassName = strVal;
//           }
//           return strVal;
//         })
//         .filter((id: any) => id !== '');

//       for (const item of rawClassIds) {
//         if (mongoose.Types.ObjectId.isValid(item)) {
//           classIds.push(item);
//         } else {
//           const classDoc = await Class.findOne({
//             className: { $regex: new RegExp(`^${item}$`, 'i') },
//           }).session(session);
//           if (classDoc) {
//             classIds.push(classDoc._id.toString());
//           } else {
//             throw new Error(
//               `Class "${item}" not found in the system. Please select a valid class.`,
//             );
//           }
//         }
//       }
//     } else if (payload.className) {
//       const cls = payload.className;
//       let rawId = '';
//       if (typeof cls === 'object') {
//         if (cls.className && !primaryClassName)
//           primaryClassName = cls.className;
//         if (cls.label && !primaryClassName) primaryClassName = cls.label;
//         rawId = cls._id?.toString() || cls.value?.toString() || '';
//       } else if (typeof cls === 'string' && cls.trim()) {
//         rawId = cls.trim();
//         if (!primaryClassName) primaryClassName = rawId;
//       }

//       if (mongoose.Types.ObjectId.isValid(rawId)) {
//         classIds.push(rawId);
//       } else {
//         const classDoc = await Class.findOne({
//           className: { $regex: new RegExp(`^${rawId}$`, 'i') },
//         }).session(session);
//         if (classDoc) {
//           classIds.push(classDoc._id.toString());
//         } else {
//           throw new Error(
//             `Class "${rawId}" not found in the system. Please select a valid class.`,
//           );
//         }
//       }
//     }

//     const validClassIds = classIds.filter((id) =>
//       mongoose.Types.ObjectId.isValid(id),
//     );

//     if (validClassIds.length > 0) {
//       const classDoc = await Class.findById(validClassIds[0]).session(session);
//       primaryClassName = classDoc?.className || validClassIds[0];
//       classNameForId = classDoc?.className || '';
//     }

//     const normalizedClassName = classNameForId.toLowerCase();
//     let classCode = '00';
//     if (
//       normalizedClassName.includes('one') ||
//       normalizedClassName.includes('1')
//     )
//       classCode = '01';
//     else if (
//       normalizedClassName.includes('two') ||
//       normalizedClassName.includes('2')
//     )
//       classCode = '02';
//     else if (
//       normalizedClassName.includes('three') ||
//       normalizedClassName.includes('3')
//     )
//       classCode = '03';
//     else if (
//       normalizedClassName.includes('four') ||
//       normalizedClassName.includes('4')
//     )
//       classCode = '04';
//     else if (
//       normalizedClassName.includes('five') ||
//       normalizedClassName.includes('5')
//     )
//       classCode = '05';
//     else if (
//       normalizedClassName.includes('six') ||
//       normalizedClassName.includes('6')
//     )
//       classCode = '06';
//     else if (
//       normalizedClassName.includes('seven') ||
//       normalizedClassName.includes('7')
//     )
//       classCode = '07';
//     else if (
//       normalizedClassName.includes('eight') ||
//       normalizedClassName.includes('8')
//     )
//       classCode = '08';
//     else if (
//       normalizedClassName.includes('nine') ||
//       normalizedClassName.includes('9')
//     )
//       classCode = '09';
//     else if (
//       normalizedClassName.includes('ten') ||
//       normalizedClassName.includes('10')
//     )
//       classCode = '10';

//     if (!primaryClassName) {
//       primaryClassName =
//         payload.studentDepartment === 'hifz' ? 'Hifz' : 'Class One';
//     }

//     // ----- CORRECTED parentInfo -----
//     const parentInfo = {
//       father: {
//         nameBangla: payload.fatherNameBangla || '',
//         nameEnglish: payload.fatherName || '',
//         profession: payload.fatherProfession || '',
//         education: payload.fatherEducation || '',
//         mobile: payload.fatherMobile || '',
//         whatsapp: payload.fatherWhatsapp || '',
//         nid: payload.fatherNid || '',
//         income: Number(payload.fatherIncome) || 0,
//       },
//       mother: {
//         nameBangla: payload.motherNameBangla || '',
//         nameEnglish: payload.motherName || '',
//         profession: payload.motherProfession || '',
//         education: payload.motherEducation || '',
//         mobile: payload.motherMobile || '',
//         whatsapp: payload.motherWhatsapp || '',
//         nid: payload.motherNid || '',
//         income: Number(payload.motherIncome) || 0,
//       },
//       guardian: {
//         nameBangla: payload.guardianNameBangla || '',
//         nameEnglish: payload.guardianName || '',
//         relation: payload.guardianRelation || '',
//         mobile: payload.guardianMobile || '',
//         whatsapp: payload.guardianWhatsapp || '',
//         profession: payload.guardianProfession || '',
//         address: payload.guardianVillage || '',
//       },
//     };

//     // ----- ENROLLMENT DATA -----
//     const enrollmentData: any = {
//       studentId: payload.studentId || '',
//       studentName: payload.studentName || '',
//       nameBangla: payload.nameBangla || '',
//       studentPhoto: payload.studentPhoto || '',
//       mobileNo: payload.mobileNo || '',
//       rollNumber: payload.rollNumber || '',
//       className: validClassIds,
//       section: payload.section || '',
//       session: payload.session || new Date().getFullYear().toString(),
//       batch: payload.group || '',
//       studentType: payload.studentType || payload.category || 'Residential',
//       studentDepartment: payload.studentDepartment || 'hifz',
//       presentAddress: payload.presentAddress || {},
//       permanentAddress: payload.permanentAddress || {},
//       documents: payload.documents || {},
//       termsAccepted: payload.termsAccepted || false,
//       totalAmount: payload.totalAmount || 0,
//       paidAmount: payload.paidAmount || 0,
//       dueAmount: payload.dueAmount || 0,
//       paymentMethod: payload.paymentMethod || 'cash',
//       totalDiscount: payload.totalDiscount || 0,
//       paymentStatus: payload.paymentStatus || 'pending',
//       birthDate: payload.birthDate,
//       birthRegistrationNo: payload.birthRegistrationNo,
//       bloodGroup: payload.bloodGroup,
//       nationality: payload.nationality,
//       roll: payload.roll || payload.rollNumber,
//       previousSchool: payload.previousSchool || {},
//       admissionType: 'admission',
//       status: 'active',
//       parentInfo,
//       familyEnvironment: payload.familyEnvironment,
//       behaviorSkills: payload.behaviorSkills,
//     };

//     // ==================== 🚀 IMPORTANT: IMPROVED STUDENT LOOKUP LOGIC ====================
//     let studentDoc: any = null;
//     let userDoc: any = null;
//     let generatedStudentId = '';

//     /**
//      * Function to find existing student with multiple unique criteria
//      * This prevents duplicate student creation for same family members
//      */
//     const findExistingStudent = async (): Promise<any> => {
//       // STRATEGY 1: Check by explicit studentId (most reliable)
//       if (payload.studentId && payload.studentId.trim() !== '') {
//         const student = await Student.findOne({
//           studentId: payload.studentId,
//         }).session(session);
//         if (student) return student;
//       }

//       // STRATEGY 2: Check by student's own mobile number (if provided separately)
//       if (payload.studentOwnMobile && payload.studentOwnMobile.trim() !== '') {
//         const student = await Student.findOne({
//           mobile: payload.studentOwnMobile,
//         }).session(session);
//         if (student) return student;
//       }

//       // STRATEGY 3: Check by combination of Name + BirthDate + Father's Mobile
//       // This is the key for same family members - each student has unique name & birthdate
//       if (payload.studentName && payload.birthDate && payload.fatherMobile) {
//         const student = await Student.findOne({
//           name: payload.studentName,
//           birthDate: payload.birthDate,
//           'parentInfo.father.mobile': payload.fatherMobile,
//         }).session(session);
//         if (student) return student;
//       }

//       // STRATEGY 4: Check by Name + BirthRegistrationNo (if available)
//       if (payload.studentName && payload.birthRegistrationNo) {
//         const student = await Student.findOne({
//           name: payload.studentName,
//           birthRegistrationNo: payload.birthRegistrationNo,
//         }).session(session);
//         if (student) return student;
//       }

//       // STRATEGY 5: Check by Email (if provided)
//       if (payload.email && payload.email.trim() !== '') {
//         const student = await Student.findOne({
//           email: payload.email,
//         }).session(session);
//         if (student) return student;
//       }

//       // STRATEGY 6: Check by mobileNo (legacy - but keep as fallback)
//       // Note: This is the reason for the bug, but keeping as last resort
//       if (payload.mobileNo && payload.mobileNo.trim() !== '') {
//         const student = await Student.findOne({
//           mobile: payload.mobileNo,
//         }).session(session);
//         if (student) return student;
//       }

//       return null;
//     };

//     // Use the improved lookup function
//     studentDoc = await findExistingStudent();

//     // ==================== STUDENT CREATION OR UPDATE ====================
//     if (!studentDoc) {
//       // ----- CREATE NEW STUDENT -----
//       generatedStudentId = await generateStudentId(
//         classNameForId || primaryClassName,
//       );

//       // Generate email for new student
//       const email =
//         payload.email ||
//         `${payload.studentName?.toLowerCase().replace(/\s+/g, '.')}${Date.now().toString().slice(-4)}@student.craft.edu` ||
//         `student${Date.now().toString().slice(-6)}@craft.edu`;

//       const defaultPassword = 'CIIStudent123';
//       const existingUser = await User.findOne({ email }).session(session);

//       if (!existingUser) {
//         const userData = {
//           email,
//           name: payload.studentName || 'Student',
//           password: defaultPassword,
//           userId: generatedStudentId,
//           needPasswordChange: true,
//           role: 'student',
//           status: 'active',
//           isDeleted: false,
//         };
//         const [newUser] = await User.create([userData], { session });
//         userDoc = newUser;
//       } else {
//         userDoc = existingUser;
//       }

//       // Use student's own mobile if provided, otherwise use father's mobile as fallback
//       const studentMobile =
//         payload.studentOwnMobile ||
//         payload.mobileNo ||
//         payload.fatherMobile ||
//         '';

//       const studentData: any = {
//         studentId: generatedStudentId,
//         name: payload.studentName,
//         nameBangla: payload.nameBangla,
//         email,
//         mobile: studentMobile,
//         className: validClassIds.map((id) => new mongoose.Types.ObjectId(id)),
//         studentDepartment: payload.studentDepartment,
//         advanceBalance: payload.advanceBalance || 0,
//         payments: [],
//         receipts: [],
//         fees: [],
//         presentAddress: payload.presentAddress,
//         permanentAddress: payload.permanentAddress,
//         user: userDoc ? [userDoc._id] : [],
//         birthDate: payload.birthDate,
//         birthRegistrationNo: payload.birthRegistrationNo,
//         bloodGroup: payload.bloodGroup,
//         gender: payload.gender,
//         previousSchool: payload.previousSchool,
//         documents: payload.documents,
//         parentInfo,
//         applicationId,
//         academicYear: payload.session,
//         age: payload.age,
//         department: payload.department,
//         class: payload.class,
//         session: payload.session,
//         nidBirth: payload.nidBirth,
//         nationality: payload.nationality,
//         academicInfo: payload.academicInfo,
//         familyEnvironment: payload.familyEnvironment,
//         behaviorSkills: payload.behaviorSkills,
//         termsAccepted: payload.termsAccepted,
//         admissionStatus: 'enrolled',
//       };

//       const [newStudent] = await Student.create([studentData], { session });
//       studentDoc = newStudent;
//       enrollmentData.studentId = generatedStudentId;
//       enrollmentData.student = studentDoc._id;
//     } else {
//       // ----- EXISTING STUDENT - Create new enrollment for same student? -----
//       // Wait! If student already exists, we need to decide:
//       // For same family members, each student should have their OWN student document
//       // So if we found a student by father's mobile + name + birthdate, that's a DIFFERENT student
//       // But if we found by studentId or email, that's the SAME student

//       // Check if we found by studentId or email (same student)
//       const foundByStudentId =
//         payload.studentId &&
//         payload.studentId.trim() !== '' &&
//         studentDoc.studentId === payload.studentId;
//       const foundByEmail =
//         payload.email &&
//         payload.email.trim() !== '' &&
//         studentDoc.email === payload.email;

//       if (foundByStudentId || foundByEmail) {
//         // Same student - just add enrollment
//         generatedStudentId = studentDoc.studentId;
//         enrollmentData.studentId = studentDoc.studentId;

//         if (!studentDoc.user || studentDoc.user.length === 0) {
//           const email =
//             payload.email ||
//             `${studentDoc.name?.toLowerCase().replace(/\s+/g, '.')}@student.craft.edu` ||
//             `student${Date.now().toString().slice(-6)}@craft.edu`;
//           const defaultPassword = `Craft@${Date.now().toString().slice(-6)}`;
//           const existingUser = await User.findOne({ email }).session(session);
//           if (!existingUser) {
//             const userData = {
//               email,
//               name: studentDoc.name || 'Student',
//               password: defaultPassword,
//               userId: generatedStudentId,
//               needPasswordChange: true,
//               role: 'student',
//               status: 'active',
//               isDeleted: false,
//             };
//             const [newUser] = await User.create([userData], { session });
//             userDoc = newUser;
//             studentDoc.user = [userDoc._id];
//             await studentDoc.save({ session });
//           } else {
//             userDoc = existingUser;
//             studentDoc.user = [userDoc._id];
//             await studentDoc.save({ session });
//           }
//         } else {
//           userDoc = await User.findById(studentDoc.user[0]).session(session);
//         }
//         enrollmentData.student = studentDoc._id;
//       } else {
//         // This is a DIFFERENT student from the same family
//         // Create a NEW student document for this family member
//         generatedStudentId = await generateStudentId(
//           classNameForId || primaryClassName,
//         );

//         const email =
//           payload.email ||
//           `${payload.studentName?.toLowerCase().replace(/\s+/g, '.')}${Date.now().toString().slice(-4)}@student.craft.edu` ||
//           `student${Date.now().toString().slice(-6)}@craft.edu`;

//         const defaultPassword = 'CIIStudent123';
//         const existingUser = await User.findOne({ email }).session(session);

//         if (!existingUser) {
//           const userData = {
//             email,
//             name: payload.studentName || 'Student',
//             password: defaultPassword,
//             userId: generatedStudentId,
//             needPasswordChange: true,
//             role: 'student',
//             status: 'active',
//             isDeleted: false,
//           };
//           const [newUser] = await User.create([userData], { session });
//           userDoc = newUser;
//         } else {
//           userDoc = existingUser;
//         }

//         const studentMobile =
//           payload.studentOwnMobile ||
//           payload.mobileNo ||
//           payload.fatherMobile ||
//           '';

//         const studentData: any = {
//           studentId: generatedStudentId,
//           name: payload.studentName,
//           nameBangla: payload.nameBangla,
//           email,
//           mobile: studentMobile,
//           className: validClassIds.map((id) => new mongoose.Types.ObjectId(id)),
//           studentDepartment: payload.studentDepartment,
//           advanceBalance: payload.advanceBalance || 0,
//           payments: [],
//           receipts: [],
//           fees: [],
//           presentAddress: payload.presentAddress,
//           permanentAddress: payload.permanentAddress,
//           user: userDoc ? [userDoc._id] : [],
//           birthDate: payload.birthDate,
//           birthRegistrationNo: payload.birthRegistrationNo,
//           bloodGroup: payload.bloodGroup,
//           gender: payload.gender,
//           previousSchool: payload.previousSchool,
//           documents: payload.documents,
//           parentInfo,
//           applicationId,
//           academicYear: payload.session,
//           age: payload.age,
//           department: payload.department,
//           class: payload.class,
//           session: payload.session,
//           nidBirth: payload.nidBirth,
//           nationality: payload.nationality,
//           academicInfo: payload.academicInfo,
//           familyEnvironment: payload.familyEnvironment,
//           behaviorSkills: payload.behaviorSkills,
//           termsAccepted: payload.termsAccepted,
//           admissionStatus: 'enrolled',
//         };

//         const [newStudent] = await Student.create([studentData], { session });
//         studentDoc = newStudent;
//         enrollmentData.studentId = generatedStudentId;
//         enrollmentData.student = studentDoc._id;
//       }
//     }

//     if (!userDoc) throw new Error('Failed to create or find user for student');

//     // ----- CREATE ENROLLMENT -----
//     const [newEnrollment] = await Enrollment.create([enrollmentData], {
//       session,
//     });

//     // ----- FEE PROCESSING - OPTIONAL -----
//     const feeDocs: mongoose.Types.ObjectId[] = [];
//     const paidFeeIds: mongoose.Types.ObjectId[] = [];
//     let totalTransactionAmount = 0;

//     const MONTHS = [
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
//     const currentMonthIndex = new Date().getMonth();
//     const currentMonthName = MONTHS[currentMonthIndex];

//     const totalPaidAmount = Number(payload.paidAmount) || 0;
//     let remainingPayment = totalPaidAmount;

//     // Check if fees are provided - if not, skip fee creation
//     if (
//       payload.fees &&
//       Array.isArray(payload.fees) &&
//       payload.fees.length > 0
//     ) {
//       const allFeeItems: any[] = [];

//       for (const feeCategory of payload.fees) {
//         if (
//           !feeCategory.feeItems ||
//           !Array.isArray(feeCategory.feeItems) ||
//           feeCategory.feeItems.length === 0
//         )
//           continue;

//         for (const feeItem of feeCategory.feeItems) {
//           const feeTypeStr =
//             typeof feeItem.feeType === 'string'
//               ? feeItem.feeType
//               : feeItem.feeType?.value || feeItem.feeType?.label || '';
//           if (!feeTypeStr || feeTypeStr.trim() === '') continue;

//           const className =
//             feeCategory.className && feeCategory.className.length > 0
//               ? feeCategory.className[0]?.label ||
//                 feeCategory.className[0] ||
//                 primaryClassName
//               : primaryClassName;

//           const isMonthly = feeItem.isMonthly === true;

//           if (isMonthly) {
//             const amount = Number(feeItem.amount) || 0;
//             const baseDiscount = Number(feeItem.discount) || 0;
//             const discountRangeStart = feeItem.discountRangeStart || '';
//             const discountRangeEnd = feeItem.discountRangeEnd || '';
//             const discountRangeAmount =
//               Number(feeItem.discountRangeAmount) || 0;

//             const startIndex = MONTHS.indexOf(discountRangeStart);
//             const endIndex = MONTHS.indexOf(discountRangeEnd);
//             const hasValidRange =
//               discountRangeStart &&
//               discountRangeEnd &&
//               startIndex !== -1 &&
//               endIndex !== -1;

//             for (let i = currentMonthIndex; i < 12; i++) {
//               const month = MONTHS[i];
//               let itemDiscount = baseDiscount;
//               if (hasValidRange) {
//                 const minIdx = Math.min(startIndex, endIndex);
//                 const maxIdx = Math.max(startIndex, endIndex);
//                 if (i >= minIdx && i <= maxIdx)
//                   itemDiscount = discountRangeAmount;
//               }
//               allFeeItems.push({
//                 feeType: `${feeTypeStr} - ${month}`,
//                 amount,
//                 discount: itemDiscount,
//                 month,
//                 isMonthly: true,
//                 className,
//                 discountRangeStart: hasValidRange ? discountRangeStart : '',
//                 discountRangeEnd: hasValidRange ? discountRangeEnd : '',
//                 discountRangeAmount: hasValidRange ? discountRangeAmount : 0,
//               });
//             }
//           } else {
//             allFeeItems.push({
//               feeType: feeTypeStr,
//               amount: Number(feeItem.amount) || 0,
//               discount: Number(feeItem.discount) || 0,
//               month: 'Admission',
//               isMonthly: false,
//               className,
//               discountRangeStart: '',
//               discountRangeEnd: '',
//               discountRangeAmount: 0,
//             });
//           }
//         }
//       }

//       if (allFeeItems.length > 0) {
//         allFeeItems.sort((a, b) => {
//           if (a.month === 'Admission' && b.month === 'Admission') return 0;
//           if (a.month === 'Admission') return -1;
//           if (b.month === 'Admission') return 1;
//           return MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month);
//         });

//         for (const item of allFeeItems) {
//           const netAmount = Math.max(0, item.amount - item.discount);
//           let paidForThisItem = 0;
//           const isPayableNow =
//             item.month === 'Admission' || item.month === currentMonthName;

//           if (remainingPayment > 0 && isPayableNow) {
//             paidForThisItem = Math.min(remainingPayment, netAmount);
//             remainingPayment -= paidForThisItem;
//           }

//           const dueAmount = Math.max(0, netAmount - paidForThisItem);

//           const feeData: any = {
//             enrollment: newEnrollment._id,
//             student: studentDoc._id,
//             studentId: generatedStudentId,
//             feeType: item.feeType,
//             amount: item.amount,
//             discount: item.discount,
//             paidAmount: paidForThisItem,
//             dueAmount,
//             className: item.className,
//             month: item.month,
//             academicYear:
//               payload.session || new Date().getFullYear().toString(),
//             paymentMethod: payload.paymentMethod || 'cash',
//             status:
//               paidForThisItem >= netAmount && netAmount > 0
//                 ? 'paid'
//                 : paidForThisItem > 0
//                   ? 'partial'
//                   : 'unpaid',
//           };

//           if (item.isMonthly) {
//             feeData.discountRangeStart = item.discountRangeStart || '';
//             feeData.discountRangeEnd = item.discountRangeEnd || '';
//             feeData.discountRangeAmount = item.discountRangeAmount || 0;
//           }

//           const [createdFee] = await Fees.create([feeData], { session });
//           feeDocs.push(createdFee._id);
//           if (paidForThisItem > 0) {
//             totalTransactionAmount += paidForThisItem;
//             paidFeeIds.push(createdFee._id);
//           }
//         }

//         if (feeDocs.length > 0) {
//           newEnrollment.fees = feeDocs;
//           await newEnrollment.save({ session });

//           studentDoc.fees = [...(studentDoc.fees || []), ...feeDocs];
//           await studentDoc.save({ session });
//         }
//       }
//     }

//     // ----- PAYMENT & RECEIPT - Only if there are paid fees -----
//     let createdPayment: any = null;
//     let createdReceipt: any = null;

//     if (totalTransactionAmount > 0 && paidFeeIds.length > 0) {
//       const timestamp = Date.now();
//       const random = Math.floor(Math.random() * 10000);
//       const receiptNo = `RCP-${timestamp}-${random}`;
//       const transactionId = `TXN-${timestamp}`;

//       const paymentData = {
//         student: studentDoc._id,
//         enrollment: newEnrollment._id,
//         fees: paidFeeIds,
//         totalAmount: totalTransactionAmount,
//         paymentMethod: payload.paymentMethod || 'cash',
//         receiptNo,
//         transactionId,
//         status: 'completed',
//         collectedBy: payload.collectedBy || 'Admin',
//         paymentDate: new Date(),
//       };
//       const [payment] = await Payment.create([paymentData], { session });
//       createdPayment = payment;

//       const detailedReceiptFees = await Fees.find({ _id: { $in: paidFeeIds } })
//         .session(session)
//         .lean();

//       const receiptFeesStructure = detailedReceiptFees.map((f: any) => {
//         const netAmount = Math.max(0, f.amount - (f.discount || 0));
//         const month = f.month || 'Admission';
//         return {
//           feeType: f.feeType,
//           month,
//           originalAmount: f.amount,
//           discount: f.discount || 0,
//           waiver: 0,
//           netAmount,
//           paidAmount: f.paidAmount,
//         };
//       });

//       const totalReceiptDiscount = receiptFeesStructure.reduce(
//         (sum, item) => sum + (item.discount || 0),
//         0,
//       );

//       const receiptData = {
//         receiptNo,
//         student: studentDoc._id,
//         studentName: payload.studentName,
//         studentId: generatedStudentId,
//         className: primaryClassName,
//         paymentId: createdPayment._id,
//         totalAmount: totalTransactionAmount,
//         paymentMethod: payload.paymentMethod || 'cash',
//         paymentDate: new Date(),
//         collectedBy: payload.collectedBy || 'Admin',
//         transactionId,
//         fees: receiptFeesStructure,
//         summary: {
//           totalItems: receiptFeesStructure.length,
//           subtotal: receiptFeesStructure.reduce(
//             (sum, item) => sum + item.originalAmount,
//             0,
//           ),
//           totalDiscount: totalReceiptDiscount,
//           totalWaiver: 0,
//           totalNetAmount: receiptFeesStructure.reduce(
//             (sum, item) => sum + item.netAmount,
//             0,
//           ),
//           amountPaid: totalTransactionAmount,
//         },
//         status: 'active',
//       };
//       const [receipt] = await Receipt.create([receiptData], { session });
//       createdReceipt = receipt;

//       studentDoc.payments = [
//         ...(studentDoc.payments || []),
//         createdPayment._id,
//       ];
//       studentDoc.receipts = [
//         ...(studentDoc.receipts || []),
//         createdReceipt._id,
//       ];
//       await studentDoc.save({ session });

//       newEnrollment.payment = createdPayment._id;
//       await newEnrollment.save({ session });
//     }

//     // ----- UPDATE ADMISSION APPLICATION -----
//     if (applicationId) {
//       await AdmissionApplication.findOneAndUpdate(
//         { applicationId },
//         { status: 'enrolled' },
//         { new: true, session },
//       );
//     }

//     await session.commitTransaction();
//     session.endSession();

//     // ----- POPULATE RESPONSE -----
//     const populatedEnrollment = await Enrollment.findById(newEnrollment._id)
//       .populate({
//         path: 'student',
//         populate: [
//           { path: 'payments' },
//           { path: 'receipts' },
//           { path: 'fees' },
//           { path: 'user' },
//         ],
//       })
//       .populate('className')
//       .populate('fees')
//       .lean();

//     const populatedStudent = await Student.findById(studentDoc._id)
//       .populate('payments')
//       .populate('receipts')
//       .populate('fees')
//       .populate('user')
//       .lean();

//     let populatedPayment = null;
//     let populatedReceipt = null;
//     if (createdPayment) {
//       populatedPayment = await Payment.findById(createdPayment._id)
//         .populate('fees')
//         .lean();
//     }
//     if (createdReceipt) {
//       populatedReceipt = await Receipt.findById(createdReceipt._id)
//         .populate('student')
//         .lean();
//     }

//     return {
//       success: true,
//       message: 'Enrollment created successfully',
//       data: {
//         ...populatedEnrollment,
//         student: populatedStudent,
//         payment: populatedPayment,
//         receipt: populatedReceipt,
//         userCredentials: userDoc
//           ? {
//               email: userDoc.email,
//               userId: userDoc.userId || generatedStudentId,
//               password: `Craft@${Date.now().toString().slice(-6)}`,
//               role: userDoc.role,
//             }
//           : null,
//         applicationUpdated: !!applicationId,
//       },
//     };
//   } catch (error: any) {
//     if (session.inTransaction()) await session.abortTransaction();
//     session.endSession();
//     console.error('Enrollment creation error:', error);
//     return {
//       success: false,
//       message: error.message || 'Internal Server Error',
//       error,
//       data: null,
//     };
//   }
// };

export const createEnrollment = async (
  payload: any,
  applicationId?: string,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let classIds: any[] = [];
    let primaryClassName = '';
    let classNameForId = '';

    // ----- CLASS NAME RESOLUTION -----
    if (Array.isArray(payload.className)) {
      const rawClassIds = payload.className
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
          ) {
            primaryClassName = strVal;
          }
          return strVal;
        })
        .filter((id: any) => id !== '');

      for (const item of rawClassIds) {
        if (mongoose.Types.ObjectId.isValid(item)) {
          classIds.push(item);
        } else {
          const classDoc = await Class.findOne({
            className: { $regex: new RegExp(`^${item}$`, 'i') },
          }).session(session);
          if (classDoc) {
            classIds.push(classDoc._id.toString());
          } else {
            throw new Error(
              `Class "${item}" not found in the system. Please select a valid class.`,
            );
          }
        }
      }
    } else if (payload.className) {
      const cls = payload.className;
      let rawId = '';
      if (typeof cls === 'object') {
        if (cls.className && !primaryClassName)
          primaryClassName = cls.className;
        if (cls.label && !primaryClassName) primaryClassName = cls.label;
        rawId = cls._id?.toString() || cls.value?.toString() || '';
      } else if (typeof cls === 'string' && cls.trim()) {
        rawId = cls.trim();
        if (!primaryClassName) primaryClassName = rawId;
      }

      if (mongoose.Types.ObjectId.isValid(rawId)) {
        classIds.push(rawId);
      } else {
        const classDoc = await Class.findOne({
          className: { $regex: new RegExp(`^${rawId}$`, 'i') },
        }).session(session);
        if (classDoc) {
          classIds.push(classDoc._id.toString());
        } else {
          throw new Error(
            `Class "${rawId}" not found in the system. Please select a valid class.`,
          );
        }
      }
    }

    const validClassIds = classIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );

    if (validClassIds.length > 0) {
      const classDoc = await Class.findById(validClassIds[0]).session(session);
      primaryClassName = classDoc?.className || validClassIds[0];
      classNameForId = classDoc?.className || '';
    }

    const normalizedClassName = classNameForId.toLowerCase();
    let classCode = '00';
    if (
      normalizedClassName.includes('one') ||
      normalizedClassName.includes('1')
    )
      classCode = '01';
    else if (
      normalizedClassName.includes('two') ||
      normalizedClassName.includes('2')
    )
      classCode = '02';
    else if (
      normalizedClassName.includes('three') ||
      normalizedClassName.includes('3')
    )
      classCode = '03';
    else if (
      normalizedClassName.includes('four') ||
      normalizedClassName.includes('4')
    )
      classCode = '04';
    else if (
      normalizedClassName.includes('five') ||
      normalizedClassName.includes('5')
    )
      classCode = '05';
    else if (
      normalizedClassName.includes('six') ||
      normalizedClassName.includes('6')
    )
      classCode = '06';
    else if (
      normalizedClassName.includes('seven') ||
      normalizedClassName.includes('7')
    )
      classCode = '07';
    else if (
      normalizedClassName.includes('eight') ||
      normalizedClassName.includes('8')
    )
      classCode = '08';
    else if (
      normalizedClassName.includes('nine') ||
      normalizedClassName.includes('9')
    )
      classCode = '09';
    else if (
      normalizedClassName.includes('ten') ||
      normalizedClassName.includes('10')
    )
      classCode = '10';

    if (!primaryClassName) {
      primaryClassName =
        payload.studentDepartment === 'hifz' ? 'Hifz' : 'Class One';
    }

    // ----- CORRECTED parentInfo -----
    const parentInfo = {
      father: {
        nameBangla: payload.fatherNameBangla || '',
        nameEnglish: payload.fatherName || '',
        profession: payload.fatherProfession || '',
        education: payload.fatherEducation || '',
        mobile: payload.fatherMobile || '',
        whatsapp: payload.fatherWhatsapp || '',
        nid: payload.fatherNid || '',
        income: Number(payload.fatherIncome) || 0,
      },
      mother: {
        nameBangla: payload.motherNameBangla || '',
        nameEnglish: payload.motherName || '',
        profession: payload.motherProfession || '',
        education: payload.motherEducation || '',
        mobile: payload.motherMobile || '',
        whatsapp: payload.motherWhatsapp || '',
        nid: payload.motherNid || '',
        income: Number(payload.motherIncome) || 0,
      },
      guardian: {
        nameBangla: payload.guardianNameBangla || '',
        nameEnglish: payload.guardianName || '',
        relation: payload.guardianRelation || '',
        mobile: payload.guardianMobile || '',
        whatsapp: payload.guardianWhatsapp || '',
        profession: payload.guardianProfession || '',
        address: payload.guardianVillage || '',
      },
    };

    // ----- ENROLLMENT DATA -----
    const enrollmentData: any = {
      studentId: payload.studentId || '',
      studentName: payload.studentName || '',
      nameBangla: payload.nameBangla || '',
      studentPhoto: payload.studentPhoto || '',
      mobileNo: payload.mobileNo || '',
      rollNumber: payload.rollNumber || '',
      className: validClassIds,
      section: payload.section || '',
      session: payload.session || new Date().getFullYear().toString(),
      batch: payload.group || '',
      studentType: payload.studentType || payload.category || 'Residential',
      studentDepartment: payload.studentDepartment || 'hifz',
      presentAddress: payload.presentAddress || {},
      permanentAddress: payload.permanentAddress || {},
      documents: payload.documents || {},
      termsAccepted: payload.termsAccepted || false,
      totalAmount: payload.totalAmount || 0,
      paidAmount: payload.paidAmount || 0,
      dueAmount: payload.dueAmount || 0,
      paymentMethod: payload.paymentMethod || 'cash',
      totalDiscount: payload.totalDiscount || 0,
      paymentStatus: payload.paymentStatus || 'pending',
      birthDate: payload.birthDate,
      birthRegistrationNo: payload.birthRegistrationNo,
      bloodGroup: payload.bloodGroup,
      nationality: payload.nationality,
      roll: payload.roll || payload.rollNumber,
      previousSchool: payload.previousSchool || {},
      admissionType: 'admission',
      status: 'active',
      parentInfo,
      familyEnvironment: payload.familyEnvironment,
      behaviorSkills: payload.behaviorSkills,
    };

    // ==================== IMPROVED STUDENT LOOKUP LOGIC ====================
    let studentDoc: any = null;
    let userDoc: any = null;
    let generatedStudentId = '';

    const findExistingStudent = async (): Promise<any> => {
      if (payload.studentId && payload.studentId.trim() !== '') {
        const student = await Student.findOne({
          studentId: payload.studentId,
        }).session(session);
        if (student) return student;
      }

      if (payload.studentOwnMobile && payload.studentOwnMobile.trim() !== '') {
        const student = await Student.findOne({
          mobile: payload.studentOwnMobile,
        }).session(session);
        if (student) return student;
      }

      if (payload.studentName && payload.birthDate && payload.fatherMobile) {
        const student = await Student.findOne({
          name: payload.studentName,
          birthDate: payload.birthDate,
          'parentInfo.father.mobile': payload.fatherMobile,
        }).session(session);
        if (student) return student;
      }

      if (payload.studentName && payload.birthRegistrationNo) {
        const student = await Student.findOne({
          name: payload.studentName,
          birthRegistrationNo: payload.birthRegistrationNo,
        }).session(session);
        if (student) return student;
      }

      if (payload.email && payload.email.trim() !== '') {
        const student = await Student.findOne({
          email: payload.email,
        }).session(session);
        if (student) return student;
      }

      if (payload.mobileNo && payload.mobileNo.trim() !== '') {
        const student = await Student.findOne({
          mobile: payload.mobileNo,
        }).session(session);
        if (student) return student;
      }

      return null;
    };

    studentDoc = await findExistingStudent();

    // ==================== STUDENT CREATION OR UPDATE ====================
    if (!studentDoc) {
      generatedStudentId = await generateStudentId(
        classNameForId || primaryClassName,
      );

      const email =
        payload.email ||
        `${payload.studentName?.toLowerCase().replace(/\s+/g, '.')}${Date.now().toString().slice(-4)}@student.craft.edu` ||
        `student${Date.now().toString().slice(-6)}@craft.edu`;

      const defaultPassword = 'CIIStudent123';
      const existingUser = await User.findOne({ email }).session(session);

      if (!existingUser) {
        const userData = {
          email,
          name: payload.studentName || 'Student',
          password: defaultPassword,
          userId: generatedStudentId,
          needPasswordChange: true,
          role: 'student',
          status: 'active',
          isDeleted: false,
        };
        const [newUser] = await User.create([userData], { session });
        userDoc = newUser;
      } else {
        userDoc = existingUser;
      }

      const studentMobile =
        payload.studentOwnMobile ||
        payload.mobileNo ||
        payload.fatherMobile ||
        '';

      const studentData: any = {
        studentId: generatedStudentId,
        name: payload.studentName,
        nameBangla: payload.nameBangla,
        email,
        mobile: studentMobile,
        className: validClassIds.map((id) => new mongoose.Types.ObjectId(id)),
        studentDepartment: payload.studentDepartment,
        advanceBalance: payload.advanceBalance || 0,
        payments: [],
        receipts: [],
        fees: [],
        presentAddress: payload.presentAddress,
        permanentAddress: payload.permanentAddress,
        user: userDoc ? [userDoc._id] : [],
        birthDate: payload.birthDate,
        birthRegistrationNo: payload.birthRegistrationNo,
        bloodGroup: payload.bloodGroup,
        gender: payload.gender,
        previousSchool: payload.previousSchool,
        documents: payload.documents,
        parentInfo,
        applicationId,
        academicYear: getCurrentAcademicYear(),
        age: payload.age,
        department: payload.department,
        class: payload.class,
        session: payload.session,
        nidBirth: payload.nidBirth,
        nationality: payload.nationality,
        academicInfo: payload.academicInfo,
        familyEnvironment: payload.familyEnvironment,
        behaviorSkills: payload.behaviorSkills,
        termsAccepted: payload.termsAccepted,
        admissionStatus: 'enrolled',
      };

      const [newStudent] = await Student.create([studentData], { session });
      studentDoc = newStudent;
      enrollmentData.studentId = generatedStudentId;
      enrollmentData.student = studentDoc._id;
    } else {
      const foundByStudentId =
        payload.studentId &&
        payload.studentId.trim() !== '' &&
        studentDoc.studentId === payload.studentId;
      const foundByEmail =
        payload.email &&
        payload.email.trim() !== '' &&
        studentDoc.email === payload.email;

      if (foundByStudentId || foundByEmail) {
        generatedStudentId = studentDoc.studentId;
        enrollmentData.studentId = studentDoc.studentId;

        if (!studentDoc.user || studentDoc.user.length === 0) {
          const email =
            payload.email ||
            `${studentDoc.name?.toLowerCase().replace(/\s+/g, '.')}@student.craft.edu` ||
            `student${Date.now().toString().slice(-6)}@craft.edu`;
          const defaultPassword = `Craft@${Date.now().toString().slice(-6)}`;
          const existingUser = await User.findOne({ email }).session(session);
          if (!existingUser) {
            const userData = {
              email,
              name: studentDoc.name || 'Student',
              password: defaultPassword,
              userId: generatedStudentId,
              needPasswordChange: true,
              role: 'student',
              status: 'active',
              isDeleted: false,
            };
            const [newUser] = await User.create([userData], { session });
            userDoc = newUser;
            studentDoc.user = [userDoc._id];
            await studentDoc.save({ session });
          } else {
            userDoc = existingUser;
            studentDoc.user = [userDoc._id];
            await studentDoc.save({ session });
          }
        } else {
          userDoc = await User.findById(studentDoc.user[0]).session(session);
        }
        enrollmentData.student = studentDoc._id;
      } else {
        generatedStudentId = await generateStudentId(
          classNameForId || primaryClassName,
        );

        const email =
          payload.email ||
          `${payload.studentName?.toLowerCase().replace(/\s+/g, '.')}${Date.now().toString().slice(-4)}@student.craft.edu` ||
          `student${Date.now().toString().slice(-6)}@craft.edu`;

        const defaultPassword = 'CIIStudent123';
        const existingUser = await User.findOne({ email }).session(session);

        if (!existingUser) {
          const userData = {
            email,
            name: payload.studentName || 'Student',
            password: defaultPassword,
            userId: generatedStudentId,
            needPasswordChange: true,
            role: 'student',
            status: 'active',
            isDeleted: false,
          };
          const [newUser] = await User.create([userData], { session });
          userDoc = newUser;
        } else {
          userDoc = existingUser;
        }

        const studentMobile =
          payload.studentOwnMobile ||
          payload.mobileNo ||
          payload.fatherMobile ||
          '';

        const studentData: any = {
          studentId: generatedStudentId,
          name: payload.studentName,
          nameBangla: payload.nameBangla,
          email,
          mobile: studentMobile,
          className: validClassIds.map((id) => new mongoose.Types.ObjectId(id)),
          studentDepartment: payload.studentDepartment,
          advanceBalance: payload.advanceBalance || 0,
          payments: [],
          receipts: [],
          fees: [],
          presentAddress: payload.presentAddress,
          permanentAddress: payload.permanentAddress,
          user: userDoc ? [userDoc._id] : [],
          birthDate: payload.birthDate,
          birthRegistrationNo: payload.birthRegistrationNo,
          bloodGroup: payload.bloodGroup,
          gender: payload.gender,
          previousSchool: payload.previousSchool,
          documents: payload.documents,
          parentInfo,
          applicationId,
          academicYear: getCurrentAcademicYear(),
          age: payload.age,
          department: payload.department,
          class: payload.class,
          session: payload.session,
          nidBirth: payload.nidBirth,
          nationality: payload.nationality,
          academicInfo: payload.academicInfo,
          familyEnvironment: payload.familyEnvironment,
          behaviorSkills: payload.behaviorSkills,
          termsAccepted: payload.termsAccepted,
          admissionStatus: 'enrolled',
        };

        const [newStudent] = await Student.create([studentData], { session });
        studentDoc = newStudent;
        enrollmentData.studentId = generatedStudentId;
        enrollmentData.student = studentDoc._id;
      }
    }

    if (!userDoc) throw new Error('Failed to create or find user for student');

    // ----- CREATE ENROLLMENT -----
    const [newEnrollment] = await Enrollment.create([enrollmentData], {
      session,
    });

    // ==================== FEE PROCESSING WITH FIX ====================
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
    const currentMonthIndex = new Date().getMonth();
    const currentMonthName = MONTHS[currentMonthIndex];

    const totalPaidAmount = Number(payload.paidAmount) || 0;
    let remainingPayment = totalPaidAmount;

    // Get the class name for fees (required field)
    let feeClassName = primaryClassName;

    // If primaryClassName is an ObjectId, get the actual class name
    if (feeClassName && mongoose.Types.ObjectId.isValid(feeClassName)) {
      const classDoc = await Class.findById(feeClassName).session(session);
      feeClassName = classDoc?.className || feeClassName;
    }

    // Final fallback
    if (!feeClassName || feeClassName === '') {
      feeClassName =
        payload.studentDepartment === 'hifz' ? 'Hifz' : 'Class One';
    }

    // Check if fees are provided
    if (
      payload.fees &&
      Array.isArray(payload.fees) &&
      payload.fees.length > 0
    ) {
      const allFeeItems: any[] = [];

      for (const feeCategory of payload.fees) {
        if (
          !feeCategory.feeItems ||
          !Array.isArray(feeCategory.feeItems) ||
          feeCategory.feeItems.length === 0
        )
          continue;

        for (const feeItem of feeCategory.feeItems) {
          const feeTypeStr =
            typeof feeItem.feeType === 'string'
              ? feeItem.feeType
              : feeItem.feeType?.value || feeItem.feeType?.label || '';
          if (!feeTypeStr || feeTypeStr.trim() === '') continue;

          const classNameForRef =
            feeCategory.className && feeCategory.className.length > 0
              ? feeCategory.className[0]?.label ||
              feeCategory.className[0] ||
              primaryClassName
              : primaryClassName;

          const isMonthly = feeItem.isMonthly === true;

          if (isMonthly) {
            const amount = Number(feeItem.amount) || 0;
            const baseDiscount = Number(feeItem.discount) || 0;
            const discountRangeStart = feeItem.discountRangeStart || '';
            const discountRangeEnd = feeItem.discountRangeEnd || '';
            const discountRangeAmount =
              Number(feeItem.discountRangeAmount) || 0;

            const startIndex = MONTHS.indexOf(discountRangeStart);
            const endIndex = MONTHS.indexOf(discountRangeEnd);
            const hasValidRange =
              discountRangeStart &&
              discountRangeEnd &&
              startIndex !== -1 &&
              endIndex !== -1;

            for (let i = currentMonthIndex; i < 12; i++) {
              const month = MONTHS[i];
              let itemDiscount = baseDiscount;
              if (hasValidRange) {
                const minIdx = Math.min(startIndex, endIndex);
                const maxIdx = Math.max(startIndex, endIndex);
                if (i >= minIdx && i <= maxIdx)
                  itemDiscount = discountRangeAmount;
              }
              allFeeItems.push({
                feeType: `${feeTypeStr} - ${month}`,
                amount,
                discount: itemDiscount,
                month,
                isMonthly: true,
                className: classNameForRef,
                discountRangeStart: hasValidRange ? discountRangeStart : '',
                discountRangeEnd: hasValidRange ? discountRangeEnd : '',
                discountRangeAmount: hasValidRange ? discountRangeAmount : 0,
              });
            }
          } else {
            allFeeItems.push({
              feeType: feeTypeStr,
              amount: Number(feeItem.amount) || 0,
              discount: Number(feeItem.discount) || 0,
              month: 'Admission',
              isMonthly: false,
              className: classNameForRef,
              discountRangeStart: '',
              discountRangeEnd: '',
              discountRangeAmount: 0,
            });
          }
        }
      }

      if (allFeeItems.length > 0) {
        allFeeItems.sort((a, b) => {
          if (a.month === 'Admission' && b.month === 'Admission') return 0;
          if (a.month === 'Admission') return -1;
          if (b.month === 'Admission') return 1;
          return MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month);
        });

        for (const item of allFeeItems) {
          const netAmount = Math.max(0, item.amount - item.discount);
          let paidForThisItem = 0;
          const isPayableNow =
            item.month === 'Admission' || item.month === currentMonthName;

          if (remainingPayment > 0 && isPayableNow) {
            paidForThisItem = Math.min(remainingPayment, netAmount);
            remainingPayment -= paidForThisItem;
          }

          const dueAmount = Math.max(0, netAmount - paidForThisItem);

          // FIX: Added the required 'class' field
          const feeData: any = {
            enrollment: newEnrollment._id,
            student: studentDoc._id,
            class: feeClassName, // REQUIRED FIELD - FIXED
            month: item.month,
            amount: item.amount,
            paidAmount: paidForThisItem,
            dueAmount: dueAmount,
            discount: item.discount,
            waiver: 0,
            advanceUsed: 0,
            feeType: item.feeType,
            status:
              paidForThisItem >= netAmount && netAmount > 0
                ? 'paid'
                : paidForThisItem > 0
                  ? 'partial'
                  : 'unpaid',
            paymentMethod: payload.paymentMethod || 'cash',
            academicYear: new Date().getFullYear().toString(),
            isCurrentMonth: item.month === currentMonthName,
          };

          if (item.isMonthly) {
            feeData.discountRangeStart = item.discountRangeStart || '';
            feeData.discountRangeEnd = item.discountRangeEnd || '';
            feeData.discountRangeAmount = item.discountRangeAmount || 0;
          }

          const [createdFee] = await Fees.create([feeData], { session });
          feeDocs.push(createdFee._id);
          if (paidForThisItem > 0) {
            totalTransactionAmount += paidForThisItem;
            paidFeeIds.push(createdFee._id);
          }
        }

        if (feeDocs.length > 0) {
          newEnrollment.fees = feeDocs;
          await newEnrollment.save({ session });

          studentDoc.fees = [...(studentDoc.fees || []), ...feeDocs];
          await studentDoc.save({ session });
        }
      }
    }

    let createdPayment: any = null;
    let createdReceipt: any = null;

    if (totalTransactionAmount > 0 && paidFeeIds.length > 0) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      const receiptNo = `RCP-${timestamp}-${random}`;
      const transactionId = `TXN-${timestamp}`;

      const paymentData = {
        student: studentDoc._id,
        enrollment: newEnrollment._id,
        fees: paidFeeIds,
        totalAmount: totalTransactionAmount,
        paymentMethod: payload.paymentMethod || 'cash',
        receiptNo,
        transactionId,
        status: 'completed',
        collectedBy: payload.collectedBy || 'Admin',
        paymentDate: new Date(),
      };
      const [payment] = await Payment.create([paymentData], { session });
      createdPayment = payment;

      const detailedReceiptFees = await Fees.find({ _id: { $in: paidFeeIds } })
        .session(session)
        .lean();

      const receiptFeesStructure = detailedReceiptFees.map((f: any) => {
        const netAmount = Math.max(0, f.amount - (f.discount || 0));
        const month = f.month || 'Admission';
        return {
          feeType: f.feeType,
          month,
          originalAmount: f.amount,
          discount: f.discount || 0,
          waiver: 0,
          netAmount,
          paidAmount: f.paidAmount,
        };
      });

      const totalReceiptDiscount = receiptFeesStructure.reduce(
        (sum, item) => sum + (item.discount || 0),
        0,
      );

      const receiptData = {
        receiptNo,
        student: studentDoc._id,
        studentName: payload.studentName,
        studentId: generatedStudentId,
        className: primaryClassName,
        paymentId: createdPayment._id,
        totalAmount: totalTransactionAmount,
        paymentMethod: payload.paymentMethod || 'cash',
        paymentDate: new Date(),
        collectedBy: payload.collectedBy || 'Admin',
        transactionId,
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

      studentDoc.payments = [
        ...(studentDoc.payments || []),
        createdPayment._id,
      ];
      studentDoc.receipts = [
        ...(studentDoc.receipts || []),
        createdReceipt._id,
      ];
      await studentDoc.save({ session });

      newEnrollment.payment = createdPayment._id;
      await newEnrollment.save({ session });
    }

    // ----- UPDATE ADMISSION APPLICATION -----
    if (applicationId) {
      await AdmissionApplication.findOneAndUpdate(
        { applicationId },
        { status: 'enrolled' },
        { new: true, session },
      );
    }

    await session.commitTransaction();
    session.endSession();

    // ----- POPULATE RESPONSE -----
    const populatedEnrollment = await Enrollment.findById(newEnrollment._id)
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
      .lean();

    const populatedStudent = await Student.findById(studentDoc._id)
      .populate('payments')
      .populate('receipts')
      .populate('fees')
      .populate('user')
      .lean();

    let populatedPayment = null;
    let populatedReceipt = null;
    if (createdPayment) {
      populatedPayment = await Payment.findById(createdPayment._id)
        .populate('fees')
        .lean();
    }
    if (createdReceipt) {
      populatedReceipt = await Receipt.findById(createdReceipt._id)
        .populate('student')
        .lean();
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
            userId: userDoc.userId || generatedStudentId,
            password: `Craft@${Date.now().toString().slice(-6)}`,
            role: userDoc.role,
          }
          : null,
        applicationUpdated: !!applicationId,
      },
    };
  } catch (error: any) {
    if (session.inTransaction()) await session.abortTransaction();
    session.endSession();
    console.error('Enrollment creation error:', error);
    return {
      success: false,
      message: error.message || 'Internal Server Error',
      error,
      data: null,
    };
  }
};

export const updateEnrollment = async (id: string, payload: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log('=== updateEnrollment START ===', id);

    const existingEnrollment = await Enrollment.findById(id)
      .populate('student')
      .session(session);

    if (!existingEnrollment) throw new Error('Enrollment not found');

    let studentDoc = await Student.findById(existingEnrollment.student).session(
      session,
    );


    const basicFields = [
      'studentName',
      'nameBangla',
      'mobileNo',
      'rollNumber',
      'section',
      'batch',
      'studentType',
      'session',
      'gender',
      'birthDate',
      'birthRegistrationNo',
      'bloodGroup',
      'nationality',
      'studentPhoto',
    ];

    for (const field of basicFields) {
      if (payload[field] !== undefined) {
        (existingEnrollment as any)[field] = payload[field];
      }
    }

    if (payload.className) {
      if (Array.isArray(payload.className)) {
        const classIds = payload.className.filter((id: any) =>
          mongoose.Types.ObjectId.isValid(id),
        );
        existingEnrollment.className = classIds as any;
      } else if (mongoose.Types.ObjectId.isValid(payload.className)) {
        existingEnrollment.className = [payload.className] as any;
      }
    }

    if (payload.presentAddress)
      existingEnrollment.presentAddress = payload.presentAddress;
    if (payload.permanentAddress)
      existingEnrollment.permanentAddress = payload.permanentAddress;
    if (payload.documents) existingEnrollment.documents = payload.documents;
    if (payload.parentInfo) existingEnrollment.parentInfo = payload.parentInfo;
    if (payload.familyEnvironment)
      existingEnrollment.familyEnvironment = payload.familyEnvironment;
    if (payload.behaviorSkills)
      existingEnrollment.behaviorSkills = payload.behaviorSkills;
    if (payload.termsAccepted !== undefined)
      existingEnrollment.termsAccepted = payload.termsAccepted;
    if (payload.studentDepartment)
      existingEnrollment.studentDepartment = payload.studentDepartment;
    if (payload.status) existingEnrollment.status = payload.status;

    await existingEnrollment.save({ session });


    if (studentDoc) {
      const studentUpdateFields = [
        'name',
        'nameBangla',
        'mobile',
        'studentDepartment',
        'presentAddress',
        'permanentAddress',
        'documents',
        'parentInfo',
        'familyEnvironment',
        'behaviorSkills',
        'termsAccepted',
        'gender',
        'birthDate',
        'birthRegistrationNo',
        'bloodGroup',
        'nationality',
      ];

      for (const field of studentUpdateFields) {
        const payloadField =
          field === 'mobile'
            ? 'mobileNo'
            : field === 'name'
              ? 'studentName'
              : field;
        if (payload[payloadField] !== undefined) {
          (studentDoc as any)[field] = payload[payloadField];
        }
      }

      if (payload.className) {
        if (Array.isArray(payload.className)) {
          studentDoc.className = payload.className
            .filter((id: any) => mongoose.Types.ObjectId.isValid(id))
            .map((id: string) => new mongoose.Types.ObjectId(id));
        } else if (mongoose.Types.ObjectId.isValid(payload.className)) {
          studentDoc.className = [
            new mongoose.Types.ObjectId(payload.className),
          ];
        }
      }

      await studentDoc.save({ session });
    }

    // ── 3. Handle Fee Updates ─────────────────────────────────────────────────
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

    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth();
    const currentMonthName = MONTHS[currentMonthIndex];
    const currentYear = currentDate.getFullYear().toString();

    let primaryClassName = '';
    const classId = Array.isArray(existingEnrollment.className)
      ? existingEnrollment.className[0]
      : existingEnrollment.className;

    if (classId) {
      const classDoc = await Class.findById(classId).session(session);
      primaryClassName = classDoc?.className || 'Class';
    }

    const isUpdatingFees =
      payload.fees !== undefined &&
      Array.isArray(payload.fees) &&
      payload.fees.length > 0;

    if (isUpdatingFees) {
      console.log('Processing fee update with paid-fee protection...');

      // ── 3.1 Get ALL existing fees and separate paid vs unpaid ─────────────
      const existingFees = await Fees.find({
        enrollment: existingEnrollment._id,
      }).session(session);

      /**
       * A fee is considered "paid" (locked) if paidAmount > 0.
       * These fees CANNOT be deleted or modified — they are immutable.
       */
      const paidFees = existingFees.filter((f) => (f.paidAmount || 0) > 0);
      const unpaidFees = existingFees.filter((f) => (f.paidAmount || 0) === 0);

      const paidFeeIds = paidFees.map((f) => f._id);
      const unpaidFeeIds = unpaidFees.map((f) => f._id);

      console.log(
        `Found ${paidFees.length} paid fees (locked) and ${unpaidFees.length} unpaid fees (replaceable)`,
      );

      // Build a set of paid fee keys so we know what's already covered
      // Key format: "BaseFeeType_Month" for monthly, "BaseFeeType" for one-time
      const paidFeeKeySet = new Set<string>();
      const paidAmountByKey = new Map<string, number>();

      for (const pf of paidFees) {
        let baseFeeType: string = pf.feeType || '';
        let month: string | null = null;

        const dashIdx = baseFeeType.lastIndexOf(' - ');
        if (dashIdx !== -1) {
          const possibleMonth = baseFeeType.slice(dashIdx + 3);
          if (MONTHS.includes(possibleMonth)) {
            baseFeeType = baseFeeType.slice(0, dashIdx);
            month = possibleMonth;
          }
        }

        const key = month ? `${baseFeeType}_${month}` : baseFeeType;
        paidFeeKeySet.add(key);
        paidAmountByKey.set(
          key,
          (paidAmountByKey.get(key) || 0) + (pf.paidAmount || 0),
        );
      }

      // ── 3.2 Build new fee items list from payload ─────────────────────────
      const allNewFeeItems: any[] = [];

      for (const feeCategory of payload.fees) {
        let feeItems = feeCategory.feeItems || feeCategory.items || [];
        if (feeItems.length === 0) continue;

        let feeClassName = primaryClassName;
        if (feeCategory.className && feeCategory.className.length > 0) {
          feeClassName =
            typeof feeCategory.className[0] === 'object'
              ? feeCategory.className[0]?.label || primaryClassName
              : feeCategory.className[0] || primaryClassName;
        }

        for (const feeItem of feeItems) {
          if (feeItem.isSelected === false) continue;

          let feeTypeStr = '';
          if (typeof feeItem.feeType === 'string') feeTypeStr = feeItem.feeType;
          else if (feeItem.feeType?.label) feeTypeStr = feeItem.feeType.label;
          else if (feeItem.feeType?.value) feeTypeStr = feeItem.feeType.value;

          if (!feeTypeStr?.trim()) continue;

          const amount = Number(feeItem.amount) || 0;
          const discount = Number(feeItem.discount) || 0;
          if (amount <= 0) continue;

          const isMonthly =
            feeItem.isMonthly === true ||
            feeTypeStr.toLowerCase().includes('monthly');

          if (isMonthly) {
            const discountRangeStart = feeItem.discountRangeStart || '';
            const discountRangeEnd = feeItem.discountRangeEnd || '';
            const discountRangeAmount =
              Number(feeItem.discountRangeAmount) || 0;

            const startIdx = MONTHS.indexOf(discountRangeStart);
            const endIdx = MONTHS.indexOf(discountRangeEnd);
            const hasValidRange =
              discountRangeStart &&
              discountRangeEnd &&
              startIdx !== -1 &&
              endIdx !== -1;

            let startMonth = currentMonthIndex;
            if (payload.startMonth && MONTHS.includes(payload.startMonth)) {
              startMonth = MONTHS.indexOf(payload.startMonth);
            }

            for (let i = startMonth; i < 12; i++) {
              const month = MONTHS[i];
              let itemDiscount = discount;

              if (hasValidRange) {
                const minIdx = Math.min(startIdx, endIdx);
                const maxIdx = Math.max(startIdx, endIdx);
                if (i >= minIdx && i <= maxIdx)
                  itemDiscount = discountRangeAmount;
              }

              const key = `${feeTypeStr}_${month}`;
              const netAmount = Math.max(0, amount - itemDiscount);

              // Check if this specific month+feeType is already paid
              const isAlreadyPaid = paidFeeKeySet.has(key);
              const preservedPaid = paidAmountByKey.get(key) || 0;

              if (isAlreadyPaid) {
                // ⚠️ This fee month is already paid — check if amount/discount changed
                const existingPaidFee = paidFees.find((pf) => {
                  let pfBaseFeeType: string = pf.feeType || '';
                  const dashIdx = pfBaseFeeType.lastIndexOf(' - ');
                  if (dashIdx !== -1) {
                    const possibleMonth = pfBaseFeeType.slice(dashIdx + 3);
                    if (MONTHS.includes(possibleMonth)) {
                      pfBaseFeeType = pfBaseFeeType.slice(0, dashIdx);
                      const feeKey = `${pfBaseFeeType}_${possibleMonth}`;
                      return feeKey === key;
                    }
                  }
                  return false;
                });

                if (existingPaidFee) {
                  const paidAmountValue = existingPaidFee.paidAmount || 0;
                  // If new amount < what was already paid, BLOCK the update for this fee
                  if (netAmount < paidAmountValue) {
                    throw new Error(
                      `Cannot update fee "${feeTypeStr} - ${month}": ৳${paidAmountValue} has already been paid. New amount (৳${netAmount}) cannot be less than paid amount.`,
                    );
                  }
                }
                // Skip — keep the existing paid fee document as is
                continue;
              }

              allNewFeeItems.push({
                feeType: `${feeTypeStr} - ${month}`,
                baseFeeType: feeTypeStr,
                month,
                amount,
                discount: itemDiscount,
                netAmount,
                isMonthly: true,
                className: feeClassName,
                discountRangeStart: hasValidRange ? discountRangeStart : '',
                discountRangeEnd: hasValidRange ? discountRangeEnd : '',
                discountRangeAmount: hasValidRange ? discountRangeAmount : 0,
                preservedPaidAmount: 0, // new — not yet paid
              });
            }
          } else {
            // One-time fee
            const key = feeTypeStr;
            const netAmount = Math.max(0, amount - discount);
            const isAlreadyPaid = paidFeeKeySet.has(key);

            if (isAlreadyPaid) {
              const existingPaidFee = paidFees.find(
                (pf) => pf.feeType === feeTypeStr,
              );
              if (existingPaidFee) {
                const paidAmountValue = existingPaidFee.paidAmount || 0;
                if (netAmount < paidAmountValue) {
                  throw new Error(
                    `Cannot update fee "${feeTypeStr}": ৳${paidAmountValue} has already been paid. New amount (৳${netAmount}) cannot be less than paid amount.`,
                  );
                }
              }
              // Skip — keep the existing paid fee document as is
              continue;
            }

            allNewFeeItems.push({
              feeType: feeTypeStr,
              baseFeeType: feeTypeStr,
              month: feeItem.month || 'Admission',
              amount,
              discount,
              netAmount,
              isMonthly: false,
              className: feeClassName,
              discountRangeStart: '',
              discountRangeEnd: '',
              discountRangeAmount: 0,
              preservedPaidAmount: 0,
            });
          }
        }
      }

      // Sort: Admission first, then by month order
      allNewFeeItems.sort((a, b) => {
        if (a.month === 'Admission' && b.month !== 'Admission') return -1;
        if (a.month !== 'Admission' && b.month === 'Admission') return 1;
        return MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month);
      });

      // ── 3.3 Delete ONLY the unpaid (unlocked) old fees ───────────────────
      if (unpaidFeeIds.length > 0) {
        // Get payments linked ONLY to unpaid fees
        const linkedPayments = await Payment.find({
          fees: { $in: unpaidFeeIds },
        }).session(session);

        // Only delete payments that exclusively reference unpaid fees (safety check)
        const paymentIdsToDelete: mongoose.Types.ObjectId[] = [];
        for (const payment of linkedPayments) {
          const paymentFeeIds = (payment.fees || []).map((f: any) =>
            f.toString(),
          );
          const hasPaidFee = paymentFeeIds.some((fid: string) =>
            paidFeeIds.some((pid) => pid.toString() === fid),
          );
          if (!hasPaidFee) {
            paymentIdsToDelete.push(payment._id);
          }
        }

        if (paymentIdsToDelete.length > 0) {
          await Receipt.deleteMany({
            paymentId: { $in: paymentIdsToDelete },
          }).session(session);
          await Payment.deleteMany({
            _id: { $in: paymentIdsToDelete },
          }).session(session);
        }

        // Remove unpaid fee references from student
        if (studentDoc) {
          const unpaidFeeIdStrings = unpaidFeeIds.map((id) => id.toString());
          studentDoc.fees = (studentDoc.fees || []).filter(
            (feeId: any) => !unpaidFeeIdStrings.includes(feeId.toString()),
          );

          if (paymentIdsToDelete.length > 0) {
            const delPaymentStrings = paymentIdsToDelete.map((id) =>
              id.toString(),
            );
            studentDoc.payments = (studentDoc.payments || []).filter(
              (pid: any) => !delPaymentStrings.includes(pid.toString()),
            );
          }
          await studentDoc.save({ session });
        }

        // Delete only unpaid fees
        await Fees.deleteMany({
          _id: { $in: unpaidFeeIds },
          enrollment: existingEnrollment._id,
        }).session(session);

        console.log(
          `Deleted ${unpaidFeeIds.length} unpaid fee documents (paid fees preserved)`,
        );
      }

      // ── 3.4 Create new fee documents for the non-paid items ──────────────
      const newFeeIds: mongoose.Types.ObjectId[] = [];
      let totalNewPaid = 0;
      let totalNewDue = 0;

      let remainingNewPayment =
        payload.paidAmount !== undefined
          ? Math.max(
            0,
            Number(payload.paidAmount) -
            paidFees.reduce((s, f) => s + (f.paidAmount || 0), 0),
          )
          : 0;

      for (const item of allNewFeeItems) {
        let paidForThisItem = 0;

        const isPriority =
          item.month === 'Admission' || item.month === currentMonthName;

        if (remainingNewPayment > 0 && isPriority) {
          const canPay = Math.min(remainingNewPayment, item.netAmount);
          paidForThisItem = canPay;
          remainingNewPayment -= canPay;
        }

        const dueAmount = Math.max(0, item.netAmount - paidForThisItem);
        totalNewPaid += paidForThisItem;
        totalNewDue += dueAmount;

        const status =
          dueAmount <= 0 && item.netAmount > 0
            ? 'paid'
            : paidForThisItem > 0
              ? 'partial'
              : 'unpaid';

        const feeData: any = {
          enrollment: existingEnrollment._id,
          student: existingEnrollment.student,
          studentId:
            existingEnrollment.studentId || studentDoc?.studentId || '',
          feeType: item.feeType,
          amount: item.amount,
          discount: item.discount,
          paidAmount: paidForThisItem,
          dueAmount,
          className: item.className,
          month: item.month,
          academicYear: currentYear,
          paymentMethod: payload.paymentMethod || 'cash',
          status,
          isCurrentMonth: item.month === currentMonthName,
        };

        if (item.isMonthly) {
          feeData.discountRangeStart = item.discountRangeStart;
          feeData.discountRangeEnd = item.discountRangeEnd;
          feeData.discountRangeAmount = item.discountRangeAmount;
        }

        const [createdFee] = await Fees.create([feeData], { session });
        newFeeIds.push(createdFee._id);
      }

      // ── 3.5 Calculate totals including locked paid fees ───────────────────
      const paidFeeTotal = paidFees.reduce(
        (s, f) => s + (f.paidAmount || 0),
        0,
      );
      const paidFeeDue = paidFees.reduce((s, f) => s + (f.dueAmount || 0), 0);

      const allFeeIds = [...paidFeeIds, ...newFeeIds];

      const totalPaidFinal = paidFeeTotal + totalNewPaid;
      const totalDueFinal = paidFeeDue + totalNewDue;

      // Recalculate total & discount from all fees (paid + new)
      const allFeeDocs = await Fees.find({ _id: { $in: allFeeIds } })
        .session(session)
        .lean();
      const totalAmount = allFeeDocs.reduce((s, f) => s + (f.amount || 0), 0);
      const totalDiscount = allFeeDocs.reduce(
        (s, f) => s + (f.discount || 0),
        0,
      );

      // ── 3.6 Update enrollment with merged fee data ────────────────────────
      existingEnrollment.fees = allFeeIds as any;
      existingEnrollment.totalAmount = totalAmount;
      existingEnrollment.totalDiscount = totalDiscount;
      existingEnrollment.paidAmount = totalPaidFinal;
      existingEnrollment.dueAmount = totalDueFinal;
      existingEnrollment.paymentStatus =
        totalDueFinal <= 0
          ? 'paid'
          : totalPaidFinal > 0
            ? 'partial'
            : 'pending';
      await existingEnrollment.save({ session });

      // ── 3.7 Update student with new fees ─────────────────────────────────
      if (studentDoc) {
        studentDoc.fees = [...(studentDoc.fees || []), ...newFeeIds];
        await studentDoc.save({ session });
      }

      // ── 3.8 Create payment/receipt ONLY for new paid amounts ─────────────
      // Find all new fees with paidAmount > 0
      const newPaidFeeDocs = await Fees.find({
        _id: { $in: newFeeIds },
        paidAmount: { $gt: 0 },
      })
        .session(session)
        .lean();

      if (newPaidFeeDocs.length > 0) {
        const newPaidTotal = newPaidFeeDocs.reduce(
          (s, f) => s + (f.paidAmount || 0),
          0,
        );
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const receiptNo = `RCP-${timestamp}-${random}`;
        const transactionId = `TXN-${timestamp}`;

        const [payment] = await Payment.create(
          [
            {
              student: existingEnrollment.student,
              enrollment: existingEnrollment._id,
              fees: newPaidFeeDocs.map((f) => f._id),
              totalAmount: newPaidTotal,
              paymentMethod: payload.paymentMethod || 'cash',
              receiptNo,
              transactionId,
              status: 'completed',
              collectedBy: payload.collectedBy || 'Admin',
              paymentDate: new Date(),
            },
          ],
          { session },
        );

        const receiptFees = newPaidFeeDocs.map((fee: any) => {
          let month = fee.month || 'Admission';
          if (fee.feeType?.includes(' - ')) {
            const last = fee.feeType.split(' - ').pop();
            if (MONTHS.includes(last)) month = last;
          }
          return {
            feeType: fee.feeType,
            month,
            originalAmount: fee.amount,
            discount: fee.discount || 0,
            waiver: 0,
            netAmount: Math.max(0, fee.amount - (fee.discount || 0)),
            paidAmount: fee.paidAmount || 0,
          };
        });

        const [receipt] = await Receipt.create(
          [
            {
              receiptNo,
              student: existingEnrollment.student,
              studentName:
                payload.studentName || existingEnrollment.studentName || '',
              studentId:
                existingEnrollment.studentId || studentDoc?.studentId || '',
              className: primaryClassName,
              paymentId: payment._id,
              totalAmount: newPaidTotal,
              paymentMethod: payload.paymentMethod || 'cash',
              paymentDate: new Date(),
              collectedBy: payload.collectedBy || 'Admin',
              transactionId,
              fees: receiptFees,
              summary: {
                totalItems: receiptFees.length,
                subtotal: receiptFees.reduce((s, f) => s + f.originalAmount, 0),
                totalDiscount: receiptFees.reduce((s, f) => s + f.discount, 0),
                totalWaiver: 0,
                totalNetAmount: receiptFees.reduce(
                  (s, f) => s + f.netAmount,
                  0,
                ),
                amountPaid: newPaidTotal,
              },
              status: 'active',
            },
          ],
          { session },
        );

        if (studentDoc) {
          studentDoc.payments = [...(studentDoc.payments || []), payment._id];
          studentDoc.receipts = [...(studentDoc.receipts || []), receipt._id];
          await studentDoc.save({ session });
        }

        existingEnrollment.payment = payment._id;
        await existingEnrollment.save({ session });
      }
    } else if (
      payload.totalAmount !== undefined ||
      payload.paidAmount !== undefined
    ) {
      if (payload.totalAmount !== undefined)
        existingEnrollment.totalAmount = payload.totalAmount;
      if (payload.paidAmount !== undefined)
        existingEnrollment.paidAmount = payload.paidAmount;
      if (payload.dueAmount !== undefined)
        existingEnrollment.dueAmount = payload.dueAmount;
      if (payload.totalDiscount !== undefined)
        existingEnrollment.totalDiscount = payload.totalDiscount;
      if (payload.paymentStatus !== undefined)
        existingEnrollment.paymentStatus = payload.paymentStatus;
      await existingEnrollment.save({ session });
    }

    await session.commitTransaction();
    session.endSession();
    console.log('=== updateEnrollment SUCCESS ===');

    const updatedEnrollment = await Enrollment.findById(id)
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
      .lean();

    return {
      success: true,
      message: 'Enrollment updated successfully',
      data: updatedEnrollment,
    };
  } catch (error: any) {
    if (session.inTransaction()) await session.abortTransaction();
    session.endSession();
    console.error('=== updateEnrollment ERROR ===', error.message);
    return {
      success: false,
      message: error.message || 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      data: null,
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
    const student =
      await Student.findById(studentId).session(sessionTransaction);
    if (!student) {
      throw new AppError(httpStatus.NOT_FOUND, 'Student not found');
    }

    // 2. Find the CURRENT ACTIVE enrollment
    const currentEnrollment = await Enrollment.findOne({
      student: studentId,
      status: 'active',
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

    // 3. Validate Target Class
    const newClass =
      await Class.findById(newClassId).session(sessionTransaction);
    if (!newClass) {
      throw new AppError(httpStatus.NOT_FOUND, 'Target class not found');
    }

    // 4. Prevent duplicate promotion
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

    const currentYear = new Date().getFullYear();

    // ----- Build parentInfo for new enrollment -----
    // Prefer student.parentInfo; if not available, try currentEnrollment.parentInfo;
    // finally fall back to constructing from flat fields (backward compatibility).
    let parentInfo: any = student.parentInfo || currentEnrollment.parentInfo;
    if (!parentInfo) {
      // Build from flat fields (if present)
      parentInfo = {
        father: {
          nameBangla: (student as any).fatherNameBangla || '',
          nameEnglish: (student as any).fatherName || '',
          profession: (student as any).fatherProfession || '',
          education: '',
          mobile: (student as any).fatherMobile || '',
          whatsapp: '',
          nid: (student as any).fatherNid || '',
          income: (student as any).fatherIncome || 0,
        },
        mother: {
          nameBangla: (student as any).motherNameBangla || '',
          nameEnglish: (student as any).motherName || '',
          profession: (student as any).motherProfession || '',
          education: '',
          mobile: (student as any).motherMobile || '',
          whatsapp: '',
          nid: (student as any).motherNid || '',
          income: (student as any).motherIncome || 0,
        },
        guardian: {
          nameBangla: (student as any).guardianNameBangla || '',
          nameEnglish: (student as any).guardianName || '',
          relation: (student as any).guardianRelation || '',
          mobile: (student as any).guardianMobile || '',
          whatsapp: '',
          profession: '',
          address: (student as any).guardianVillage || '',
        },
      };
    }

    // 5. Prepare Data for New Enrollment
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
      birthRegistrationNo:
        student.birthRegistrationNo ||
        currentEnrollment.birthRegistrationNo ||
        '',
      bloodGroup: student.bloodGroup || currentEnrollment.bloodGroup || '',
      nationality:
        student.nationality || currentEnrollment.nationality || 'Bangladesh',
      studentDepartment: currentEnrollment.studentDepartment || 'hifz',

      className: [new Types.ObjectId(newClassId)],
      section: section || currentEnrollment.section || '',
      roll:
        rollNumber ||
        (currentEnrollment.roll
          ? String(Number(currentEnrollment.roll) + 1)
          : '1'),
      session: currentYear.toString(),
      batch: currentEnrollment.batch || '',
      studentType: currentEnrollment.studentType || '',

      // New parentInfo structure
      parentInfo,

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
      totalAmount: 0,
      paidAmount: 0,
      dueAmount: 0,
      totalDiscount: 0,
      advanceBalance: currentEnrollment.advanceBalance || 0,
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

    // 9. Generate Fees based on NEW Class
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
              amount: amount,
              paidAmount: 0,
              discount: 0,
              waiver: 0,
              dueAmount: amount,
              status: 'unpaid',
              academicYear: currentYear.toString(),
              isCurrentMonth: isCurrentMonth,
              isMonthly: true,
            };
            const [monthlyFee] = await Fees.create([monthFeeData], {
              session: sessionTransaction,
            });
            feeDocs.push(monthlyFee._id);
          }
        } else if (amount > 0) {
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
          feeDocs.push(newFee._id);
        }
      }

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
    .populate({
      path: 'className',
      select: 'className',
    })
    .populate({
      path: 'promotedFrom',
      select: 'className roll status admissionType createdAt',
      populate: {
        path: 'className',
        select: 'className',
      },
    })
    .populate({
      path: 'promotedTo',
      select: 'className roll status admissionType createdAt',
      populate: {
        path: 'className',
        select: 'className',
      },
    })
    .select(
      'className status admissionType createdAt roll promotedFrom promotedTo',
    );

  const history = enrollments.map((enrollment: any) => ({
    enrollmentId: enrollment._id,

    className: enrollment.className?.[0]?.className || 'N/A',
    status: enrollment.status,
    admissionType: enrollment.admissionType,
    roll: enrollment.roll,
    createdAt: enrollment.createdAt,

    promotedFrom: enrollment.promotedFrom
      ? {
          enrollmentId: enrollment.promotedFrom._id,
          className: enrollment.promotedFrom.className?.[0]?.className || 'N/A',
          roll: enrollment.promotedFrom.roll,
          status: enrollment.promotedFrom.status,
          admissionType: enrollment.promotedFrom.admissionType,
        }
      : null,

    promotedTo: enrollment.promotedTo
      ? {
          enrollmentId: enrollment.promotedTo._id,
          className: enrollment.promotedTo.className?.[0]?.className || 'N/A',
          roll: enrollment.promotedTo.roll,
          status: enrollment.promotedTo.status,
          admissionType: enrollment.promotedTo.admissionType,
        }
      : null,
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

        // Find student
        const student =
          await Student.findById(studentId).session(sessionTransaction);
        if (!student) {
          errors.push({ studentId, error: 'Student not found' });
          continue;
        }

        // Find current active enrollment
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

        const currentClassId = (currentEnrollment.className as any)[0];
        const currentClass =
          await Class.findById(currentClassId).session(sessionTransaction);
        if (!currentClass) {
          errors.push({ studentId, error: 'Current class data not found' });
          continue;
        }

        const currentYear = new Date().getFullYear();

        // ----- Build parentInfo for new enrollment -----
        let parentInfo: any =
          student.parentInfo || currentEnrollment.parentInfo;
        if (!parentInfo) {
          // Fallback: construct from flat fields (if present)
          parentInfo = {
            father: {
              nameBangla: (student as any).fatherNameBangla || '',
              nameEnglish: (student as any).fatherName || '',
              profession: (student as any).fatherProfession || '',
              education: '',
              mobile: (student as any).fatherMobile || '',
              whatsapp: '',
              nid: (student as any).fatherNid || '',
              income: (student as any).fatherIncome || 0,
            },
            mother: {
              nameBangla: (student as any).motherNameBangla || '',
              nameEnglish: (student as any).motherName || '',
              profession: (student as any).motherProfession || '',
              education: '',
              mobile: (student as any).motherMobile || '',
              whatsapp: '',
              nid: (student as any).motherNid || '',
              income: (student as any).motherIncome || 0,
            },
            guardian: {
              nameBangla: (student as any).guardianNameBangla || '',
              nameEnglish: (student as any).guardianName || '',
              relation: (student as any).guardianRelation || '',
              mobile: (student as any).guardianMobile || '',
              whatsapp: '',
              profession: '',
              address: (student as any).guardianVillage || '',
            },
          };
        }

        // Prepare new enrollment data with parentInfo and all required fields
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
          birthRegistrationNo:
            student.birthRegistrationNo ||
            currentEnrollment.birthRegistrationNo ||
            '',
          bloodGroup: student.bloodGroup || currentEnrollment.bloodGroup || '',
          nationality:
            student.nationality ||
            currentEnrollment.nationality ||
            'Bangladesh',
          studentDepartment: currentEnrollment.studentDepartment || 'hifz',

          className: [new Types.ObjectId(currentClassId)],
          section: section || currentEnrollment.section || '',
          roll:
            rollNumber ||
            (currentEnrollment.roll
              ? String(Number(currentEnrollment.roll) + 1)
              : '1'),
          session: currentYear.toString(),
          batch: currentEnrollment.batch || '',
          studentType: currentEnrollment.studentType || '',

          // New parent structure
          parentInfo,

          presentAddress:
            currentEnrollment.presentAddress || student.presentAddress || {},
          permanentAddress:
            currentEnrollment.permanentAddress ||
            student.permanentAddress ||
            {},
          documents: currentEnrollment.documents || student.documents || {},
          previousSchool:
            currentEnrollment.previousSchool || student.previousSchool || {},
          termsAccepted: true,
          admissionType: 'admission', // retention is a new admission (not promotion)
          promotedFrom: currentEnrollment._id,
          status: 'active',
          paymentStatus: 'pending',
          fees: [],
          totalAmount: 0,
          paidAmount: 0,
          dueAmount: 0,
          totalDiscount: 0,
          advanceBalance: currentEnrollment.advanceBalance || 0,
        };

        const [newEnrollment] = await Enrollment.create([newEnrollmentData], {
          session: sessionTransaction,
        });

        // Update old enrollment
        currentEnrollment.promotedTo = newEnrollment._id;
        currentEnrollment.status = 'failed';
        await currentEnrollment.save({ session: sessionTransaction });

        // Update student's current class
        student.className = [new Types.ObjectId(currentClassId)];
        await student.save({ session: sessionTransaction });

        // Generate fees (same logic as before)
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
                  amount: amount,
                  paidAmount: 0,
                  discount: 0,
                  waiver: 0,
                  dueAmount: amount,
                  status: 'unpaid',
                  academicYear: currentYear.toString(),
                  isCurrentMonth: isCurrentMonth,
                  isMonthly: true,
                };

                const [monthlyFee] = await Fees.create([monthFeeData], {
                  session: sessionTransaction,
                });
                feeDocs.push(monthlyFee._id);
              }
            } else if (amount > 0) {
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
              feeDocs.push(newFee._id);
            }
          }

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
