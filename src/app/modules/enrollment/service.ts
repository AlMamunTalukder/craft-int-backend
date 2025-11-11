/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import { Enrollment } from './model';
import QueryBuilder from '../../builder/QueryBuilder';
import mongoose, { Types } from 'mongoose';
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
    .populate([
      // { path: 'student', select: 'name mobile' },
      // { path: 'className', select: 'name group' },
      // { path: 'fees', select: 'feeType amount paidAmount status' },
    ]);

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

    const feeItems = Array.isArray(payload.fees) ? payload.fees : [];

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

      // Use the first class for enrollment (single reference)
      className: classIds[0],
      section: payload.section || '',
      roll: payload.roll || '',
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

    // Clean up enrollment data - remove empty objects and undefined values
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
        const studentEmail = payload.email || 'student@gmail.com';

        let user = await User.findOne({ email: studentEmail }).session(session);

        // If user doesn’t exist, create one
        if (!user) {
          const userData = {
            name: payload.studentName || 'Unnamed Student',
            email: studentEmail,
            password: 'student123', // default password
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
          // Store all classes in student record as ObjectIds
          className: classIds.map(id => new mongoose.Types.ObjectId(id)),
          studentDepartment: payload.studentDepartment || 'hifz',
          status: 'active',
        };

        // Add optional fields if they exist
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
        if (payload.guardianInfo && Object.keys(payload.guardianInfo).length > 0) {
          studentData.guardianInfo = payload.guardianInfo;
        }
        if (payload.presentAddress && Object.keys(payload.presentAddress).length > 0) {
          studentData.presentAddress = payload.presentAddress;
        }
        if (payload.permanentAddress && Object.keys(payload.permanentAddress).length > 0) {
          studentData.permanentAddress = payload.permanentAddress;
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

    // --- STEP 4: Create Fee Records ---
    const feeDocs: mongoose.Types.ObjectId[] = [];

    for (const fee of feeItems) {
      if (!fee.feeType || !fee.className) continue; // Skip invalid fees

      const normalizedType = (() => {
        const type = (fee.feeType?.toLowerCase() || '').trim();
        if (type.includes('admission')) return 'admission';
        if (type.includes('monthly')) return 'monthly';
        if (type.includes('exam')) return 'exam';
        if (type.includes('homework') || type.includes('home work')) return 'homework';
        return 'other';
      })();

      const feeData = {
        enrollment: newEnrollment._id,
        student: studentId,
        feeType: normalizedType,
        month: fee.month || null,
        amount: Number(fee.feeAmount) || 0,
        paidAmount: Number(fee.paidAmount) || 0,
        paymentMethod: 'cash',
        paymentDate: new Date(),
      };

      const [newFee] = await Fees.create([feeData], { session });
      feeDocs.push(newFee._id as mongoose.Types.ObjectId);

    }

    // --- STEP 5: Link Fees ---
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

    // --- STEP 6: Commit ---
    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      message: 'Enrollment created successfully with linked student and fee data',
      data: newEnrollment,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error('Enrollment Creation Failed:', error);

    // Provide more specific error messages
    let errorMessage = 'Failed to create enrollment';
    if (error.name === 'ValidationError') {
      errorMessage = `Validation Error: ${Object.values(error.errors).map((e: any) => e.message).join(', ')}`;
    } else if (error.code === 11000) {
      errorMessage = 'Duplicate entry found';
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

export const updateEnrollment = async (id: string, payload: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existing = await Enrollment.findById(id).session(session);
    if (!existing) {
      throw new AppError(httpStatus.NOT_FOUND, 'Enrollment not found');
    }

    const feeItems = payload.fees;
    delete payload.fees;

    Object.assign(existing, payload);

    if (feeItems && Array.isArray(feeItems)) {
      const feeDocs: Types.ObjectId[] = [];

      for (const fee of feeItems) {
        let feeTypeEnum = 'other';
        const feeType = fee.feeType?.toLowerCase();

        if (feeType?.includes('admission')) feeTypeEnum = 'admission';
        else if (feeType?.includes('monthly')) feeTypeEnum = 'monthly';
        else if (feeType?.includes('exam')) feeTypeEnum = 'exam';
        else if (
          feeType?.includes('homework') ||
          feeType?.includes('home work')
        )
          feeTypeEnum = 'homework';

        // Check if fee already exists (for update)
        let feeRecord;

        if (fee._id) {
          feeRecord = await Fees.findByIdAndUpdate(
            fee._id,
            {
              feeType: feeTypeEnum,
              amount: fee.feeAmount || 0,
              paidAmount: fee.paidAmount || 0,
              paymentMethod: 'cash',
              paymentDate: new Date(),
            },
            { new: true, session },
          );
        } else {
          // Create new fee
          [feeRecord] = await Fees.create(
            [
              {
                enrollment: existing._id,
                student: existing.student,
                feeType: feeTypeEnum,
                month: fee.month || null,
                amount: fee.feeAmount || 0,
                paidAmount: fee.paidAmount || 0,
                paymentMethod: 'cash',
                paymentDate: new Date(),
              },
            ],
            { session },
          );
        }

        if (feeRecord) {
          feeDocs.push(feeRecord._id as Types.ObjectId);
        }
      }
      if (feeDocs.length > 0) {
        existing.fees = feeDocs;
      }
    }

    const updated = await existing.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      message: 'Enrollment updated successfully',
      data: updated,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error('Enrollment update error:', error);
    throw new AppError(httpStatus.BAD_REQUEST, error.message);
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
