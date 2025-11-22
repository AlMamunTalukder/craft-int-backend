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

const promoteEnrollment = async (
  studentId: string,
  newClassId: string,
  session: string,
) => {
  const lastEnrollment = await Enrollment.findOne({ student: studentId }).sort({
    session: -1,
  });
  const newEnrollment = await Enrollment.create({
    student: studentId,
    class: newClassId,
    session,
    admissionType: lastEnrollment ? 'promotion' : 'admission',
    promotedFrom: lastEnrollment?._id || null,
  });

  if (lastEnrollment) {
    lastEnrollment.promotedTo = newEnrollment._id;
    await lastEnrollment.save();
  }

  return newEnrollment;
};

const getAllEnrollments = async (query: Record<string, any>) => {
  const queryBuilder = new QueryBuilder(Enrollment.find(), query)
    .filter()
    .sort()
    .paginate()
    .fields()
    .populate('fees');

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
    // --- Extract class IDs as array ---
    let classIds: string[] = [];

    if (Array.isArray(payload.className)) {
      classIds = payload.className
        .filter((cls: any) => cls && cls !== '')
        .map((cls: any) => {
          // Extract value from object if it's an object
          return typeof cls === 'object' ? cls.value || cls._id || cls : cls;
        });
    } else if (payload.className) {
      classIds = [payload.className]
        .filter((cls: any) => cls && cls !== '')
        .map((cls: any) => {
          return typeof cls === 'object' ? cls.value || cls._id || cls : cls;
        });
    }

    if (!classIds.length) {
      throw new Error('At least one class is required');
    }

    // Validate that classIds are valid ObjectIds
    for (const classId of classIds) {
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        throw new Error(`Invalid class ID: ${classId}`);
      }
    }

    // --- STEP 1: Normalize data to match schema ---
    const enrollmentData: any = {
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
      className: classIds[0],
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

    // --- STEP 2: Create or find Student ---
    let studentDoc = null;
    let studentId = payload.student;

    console.log('🔍 Looking for existing student...', {
      mobile: payload.mobileNo,
      name: payload.studentName,
      nameBangla: payload.nameBangla,
      providedStudentId: payload.student,
    });

    if (!studentId) {
      // Try to find existing student by mobile or name
      studentDoc = await Student.findOne({
        $or: [
          { mobile: payload.mobileNo },
          { name: payload.studentName },
          { nameBangla: payload.nameBangla },
        ],
      }).session(session);

      console.log('📋 Existing student found:', studentDoc ? 'YES' : 'NO');

      if (!studentDoc) {
        console.log('👤 Creating new student and user...');

        // Generate unique student email
        const studentEmail =
          payload.email ||
          `${payload.mobileNo}@student.craft.edu` ||
          `student${Date.now()}@craft.edu`;

        console.log('📧 Creating user with email:', studentEmail);

        // Create user first
        let user = await User.findOne({ email: studentEmail }).session(session);

        if (!user) {
          const userData = {
            name: payload.studentName || 'Unnamed Student',
            email: studentEmail,
            password: 'student123',
            role: 'student',
            needsPasswordChange: true,
          };
          console.log('🆕 Creating new user:', userData);

          const [newUser] = await User.create([userData], { session });
          user = newUser;
          console.log('✅ User created successfully:', user._id);
        } else {
          console.log('ℹ️ User already exists:', user._id);
        }

        // Create new student with COMPLETE data
        const studentData: any = {
          name: payload.studentName || '',
          nameBangla: payload.nameBangla || '',
          mobile: payload.mobileNo || '',
          email: studentEmail,
          user: user._id,
          className: classIds.map((id) => new mongoose.Types.ObjectId(id)),
          studentDepartment: payload.studentDepartment || 'hifz',
          status: 'active',
          studentId: `STU${Date.now()}`,
          smartIdCard: `CRAFT${Date.now()}`,

          // Personal Information
          birthDate: payload.birthDate || '',
          birthRegistrationNo: payload.birthRegistrationNo || '',
          gender: payload.gender || '',
          bloodGroup: payload.bloodGroup || '',
          nationality: payload.nationality || 'Bangladeshi',

          // Academic Information
          section: payload.section ? [payload.section] : [],
          activeSession: payload.session ? [payload.session] : [],
          studentClassRoll: payload.rollNumber || '',
          batch: payload.batch || '',
          studentType: payload.studentType || 'regular',

          // Parent Information
          fatherName: payload.fatherName || '',
          fatherMobile: payload.fatherMobile || '',
          fatherProfession: payload.fatherProfession || '',
          motherName: payload.motherName || '',
          motherMobile: payload.motherMobile || '',
          motherProfession: payload.motherProfession || '',

          // Guardian Information
          guardianInfo: {
            name: payload.guardianInfo?.name || payload.fatherName || '',
            relation: payload.guardianInfo?.relation || 'father',
            mobile: payload.guardianInfo?.mobile || payload.fatherMobile || '',
            address: payload.guardianInfo?.address || '',
          },

          // Address Information
          presentAddress: {
            village: payload.presentAddress?.village || payload.village || '',
            postOffice:
              payload.presentAddress?.postOffice || payload.postOffice || '',
            postCode:
              payload.presentAddress?.postCode || payload.postCode || '',
            policeStation:
              payload.presentAddress?.policeStation ||
              payload.policeStation ||
              '',
            district:
              payload.presentAddress?.district || payload.district || '',
          },

          permanentAddress: {
            village:
              payload.permanentAddress?.village || payload.permVillage || '',
            postOffice:
              payload.permanentAddress?.postOffice ||
              payload.permPostOffice ||
              '',
            postCode:
              payload.permanentAddress?.postCode || payload.permPostCode || '',
            policeStation:
              payload.permanentAddress?.policeStation ||
              payload.permPoliceStation ||
              '',
            district:
              payload.permanentAddress?.district || payload.permDistrict || '',
          },

          // Documents
          documents: {
            birthCertificate:
              payload.documents?.birthCertificate ||
              payload.birthCertificate === 'Yes' ||
              false,
            transferCertificate:
              payload.documents?.transferCertificate ||
              payload.transferCertificate === 'Yes' ||
              false,
            characterCertificate:
              payload.documents?.characterCertificate ||
              payload.characterCertificate === 'Yes' ||
              false,
            markSheet:
              payload.documents?.markSheet ||
              payload.markSheet === 'Yes' ||
              false,
            photographs:
              payload.documents?.photographs ||
              payload.photographs === 'Yes' ||
              false,
          },

          // Previous School
          previousSchool: {
            institution:
              payload.previousSchool?.institution ||
              payload.formerInstitution ||
              '',
            address:
              payload.previousSchool?.address || payload.formerVillage || '',
          },

          // Fees Information
          admissionFee: payload.admissionFee || 0,
          monthlyFee: payload.monthlyFee || 0,
          advanceBalance: 0,
        };

        // Clean up student data - remove empty strings, undefined, null
        Object.keys(studentData).forEach((key) => {
          if (studentData[key] === undefined || studentData[key] === null) {
            delete studentData[key];
          }

          // Clean nested objects
          if (typeof studentData[key] === 'object') {
            Object.keys(studentData[key]).forEach((subKey) => {
              if (
                studentData[key][subKey] === undefined ||
                studentData[key][subKey] === null ||
                studentData[key][subKey] === ''
              ) {
                delete studentData[key][subKey];
              }
            });

            // Remove empty nested objects
            if (Object.keys(studentData[key]).length === 0) {
              delete studentData[key];
            }
          }
        });

        console.log('🎯 Creating student with data:', {
          name: studentData.name,
          mobile: studentData.mobile,
          className: studentData.className,
          studentId: studentData.studentId,
        });

        const [newStudent] = await Student.create([studentData], { session });
        studentDoc = newStudent;
        studentId = newStudent._id;

        console.log('✅ Student created successfully:', studentId);
      } else {
        console.log('🔄 Updating existing student with new classes');
        // Update existing student with new classes
        const existingClassIds = studentDoc.className
          ? studentDoc.className.map((id: any) => id.toString())
          : [];
        const newClassIds = classIds.filter(
          (id) => !existingClassIds.includes(id),
        );

        if (newClassIds.length > 0) {
          const allClassIds = [...existingClassIds, ...newClassIds];
          studentDoc.className = allClassIds.map(
            (id) => new mongoose.Types.ObjectId(id),
          );
          await studentDoc.save({ session });
          console.log('✅ Student classes updated');
        }

        studentId = studentDoc._id;
      }
    } else {
      console.log('🔍 Finding student by provided ID:', studentId);
      studentDoc = await Student.findById(studentId).session(session);
      if (!studentDoc) throw new Error('Invalid Student ID');
      console.log('✅ Student found by ID');
    }

    // --- STEP 3: Create Enrollment ---
    console.log('📝 Creating enrollment for student:', studentId);
    const [newEnrollment] = await Enrollment.create(
      [{ ...enrollmentData, student: studentId }],
      { session },
    );
    console.log('✅ Enrollment created:', newEnrollment._id);

    // --- STEP 4: Process Fees with DISCOUNT/WAIVER SUPPORT ---
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
    const currentYear = currentDate.getFullYear();

    console.log('💰 Processing fees...');

    // Process all fees from payload
    if (payload.fees && Array.isArray(payload.fees)) {
      console.log(`📋 Found ${payload.fees.length} fee entries`);

      for (const fee of payload.fees) {
        if (
          !fee.feeType ||
          !fee.className ||
          fee.feeType.length === 0 ||
          fee.className.length === 0
        ) {
          console.log('⏭️ Skipping fee entry - missing feeType or className');
          continue;
        }

        const feeTypeValue = Array.isArray(fee.feeType)
          ? fee.feeType[0]
          : fee.feeType;
        const classNameValue = Array.isArray(fee.className)
          ? fee.className[0]
          : fee.className;

        // Extract actual values from objects if needed
        const actualFeeType =
          typeof feeTypeValue === 'object'
            ? feeTypeValue.label || feeTypeValue.value || feeTypeValue
            : feeTypeValue;
        const actualClassName =
          typeof classNameValue === 'object'
            ? classNameValue.label || classNameValue.value || classNameValue
            : classNameValue;

        // Keep feeType as is (dynamic string)
        const feeType = String(actualFeeType);

        const feeAmount = Number(fee.feeAmount) || 0;
        const paidAmount = Number(fee.paidAmount) || 0;

        // ✅ Get discount and waiver from payload
        const discountAmount = Number(fee.discount) || 0;
        const waiverAmount = Number(fee.waiver) || 0;

        console.log(
          `💳 Processing fee: ${feeType}, Amount: ${feeAmount}, Discount: ${discountAmount}, Waiver: ${waiverAmount}`,
        );

        // ✅ Validate that discount + waiver doesn't exceed fee amount
        if (discountAmount + waiverAmount > feeAmount) {
          throw new Error(
            `Total adjustments (${discountAmount + waiverAmount}) cannot exceed fee amount (${feeAmount}) for ${feeType}`,
          );
        }

        // ✅ Calculate due amount with discount and waiver
        const netAmount = feeAmount - discountAmount - waiverAmount;
        const dueAmount = Math.max(0, netAmount - paidAmount);

        // Check if this is a monthly fee based on feeType name
        const isMonthlyFee =
          feeType.toLowerCase().includes('monthly') ||
          feeType.toLowerCase().includes('yearly') ||
          feeType.toLowerCase().includes('annual');

        // For monthly fees, generate records for all 12 months
        if (isMonthlyFee && feeAmount > 0) {
          // Calculate monthly amount from yearly amount
          const monthlyAmount = feeAmount / 12;

          // ✅ Calculate monthly discount and waiver
          const monthlyDiscount = discountAmount / 12;
          const monthlyWaiver = waiverAmount / 12;
          const monthlyNetAmount =
            monthlyAmount - monthlyDiscount - monthlyWaiver;

          console.log(`📅 Generating 12 monthly fees for ${feeType}`);

          // Generate monthly fees for all months of the current year
          for (let i = 0; i < 12; i++) {
            const isCurrentMonth = i === currentMonthIndex;
            const isPastMonth = i < currentMonthIndex;

            const monthPaidAmount = isCurrentMonth
              ? paidAmount
              : isPastMonth
                ? monthlyNetAmount
                : 0;
            const monthDueAmount = monthlyNetAmount - monthPaidAmount;

            const monthFeeData: any = {
              enrollment: newEnrollment._id,
              student: studentId,
              feeType: feeType,
              class: actualClassName,
              month: `${monthNames[i]}-${currentYear}`,
              amount: monthlyAmount,
              paidAmount: monthPaidAmount,
              // ✅ Include discount and waiver in monthly records
              discount: monthlyDiscount,
              waiver: monthlyWaiver,
              dueAmount: Math.max(0, monthDueAmount),
              status:
                monthDueAmount <= 0
                  ? 'paid'
                  : monthPaidAmount > 0
                    ? 'partial'
                    : 'unpaid',
              academicYear: currentYear.toString(),
              isCurrentMonth: isCurrentMonth,
            };

            // Add payment info if payment was made for current month
            if (isCurrentMonth && paidAmount > 0) {
              monthFeeData.paymentMethod = 'cash';
              monthFeeData.paymentDate = new Date();
            }

            const [monthlyFee] = await Fees.create([monthFeeData], { session });
            feeDocs.push(monthlyFee._id as mongoose.Types.ObjectId);
          }
          console.log(
            `✅ Generated 12 monthly fee records for ${currentYear} with adjustments`,
          );
        } else {
          // For non-monthly fees (admission, exam, etc.), create single record with current month
          if (feeAmount > 0) {
            const feeData: any = {
              enrollment: newEnrollment._id,
              student: studentId,
              feeType: feeType,
              class: actualClassName,
              month: `${currentMonth}-${currentYear}`,
              amount: feeAmount,
              paidAmount: paidAmount,
              // ✅ Include discount and waiver in single fee record
              discount: discountAmount,
              waiver: waiverAmount,
              dueAmount: dueAmount,
              status:
                dueAmount <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
              academicYear: currentYear.toString(),
              isCurrentMonth: true,
            };

            // Add payment info if payment was made
            if (paidAmount > 0) {
              feeData.paymentMethod = 'cash';
              feeData.paymentDate = new Date();
            }

            const [newFee] = await Fees.create([feeData], { session });
            feeDocs.push(newFee._id as mongoose.Types.ObjectId);
            console.log(`✅ Created single fee record for ${feeType}`);
          }
        }
      }
    } else {
      console.log('⚠️ No fees found in payload');
    }

    // --- STEP 5: Link Fees to Enrollment and Student ---
    if (feeDocs.length > 0) {
      console.log(
        `🔗 Linking ${feeDocs.length} fees to enrollment and student`,
      );

      newEnrollment.fees = feeDocs;
      await newEnrollment.save({ session });

      // Update student fees
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
        console.log(`✅ Linked ${newFeeIds.length} new fees to student`);
      }
    }

    // --- STEP 6: Create Fee Adjustment Records if Discount/Waiver Applied ---
    if (payload.fees && Array.isArray(payload.fees)) {
      console.log('📊 Creating fee adjustment records...');

      for (const fee of payload.fees) {
        const discountAmount = Number(fee.discount) || 0;
        const waiverAmount = Number(fee.waiver) || 0;

        // Create FeeAdjustment records for discount
        if (discountAmount > 0 && feeDocs.length > 0) {
          const discountAdjustment = {
            student: studentId,
            fee: feeDocs[0], // Use the first fee doc ID as reference
            enrollment: newEnrollment._id,
            type: 'discount',
            adjustmentType: 'flat',
            value: discountAmount,
            reason: 'Enrollment time discount',
            approvedBy: new mongoose.Types.ObjectId(), // You might want to set actual user ID
            startMonth: `${currentMonth}-${currentYear}`,
            endMonth: `${currentMonth}-${currentYear}`,
            academicYear: currentYear.toString(),
            isActive: true,
            isRecurring: false,
          };
          await FeeAdjustment.create([discountAdjustment], { session });
          console.log('✅ Created discount adjustment record');
        }

        // Create FeeAdjustment records for waiver
        if (waiverAmount > 0 && feeDocs.length > 0) {
          const waiverAdjustment = {
            student: studentId,
            fee: feeDocs[0], // Use the first fee doc ID as reference
            enrollment: newEnrollment._id,
            type: 'waiver',
            adjustmentType: 'flat',
            value: waiverAmount,
            reason: 'Enrollment time waiver',
            approvedBy: new mongoose.Types.ObjectId(), // You might want to set actual user ID
            startMonth: `${currentMonth}-${currentYear}`,
            endMonth: `${currentMonth}-${currentYear}`,
            academicYear: currentYear.toString(),
            isActive: true,
            isRecurring: false,
          };
          await FeeAdjustment.create([waiverAdjustment], { session });
          console.log('✅ Created waiver adjustment record');
        }
      }
    }

    // --- STEP 7: Commit Transaction ---
    console.log('✅ Committing transaction...');
    await session.commitTransaction();
    session.endSession();

    console.log('🎉 Enrollment process completed successfully!');

    // Populate the enrollment data before returning
    const populatedEnrollment = await Enrollment.findById(newEnrollment._id)
      .populate('student')
      .populate('fees')
      .populate('className');

    return {
      success: true,
      message:
        'Enrollment created successfully with linked student, fee data, and adjustments',
      data: populatedEnrollment,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Enrollment Creation Failed:', error);

    // Provide proper error response format
    throw {
      status: 500,
      data: {
        success: false,
        message: error.message || 'Failed to create enrollment',
        errorMessages: error.message || 'Failed to create enrollment',
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

export const enrollmentServices = {
  createEnrollment,
  promoteEnrollment,
  getAllEnrollments,
  getSingleEnrollment,
  updateEnrollment,
  deleteEnrollment,
};
