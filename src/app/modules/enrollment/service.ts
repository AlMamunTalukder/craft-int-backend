/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import { Enrollment } from './model';
import QueryBuilder from '../../builder/QueryBuilder';
import mongoose from 'mongoose';
import { Student } from '../student/student.model';
import { Fees } from '../fees/model';
import { User } from '../user/user.model';

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
      classIds = payload.className.filter((cls: any) => cls && cls !== '');
    } else if (payload.className) {
      classIds = [payload.className].filter((cls: any) => cls && cls !== '');
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
    Object.keys(enrollmentData).forEach(key => {
      if (enrollmentData[key] === undefined || enrollmentData[key] === null) {
        delete enrollmentData[key];
      }
      if (typeof enrollmentData[key] === 'object' && Object.keys(enrollmentData[key]).length === 0) {
        delete enrollmentData[key];
      }
    });

    // --- STEP 2: Create or find Student ---
    let studentDoc = null;
    let studentId = payload.student;

    if (!studentId) {
      // Try to find existing student
      studentDoc = await Student.findOne({
        $or: [
          { mobile: payload.mobileNo },
          { name: payload.studentName },
          { nameBangla: payload.nameBangla },
        ],
      }).session(session);

      if (!studentDoc) {
        const studentEmail = payload.email || `${payload.mobileNo}@student.com` || 'student@gmail.com';
        let user = await User.findOne({ email: studentEmail }).session(session);

        if (!user) {
          const userData = {
            name: payload.studentName || 'Unnamed Student',
            email: studentEmail,
            password: 'student123',
            role: 'student',
          };
          const [newUser] = await User.create([userData], { session });
          user = newUser;
        }

        // Create new student
        const studentData: any = {
          name: payload.studentName || '',
          nameBangla: payload.nameBangla || '',
          mobile: payload.mobileNo || '',
          user: user._id,
          className: classIds.map(id => new mongoose.Types.ObjectId(id)),
          studentDepartment: payload.studentDepartment || 'hifz',
          status: 'active',
          studentId: `STU${Date.now()}`,
        };

        // Add optional fields
        if (payload.section) studentData.section = [payload.section];
        if (payload.session) studentData.activeSession = [payload.session];
        if (payload.studentType) studentData.studentType = payload.studentType;
        if (payload.birthDate) studentData.birthDate = payload.birthDate;
        if (payload.birthRegistrationNo) studentData.birthRegistrationNo = payload.birthRegistrationNo;
        if (payload.gender) studentData.gender = payload.gender;
        if (payload.bloodGroup) studentData.bloodGroup = payload.bloodGroup;
        if (payload.nationality) studentData.nationality = payload.nationality;
        if (payload.fatherName) studentData.fatherName = payload.fatherName;
        if (payload.fatherMobile) studentData.fatherMobile = payload.fatherMobile;
        if (payload.fatherProfession) studentData.fatherProfession = payload.fatherProfession;
        if (payload.motherName) studentData.motherName = payload.motherName;
        if (payload.motherMobile) studentData.motherMobile = payload.motherMobile;
        if (payload.motherProfession) studentData.motherProfession = payload.motherProfession;

        // Guardian info
        if (payload.guardianInfo && Object.keys(payload.guardianInfo).length > 0) {
          studentData.guardianName = payload.guardianInfo.name;
          studentData.guardianMobile = payload.guardianInfo.mobile;
          studentData.relation = payload.guardianInfo.relation;
        }

        // Address info
        if (payload.presentAddress && Object.keys(payload.presentAddress).length > 0) {
          studentData.presentAddress = payload.presentAddress.village;
          studentData.presentThana = payload.presentAddress.policeStation;
          studentData.presentDistrict = payload.presentAddress.district;
        }

        if (payload.permanentAddress && Object.keys(payload.permanentAddress).length > 0) {
          studentData.permanentAddress = payload.permanentAddress.village;
          studentData.permanentThana = payload.permanentAddress.policeStation;
          studentData.permanentDistrict = payload.permanentAddress.district;
        }

        if (payload.admissionFee) studentData.admissionFee = payload.admissionFee;
        if (payload.monthlyFee) studentData.monthlyFee = payload.monthlyFee;

        // Clean up student data
        Object.keys(studentData).forEach(key => {
          if (studentData[key] === undefined || studentData[key] === null || studentData[key] === '') {
            delete studentData[key];
          }
        });

        const [newStudent] = await Student.create([studentData], { session });
        studentDoc = newStudent;
      } else {
        // Update existing student with new classes
        const existingClassIds = studentDoc.className ? studentDoc.className.map((id: any) => id.toString()) : [];
        const newClassIds = classIds.filter(id => !existingClassIds.includes(id));

        if (newClassIds.length > 0) {
          const allClassIds = [...existingClassIds, ...newClassIds];
          studentDoc.className = allClassIds.map(id => new mongoose.Types.ObjectId(id));
          await studentDoc.save({ session });
        }
      }
      studentId = studentDoc._id;
    } else {
      studentDoc = await Student.findById(studentId).session(session);
      if (!studentDoc) throw new Error('Invalid Student ID');
    }

    // --- STEP 3: Create Enrollment ---
    const [newEnrollment] = await Enrollment.create(
      [{ ...enrollmentData, student: studentId }],
      { session },
    );

    // --- STEP 4: Process Fees with REQUIRED month field ---
    const feeDocs: mongoose.Types.ObjectId[] = [];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentDate = new Date();
    const currentMonth = monthNames[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear();

    // Process all fees from payload
    if (payload.fees && Array.isArray(payload.fees)) {
      for (const fee of payload.fees) {
        if (!fee.feeType || !fee.className || fee.feeType.length === 0 || fee.className.length === 0) continue;

        const feeTypeValue = Array.isArray(fee.feeType) ? fee.feeType[0] : fee.feeType;
        const classNameValue = Array.isArray(fee.className) ? fee.className[0] : fee.className;

        // Extract actual values from objects if needed
        const actualFeeType = typeof feeTypeValue === 'object' ? feeTypeValue.label || feeTypeValue.value || feeTypeValue : feeTypeValue;
        const actualClassName = typeof classNameValue === 'object' ? classNameValue.label || classNameValue.value || classNameValue : classNameValue;

        const normalizedType = (() => {
          const type = String(actualFeeType).toLowerCase();
          if (type.includes('admission')) return 'admission';
          if (type.includes('monthly') || type.includes('yearly') || type.includes('annual')) return 'monthly';
          if (type.includes('exam')) return 'exam';
          if (type.includes('homework') || type.includes('home work')) return 'homework';
          return 'other';
        })();

        const feeAmount = Number(fee.feeAmount) || 0;
        const paidAmount = Number(fee.paidAmount) || 0;

        // For monthly fees, generate records for all 12 months
        if (normalizedType === 'monthly' && feeAmount > 0) {
          // Generate monthly fees for all months of the current year
          for (let i = 0; i < 12; i++) {
            const monthFeeData: any = {
              enrollment: newEnrollment._id,
              student: studentId,
              feeType: normalizedType,
              class: actualClassName,
              month: monthNames[i], // REQUIRED FIELD - providing for each month
              amount: feeAmount,
              paidAmount: i === 0 ? paidAmount : 0, // Apply payment only to current month
              dueAmount: i === 0 ? Math.max(0, feeAmount - paidAmount) : feeAmount,
              discount: 0,
              waiver: 0,
              status: i === 0 ? (paidAmount >= feeAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid') : 'unpaid',
            };

            // Add payment info if payment was made for current month
            if (i === 0 && paidAmount > 0) {
              monthFeeData.paymentMethod = 'cash';
              monthFeeData.paymentDate = new Date();
            }

            const [monthlyFee] = await Fees.create([monthFeeData], { session });
            feeDocs.push(monthlyFee._id as mongoose.Types.ObjectId);
          }
          console.log(`Generated 12 monthly fee records for ${currentYear}`);
        } else {
          // For non-monthly fees (admission, exam, etc.), create single record with current month
          if (feeAmount > 0) {
            const feeData: any = {
              enrollment: newEnrollment._id,
              student: studentId,
              feeType: normalizedType,
              class: actualClassName,
              month: currentMonth, // REQUIRED FIELD - using current month for one-time fees
              amount: feeAmount,
              paidAmount: paidAmount,
              dueAmount: Math.max(0, feeAmount - paidAmount),
              discount: 0,
              waiver: 0,
              status: paidAmount >= feeAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
            };

            // Add payment info if payment was made
            if (paidAmount > 0) {
              feeData.paymentMethod = 'cash';
              feeData.paymentDate = new Date();
            }

            const [newFee] = await Fees.create([feeData], { session });
            feeDocs.push(newFee._id as mongoose.Types.ObjectId);
          }
        }
      }
    }

    // --- STEP 5: Link Fees to Enrollment and Student ---
    if (feeDocs.length > 0) {
      newEnrollment.fees = feeDocs;
      await newEnrollment.save({ session });

      // Update student fees
      const existingStudentFees = studentDoc.fees ? studentDoc.fees.map((id: any) => id.toString()) : [];
      const newFeeIds = feeDocs.map(id => id.toString()).filter(id => !existingStudentFees.includes(id));

      if (newFeeIds.length > 0) {
        const allFeeIds = [...existingStudentFees, ...newFeeIds];
        studentDoc.fees = allFeeIds.map(id => new mongoose.Types.ObjectId(id));
        await studentDoc.save({ session });
      }
    }

    // --- STEP 6: Commit Transaction ---
    await session.commitTransaction();
    session.endSession();

    // Populate the enrollment data before returning
    const populatedEnrollment = await Enrollment.findById(newEnrollment._id)
      .populate('student')
      .populate('fees')
      .populate('className');

    return {
      success: true,
      message: 'Enrollment created successfully with linked student and fee data',
      data: populatedEnrollment,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error('Enrollment Creation Failed:', error);

    // Provide proper error response format
    throw {
      status: 500,
      data: {
        success: false,
        message: error.message || 'Failed to create enrollment',
        errorMessages: error.message || 'Failed to create enrollment'
      }
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

    // Update enrollment fields - FIXED TYPE ERROR
    const updateableFields = [
      'studentName', 'nameBangla', 'studentPhoto', 'mobileNo', 'rollNumber',
      'gender', 'birthDate', 'birthRegistrationNo', 'bloodGroup', 'nationality',
      'section', 'roll', 'session', 'batch', 'studentType', 'studentDepartment',
      'fatherName', 'fatherNameBangla', 'fatherMobile', 'fatherNid', 'fatherProfession', 'fatherIncome',
      'motherName', 'motherNameBangla', 'motherMobile', 'motherNid', 'motherProfession', 'motherIncome',
      'guardianInfo', 'presentAddress', 'permanentAddress', 'documents', 'previousSchool',
      'termsAccepted', 'admissionType', 'paymentStatus', 'status'
    ];

    updateableFields.forEach(key => {
      if (payload[key] !== undefined) {
        (enrollment as any)[key] = payload[key];
      }
    });

    await enrollment.save({ session });

    // Update fees if provided
    if (payload.fees && Array.isArray(payload.fees)) {
      // Remove existing fees
      await Fees.deleteMany({ enrollment: id }).session(session);

      // Create new fees
      const feeDocs = [];
      for (const fee of payload.fees) {
        if (fee.feeType && fee.className) {
          // Extract fee type from array or string
          let feeTypeValue = '';
          if (Array.isArray(fee.feeType) && fee.feeType.length > 0) {
            feeTypeValue = fee.feeType[0]?.label || fee.feeType[0] || '';
          } else {
            feeTypeValue = fee.feeType || '';
          }

          const normalizedType = (() => {
            const type = feeTypeValue.toLowerCase();
            if (type.includes('admission')) return 'admission';
            if (type.includes('monthly') || type.includes('yearly')) return 'monthly';
            if (type.includes('exam')) return 'exam';
            return 'other';
          })();

          // Extract class name
          let classNameValue = '';
          if (Array.isArray(fee.className) && fee.className.length > 0) {
            classNameValue = fee.className[0]?.label || fee.className[0] || '';
          } else {
            classNameValue = fee.className || '';
          }

          const feeData = {
            enrollment: id,
            student: enrollment.student,
            feeType: normalizedType,
            class: classNameValue,
            amount: Number(fee.feeAmount) || 0,
            paidAmount: Number(fee.paidAmount) || 0,
            dueAmount: (Number(fee.feeAmount) || 0) - (Number(fee.paidAmount) || 0),
            paymentMethod: 'cash',
            paymentDate: Number(fee.paidAmount) > 0 ? new Date() : undefined,
            status: Number(fee.paidAmount) >= Number(fee.feeAmount) ? 'paid' : Number(fee.paidAmount) > 0 ? 'partial' : 'unpaid',
          };

          const newFee = await Fees.create([feeData], { session });
          feeDocs.push(newFee[0]._id);
        }
      }

      enrollment.fees = feeDocs;
      await enrollment.save({ session });
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
    console.error('Enrollment Update Failed:', error);
    throw new Error(error.message || 'Failed to update enrollment');
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
