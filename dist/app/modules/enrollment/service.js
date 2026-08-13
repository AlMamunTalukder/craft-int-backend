"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollmentServices = exports.deleteEnrollment = exports.updateEnrollment = exports.createEnrollment = void 0;
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const model_1 = require("./model");
const mongoose_1 = __importStar(require("mongoose"));
const student_model_1 = require("../student/student.model");
const model_2 = require("../fees/model");
const user_model_1 = require("../user/user.model");
const student_utils_1 = require("../student/student.utils");
const model_3 = require("../payment/model");
const class_model_1 = require("../class/class.model");
const model_4 = require("../receipt/model");
const model_5 = require("../onlineAdmission/model");
const getAllEnrollments = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Number(query === null || query === void 0 ? void 0 : query.page) || 1;
    const limit = Number(query === null || query === void 0 ? void 0 : query.limit) || 1000;
    const skip = (page - 1) * limit;
    const matchStage = {};
    if (query === null || query === void 0 ? void 0 : query.searchTerm) {
        matchStage.$or = [
            { studentName: { $regex: query.searchTerm, $options: 'i' } },
            { studentId: { $regex: query.searchTerm, $options: 'i' } },
        ];
    }
    const pipeline = [
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
    const data = yield model_1.Enrollment.aggregate(pipeline);
    const total = yield model_1.Enrollment.countDocuments(matchStage);
    const meta = {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
    };
    return { meta, data };
});
const getSingleEnrollment = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const pipeline = [
        { $match: { _id: new mongoose_1.default.Types.ObjectId(id) } },
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
    const enrollments = yield model_1.Enrollment.aggregate(pipeline);
    if (!enrollments.length) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Enrollment not found');
    }
    return enrollments[0];
});
const getCurrentAcademicYear = () => {
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${currentYear + 1}`;
};
const createEnrollment = (payload, applicationId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        let classIds = [];
        let primaryClassName = '';
        let classNameForId = '';
        if (Array.isArray(payload.className)) {
            const rawClassIds = payload.className
                .filter((cls) => cls && cls !== '')
                .map((cls) => {
                var _a, _b;
                if (typeof cls === 'object') {
                    if (cls.className && !primaryClassName)
                        primaryClassName = cls.className;
                    if (cls.label && !primaryClassName)
                        primaryClassName = cls.label;
                    return ((_a = cls._id) === null || _a === void 0 ? void 0 : _a.toString()) || ((_b = cls.value) === null || _b === void 0 ? void 0 : _b.toString()) || '';
                }
                const strVal = typeof cls === 'string' ? cls.trim() : '';
                if (strVal && !primaryClassName) {
                    primaryClassName = strVal;
                }
                return strVal;
            })
                .filter((id) => id !== '');
            for (const item of rawClassIds) {
                if (mongoose_1.default.Types.ObjectId.isValid(item)) {
                    classIds.push(item);
                }
                else {
                    const classDoc = yield class_model_1.Class.findOne({
                        className: { $regex: new RegExp(`^${item}$`, 'i') },
                    }).session(session);
                    if (classDoc) {
                        classIds.push(classDoc._id.toString());
                    }
                    else {
                        throw new Error(`Class "${item}" not found in the system. Please select a valid class.`);
                    }
                }
            }
        }
        else if (payload.className) {
            const cls = payload.className;
            let rawId = '';
            if (typeof cls === 'object') {
                if (cls.className && !primaryClassName)
                    primaryClassName = cls.className;
                if (cls.label && !primaryClassName)
                    primaryClassName = cls.label;
                rawId = ((_a = cls._id) === null || _a === void 0 ? void 0 : _a.toString()) || ((_b = cls.value) === null || _b === void 0 ? void 0 : _b.toString()) || '';
            }
            else if (typeof cls === 'string' && cls.trim()) {
                rawId = cls.trim();
                if (!primaryClassName)
                    primaryClassName = rawId;
            }
            if (mongoose_1.default.Types.ObjectId.isValid(rawId)) {
                classIds.push(rawId);
            }
            else {
                const classDoc = yield class_model_1.Class.findOne({
                    className: { $regex: new RegExp(`^${rawId}$`, 'i') },
                }).session(session);
                if (classDoc) {
                    classIds.push(classDoc._id.toString());
                }
                else {
                    throw new Error(`Class "${rawId}" not found in the system. Please select a valid class.`);
                }
            }
        }
        const validClassIds = classIds.filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
        if (validClassIds.length > 0) {
            const classDoc = yield class_model_1.Class.findById(validClassIds[0]).session(session);
            primaryClassName = (classDoc === null || classDoc === void 0 ? void 0 : classDoc.className) || validClassIds[0];
            classNameForId = (classDoc === null || classDoc === void 0 ? void 0 : classDoc.className) || '';
        }
        if (!primaryClassName) {
            primaryClassName =
                payload.studentDepartment === 'hifz' ? 'Hifz' : 'Class One';
        }
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
        let studentDoc = null;
        let userDoc = null;
        let generatedStudentId = '';
        const findExistingStudent = () => __awaiter(void 0, void 0, void 0, function* () {
            if (payload.studentId && payload.studentId.trim() !== '') {
                const student = yield student_model_1.Student.findOne({
                    studentId: payload.studentId,
                }).session(session);
                if (student)
                    return student;
            }
            if (payload.mobileNo && payload.mobileNo.trim() !== '') {
                const student = yield student_model_1.Student.findOne({
                    mobile: payload.mobileNo,
                }).session(session);
                if (student)
                    return student;
            }
            if (payload.studentName && payload.birthDate && payload.fatherMobile) {
                const student = yield student_model_1.Student.findOne({
                    name: payload.studentName,
                    birthDate: payload.birthDate,
                    'parentInfo.father.mobile': payload.fatherMobile,
                }).session(session);
                if (student)
                    return student;
            }
            if (payload.studentName && payload.birthRegistrationNo) {
                const student = yield student_model_1.Student.findOne({
                    name: payload.studentName,
                    birthRegistrationNo: payload.birthRegistrationNo,
                }).session(session);
                if (student)
                    return student;
            }
            if (payload.email && payload.email.trim() !== '') {
                const student = yield student_model_1.Student.findOne({
                    email: payload.email,
                }).session(session);
                if (student)
                    return student;
            }
            return null;
        });
        studentDoc = yield findExistingStudent();
        // ==================== STUDENT CREATION OR UPDATE ====================
        if (!studentDoc) {
            generatedStudentId = yield (0, student_utils_1.generateStudentId)(classNameForId || primaryClassName);
            const email = payload.email ||
                `${(_c = payload.studentName) === null || _c === void 0 ? void 0 : _c.toLowerCase().replace(/\s+/g, '.')}${Date.now().toString().slice(-4)}@student.craft.edu` ||
                `student${Date.now().toString().slice(-6)}@craft.edu`;
            const defaultPassword = 'CIIStudent123';
            const existingUser = yield user_model_1.User.findOne({ email }).session(session);
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
                const [newUser] = yield user_model_1.User.create([userData], { session });
                userDoc = newUser;
            }
            else {
                userDoc = existingUser;
            }
            const studentMobile = payload.mobileNo || payload.fatherMobile || '';
            // Fixed: Properly structured student data with category field
            const studentData = {
                studentId: generatedStudentId,
                name: payload.studentName,
                nameBangla: payload.nameBangla,
                email,
                mobile: studentMobile,
                className: validClassIds.map((id) => new mongoose_1.default.Types.ObjectId(id)),
                studentDepartment: payload.studentDepartment,
                category: payload.category || 'Residential', // Fixed: category is properly set
                studentType: payload.category || 'Residential',
                advanceBalance: 0,
                presentAddress: payload.presentAddress || {},
                permanentAddress: payload.permanentAddress || {},
                user: userDoc ? [userDoc._id] : [],
                birthDate: payload.birthDate,
                birthRegistrationNo: payload.birthRegistrationNo,
                bloodGroup: payload.bloodGroup,
                gender: payload.gender,
                previousSchool: payload.previousSchool || {},
                documents: payload.documents || {},
                parentInfo,
                applicationId,
                academicYear: getCurrentAcademicYear(),
                age: payload.age,
                department: payload.department,
                class: primaryClassName,
                session: payload.session,
                nidBirth: payload.nidBirth,
                nationality: payload.nationality || 'Bangladeshi',
                academicInfo: payload.academicInfo || {},
                familyEnvironment: payload.familyEnvironment || {},
                behaviorSkills: payload.behaviorSkills || {},
                termsAccepted: payload.termsAccepted || false,
                admissionStatus: 'enrolled',
                status: 'active',
            };
            const [newStudent] = yield student_model_1.Student.create([studentData], { session });
            studentDoc = newStudent;
        }
        if (!userDoc && studentDoc.user && studentDoc.user.length > 0) {
            userDoc = yield user_model_1.User.findById(studentDoc.user[0]).session(session);
        }
        if (!userDoc) {
            throw new Error('Failed to create or find user for student');
        }
        // ----- ENROLLMENT DATA (Without fees & payment) -----
        const enrollmentData = {
            studentId: studentDoc.studentId,
            studentName: payload.studentName || '',
            nameBangla: payload.nameBangla || '',
            studentPhoto: payload.studentPhoto || '',
            mobileNo: payload.mobileNo || studentDoc.mobile || '',
            rollNumber: payload.rollNumber || '',
            className: validClassIds,
            section: payload.section || '',
            session: payload.session || new Date().getFullYear().toString(),
            batch: payload.group || '',
            studentType: payload.category || 'Residential',
            studentDepartment: payload.studentDepartment || 'hifz',
            presentAddress: payload.presentAddress || {},
            permanentAddress: payload.permanentAddress || {},
            documents: payload.documents || {},
            termsAccepted: payload.termsAccepted || false,
            birthDate: payload.birthDate,
            birthRegistrationNo: payload.birthRegistrationNo,
            bloodGroup: payload.bloodGroup,
            nationality: payload.nationality || 'Bangladeshi',
            roll: payload.rollNumber,
            previousSchool: payload.previousSchool || {},
            admissionType: 'admission',
            status: 'active',
            parentInfo,
            familyEnvironment: payload.familyEnvironment,
            behaviorSkills: payload.behaviorSkills,
            gender: payload.gender,
            student: studentDoc._id,
        };
        // ----- CREATE ENROLLMENT -----
        const [newEnrollment] = yield model_1.Enrollment.create([enrollmentData], {
            session,
        });
        // Update student with enrollment reference
        if (!studentDoc.enrollments) {
            studentDoc.enrollments = [];
        }
        studentDoc.enrollments.push(newEnrollment._id);
        yield studentDoc.save({ session });
        // ----- UPDATE ADMISSION APPLICATION IF EXISTS -----
        if (applicationId) {
            yield model_5.AdmissionApplication.findOneAndUpdate({ applicationId }, { status: 'enrolled' }, { new: true, session });
        }
        yield session.commitTransaction();
        session.endSession();
        // ----- POPULATE RESPONSE -----
        const populatedEnrollment = yield model_1.Enrollment.findById(newEnrollment._id)
            .populate({
            path: 'student',
            populate: [{ path: 'user' }],
        })
            .populate('className')
            .lean();
        const populatedStudent = yield student_model_1.Student.findById(studentDoc._id)
            .populate('user')
            .lean();
        return {
            success: true,
            message: 'Enrollment created successfully',
            data: {
                enrollment: populatedEnrollment,
                student: populatedStudent,
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
    }
    catch (error) {
        if (session.inTransaction())
            yield session.abortTransaction();
        session.endSession();
        console.error('Enrollment creation error:', error);
        return {
            success: false,
            message: error.message || 'Internal Server Error',
            error,
            data: null,
        };
    }
});
exports.createEnrollment = createEnrollment;
const updateEnrollment = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const existingEnrollment = yield model_1.Enrollment.findById(id)
            .populate('student')
            .session(session);
        if (!existingEnrollment)
            throw new Error('Enrollment not found');
        let studentDoc = yield student_model_1.Student.findById(existingEnrollment.student).session(session);
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
                existingEnrollment[field] = payload[field];
            }
        }
        if (payload.className) {
            if (Array.isArray(payload.className)) {
                const classIds = payload.className.filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
                existingEnrollment.className = classIds;
            }
            else if (mongoose_1.default.Types.ObjectId.isValid(payload.className)) {
                existingEnrollment.className = [payload.className];
            }
        }
        if (payload.presentAddress)
            existingEnrollment.presentAddress = payload.presentAddress;
        if (payload.permanentAddress)
            existingEnrollment.permanentAddress = payload.permanentAddress;
        if (payload.documents)
            existingEnrollment.documents = payload.documents;
        if (payload.parentInfo)
            existingEnrollment.parentInfo = payload.parentInfo;
        if (payload.familyEnvironment)
            existingEnrollment.familyEnvironment = payload.familyEnvironment;
        if (payload.behaviorSkills)
            existingEnrollment.behaviorSkills = payload.behaviorSkills;
        if (payload.termsAccepted !== undefined)
            existingEnrollment.termsAccepted = payload.termsAccepted;
        if (payload.studentDepartment)
            existingEnrollment.studentDepartment = payload.studentDepartment;
        if (payload.status)
            existingEnrollment.status = payload.status;
        yield existingEnrollment.save({ session });
        // ── 2. Update Student document ────────────────────────────────────────────
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
                const payloadField = field === 'mobile'
                    ? 'mobileNo'
                    : field === 'name'
                        ? 'studentName'
                        : field;
                if (payload[payloadField] !== undefined) {
                    studentDoc[field] = payload[payloadField];
                }
            }
            if (payload.className) {
                if (Array.isArray(payload.className)) {
                    studentDoc.className = payload.className
                        .filter((id) => mongoose_1.default.Types.ObjectId.isValid(id))
                        .map((id) => new mongoose_1.default.Types.ObjectId(id));
                }
                else if (mongoose_1.default.Types.ObjectId.isValid(payload.className)) {
                    studentDoc.className = [
                        new mongoose_1.default.Types.ObjectId(payload.className),
                    ];
                }
            }
            yield studentDoc.save({ session });
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
            const classDoc = yield class_model_1.Class.findById(classId).session(session);
            primaryClassName = (classDoc === null || classDoc === void 0 ? void 0 : classDoc.className) || 'Class';
        }
        const isUpdatingFees = payload.fees !== undefined &&
            Array.isArray(payload.fees) &&
            payload.fees.length > 0;
        if (isUpdatingFees) {
            // ── 3.1 Get ALL existing fees and separate paid vs unpaid ─────────────
            const existingFees = yield model_2.Fees.find({
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
            // Build a set of paid fee keys so we know what's already covered
            // Key format: "BaseFeeType_Month" for monthly, "BaseFeeType" for one-time
            const paidFeeKeySet = new Set();
            const paidAmountByKey = new Map();
            for (const pf of paidFees) {
                let baseFeeType = pf.feeType || '';
                let month = null;
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
                paidAmountByKey.set(key, (paidAmountByKey.get(key) || 0) + (pf.paidAmount || 0));
            }
            // ── 3.2 Build new fee items list from payload ─────────────────────────
            const allNewFeeItems = [];
            for (const feeCategory of payload.fees) {
                let feeItems = feeCategory.feeItems || feeCategory.items || [];
                if (feeItems.length === 0)
                    continue;
                let feeClassName = primaryClassName;
                if (feeCategory.className && feeCategory.className.length > 0) {
                    feeClassName =
                        typeof feeCategory.className[0] === 'object'
                            ? ((_a = feeCategory.className[0]) === null || _a === void 0 ? void 0 : _a.label) || primaryClassName
                            : feeCategory.className[0] || primaryClassName;
                }
                for (const feeItem of feeItems) {
                    if (feeItem.isSelected === false)
                        continue;
                    let feeTypeStr = '';
                    if (typeof feeItem.feeType === 'string')
                        feeTypeStr = feeItem.feeType;
                    else if ((_b = feeItem.feeType) === null || _b === void 0 ? void 0 : _b.label)
                        feeTypeStr = feeItem.feeType.label;
                    else if ((_c = feeItem.feeType) === null || _c === void 0 ? void 0 : _c.value)
                        feeTypeStr = feeItem.feeType.value;
                    if (!(feeTypeStr === null || feeTypeStr === void 0 ? void 0 : feeTypeStr.trim()))
                        continue;
                    const amount = Number(feeItem.amount) || 0;
                    const discount = Number(feeItem.discount) || 0;
                    if (amount <= 0)
                        continue;
                    const isMonthly = feeItem.isMonthly === true ||
                        feeTypeStr.toLowerCase().includes('monthly');
                    if (isMonthly) {
                        const discountRangeStart = feeItem.discountRangeStart || '';
                        const discountRangeEnd = feeItem.discountRangeEnd || '';
                        const discountRangeAmount = Number(feeItem.discountRangeAmount) || 0;
                        const startIdx = MONTHS.indexOf(discountRangeStart);
                        const endIdx = MONTHS.indexOf(discountRangeEnd);
                        const hasValidRange = discountRangeStart &&
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
                                    let pfBaseFeeType = pf.feeType || '';
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
                                        throw new Error(`Cannot update fee "${feeTypeStr} - ${month}": ৳${paidAmountValue} has already been paid. New amount (৳${netAmount}) cannot be less than paid amount.`);
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
                    }
                    else {
                        // One-time fee
                        const key = feeTypeStr;
                        const netAmount = Math.max(0, amount - discount);
                        const isAlreadyPaid = paidFeeKeySet.has(key);
                        if (isAlreadyPaid) {
                            const existingPaidFee = paidFees.find((pf) => pf.feeType === feeTypeStr);
                            if (existingPaidFee) {
                                const paidAmountValue = existingPaidFee.paidAmount || 0;
                                if (netAmount < paidAmountValue) {
                                    throw new Error(`Cannot update fee "${feeTypeStr}": ৳${paidAmountValue} has already been paid. New amount (৳${netAmount}) cannot be less than paid amount.`);
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
                if (a.month === 'Admission' && b.month !== 'Admission')
                    return -1;
                if (a.month !== 'Admission' && b.month === 'Admission')
                    return 1;
                return MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month);
            });
            // ── 3.3 Delete ONLY the unpaid (unlocked) old fees ───────────────────
            if (unpaidFeeIds.length > 0) {
                // Get payments linked ONLY to unpaid fees
                const linkedPayments = yield model_3.Payment.find({
                    fees: { $in: unpaidFeeIds },
                }).session(session);
                // Only delete payments that exclusively reference unpaid fees (safety check)
                const paymentIdsToDelete = [];
                for (const payment of linkedPayments) {
                    const paymentFeeIds = (payment.fees || []).map((f) => f.toString());
                    const hasPaidFee = paymentFeeIds.some((fid) => paidFeeIds.some((pid) => pid.toString() === fid));
                    if (!hasPaidFee) {
                        paymentIdsToDelete.push(payment._id);
                    }
                }
                if (paymentIdsToDelete.length > 0) {
                    yield model_4.Receipt.deleteMany({
                        paymentId: { $in: paymentIdsToDelete },
                    }).session(session);
                    yield model_3.Payment.deleteMany({
                        _id: { $in: paymentIdsToDelete },
                    }).session(session);
                }
                // Remove unpaid fee references from student
                if (studentDoc) {
                    const unpaidFeeIdStrings = unpaidFeeIds.map((id) => id.toString());
                    studentDoc.fees = (studentDoc.fees || []).filter((feeId) => !unpaidFeeIdStrings.includes(feeId.toString()));
                    if (paymentIdsToDelete.length > 0) {
                        const delPaymentStrings = paymentIdsToDelete.map((id) => id.toString());
                        studentDoc.payments = (studentDoc.payments || []).filter((pid) => !delPaymentStrings.includes(pid.toString()));
                    }
                    yield studentDoc.save({ session });
                }
                // Delete only unpaid fees
                yield model_2.Fees.deleteMany({
                    _id: { $in: unpaidFeeIds },
                    enrollment: existingEnrollment._id,
                }).session(session);
            }
            // ── 3.4 Create new fee documents for the non-paid items ──────────────
            const newFeeIds = [];
            let totalNewPaid = 0;
            let totalNewDue = 0;
            let remainingNewPayment = payload.paidAmount !== undefined
                ? Math.max(0, Number(payload.paidAmount) -
                    paidFees.reduce((s, f) => s + (f.paidAmount || 0), 0))
                : 0;
            for (const item of allNewFeeItems) {
                let paidForThisItem = 0;
                const isPriority = item.month === 'Admission' || item.month === currentMonthName;
                if (remainingNewPayment > 0 && isPriority) {
                    const canPay = Math.min(remainingNewPayment, item.netAmount);
                    paidForThisItem = canPay;
                    remainingNewPayment -= canPay;
                }
                const dueAmount = Math.max(0, item.netAmount - paidForThisItem);
                totalNewPaid += paidForThisItem;
                totalNewDue += dueAmount;
                const status = dueAmount <= 0 && item.netAmount > 0
                    ? 'paid'
                    : paidForThisItem > 0
                        ? 'partial'
                        : 'unpaid';
                const feeData = {
                    enrollment: existingEnrollment._id,
                    student: existingEnrollment.student,
                    studentId: existingEnrollment.studentId || (studentDoc === null || studentDoc === void 0 ? void 0 : studentDoc.studentId) || '',
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
                const [createdFee] = yield model_2.Fees.create([feeData], { session });
                newFeeIds.push(createdFee._id);
            }
            // ── 3.5 Calculate totals including locked paid fees ───────────────────
            const paidFeeTotal = paidFees.reduce((s, f) => s + (f.paidAmount || 0), 0);
            const paidFeeDue = paidFees.reduce((s, f) => s + (f.dueAmount || 0), 0);
            const allFeeIds = [...paidFeeIds, ...newFeeIds];
            const totalPaidFinal = paidFeeTotal + totalNewPaid;
            const totalDueFinal = paidFeeDue + totalNewDue;
            // Recalculate total & discount from all fees (paid + new)
            const allFeeDocs = yield model_2.Fees.find({ _id: { $in: allFeeIds } })
                .session(session)
                .lean();
            const totalAmount = allFeeDocs.reduce((s, f) => s + (f.amount || 0), 0);
            const totalDiscount = allFeeDocs.reduce((s, f) => s + (f.discount || 0), 0);
            // ── 3.6 Update enrollment with merged fee data ────────────────────────
            existingEnrollment.fees = allFeeIds;
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
            yield existingEnrollment.save({ session });
            // ── 3.7 Update student with new fees ─────────────────────────────────
            if (studentDoc) {
                studentDoc.fees = [...(studentDoc.fees || []), ...newFeeIds];
                yield studentDoc.save({ session });
            }
            // ── 3.8 Create payment/receipt ONLY for new paid amounts ─────────────
            // Find all new fees with paidAmount > 0
            const newPaidFeeDocs = yield model_2.Fees.find({
                _id: { $in: newFeeIds },
                paidAmount: { $gt: 0 },
            })
                .session(session)
                .lean();
            if (newPaidFeeDocs.length > 0) {
                const newPaidTotal = newPaidFeeDocs.reduce((s, f) => s + (f.paidAmount || 0), 0);
                const timestamp = Date.now();
                const random = Math.floor(Math.random() * 10000);
                const receiptNo = `RCP-${timestamp}-${random}`;
                const transactionId = `TXN-${timestamp}`;
                const [payment] = yield model_3.Payment.create([
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
                ], { session });
                const receiptFees = newPaidFeeDocs.map((fee) => {
                    var _a;
                    let month = fee.month || 'Admission';
                    if ((_a = fee.feeType) === null || _a === void 0 ? void 0 : _a.includes(' - ')) {
                        const last = fee.feeType.split(' - ').pop();
                        if (MONTHS.includes(last))
                            month = last;
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
                const [receipt] = yield model_4.Receipt.create([
                    {
                        receiptNo,
                        student: existingEnrollment.student,
                        studentName: payload.studentName || existingEnrollment.studentName || '',
                        studentId: existingEnrollment.studentId || (studentDoc === null || studentDoc === void 0 ? void 0 : studentDoc.studentId) || '',
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
                            totalNetAmount: receiptFees.reduce((s, f) => s + f.netAmount, 0),
                            amountPaid: newPaidTotal,
                        },
                        status: 'active',
                    },
                ], { session });
                if (studentDoc) {
                    studentDoc.payments = [...(studentDoc.payments || []), payment._id];
                    studentDoc.receipts = [...(studentDoc.receipts || []), receipt._id];
                    yield studentDoc.save({ session });
                }
                existingEnrollment.payment = payment._id;
                yield existingEnrollment.save({ session });
            }
        }
        else if (payload.totalAmount !== undefined ||
            payload.paidAmount !== undefined) {
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
            yield existingEnrollment.save({ session });
        }
        yield session.commitTransaction();
        session.endSession();
        const updatedEnrollment = yield model_1.Enrollment.findById(id)
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
    }
    catch (error) {
        if (session.inTransaction())
            yield session.abortTransaction();
        session.endSession();
        console.error('=== updateEnrollment ERROR ===', error.message);
        return {
            success: false,
            message: error.message || 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            data: null,
        };
    }
});
exports.updateEnrollment = updateEnrollment;
const deleteEnrollment = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const existing = yield model_1.Enrollment.findById(id).session(session);
        if (!existing) {
            throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Enrollment not found');
        }
        yield model_2.Fees.deleteMany({ enrollment: id }).session(session);
        yield model_1.Enrollment.findByIdAndDelete(id).session(session);
        yield session.commitTransaction();
        session.endSession();
        return {
            success: true,
            message: 'Enrollment and associated fees deleted successfully',
        };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Failed to delete');
    }
});
exports.deleteEnrollment = deleteEnrollment;
const promoteEnrollment = (studentId, newClassId, rollNumber, section) => __awaiter(void 0, void 0, void 0, function* () {
    const sessionTransaction = yield mongoose_1.default.startSession();
    sessionTransaction.startTransaction();
    try {
        const student = yield student_model_1.Student.findById(studentId).session(sessionTransaction);
        if (!student) {
            throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Student not found');
        }
        // 2. Find the CURRENT ACTIVE enrollment
        const currentEnrollment = yield model_1.Enrollment.findOne({
            student: studentId,
            status: 'active',
        })
            .sort({ createdAt: -1 })
            .populate('className')
            .session(sessionTransaction);
        if (!currentEnrollment) {
            throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'No active enrollment found for this student');
        }
        // 3. Validate Target Class
        const newClass = yield class_model_1.Class.findById(newClassId).session(sessionTransaction);
        if (!newClass) {
            throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Target class not found');
        }
        // 4. Prevent duplicate promotion
        const alreadyEnrolledInClass = yield model_1.Enrollment.findOne({
            student: studentId,
            className: newClassId,
            status: 'active',
        }).session(sessionTransaction);
        if (alreadyEnrolledInClass) {
            throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Student is already active in this class');
        }
        const currentYear = new Date().getFullYear();
        // ----- Build parentInfo for new enrollment -----
        // Prefer student.parentInfo; if not available, try currentEnrollment.parentInfo;
        // finally fall back to constructing from flat fields (backward compatibility).
        let parentInfo = student.parentInfo || currentEnrollment.parentInfo;
        if (!parentInfo) {
            // Build from flat fields (if present)
            parentInfo = {
                father: {
                    nameBangla: student.fatherNameBangla || '',
                    nameEnglish: student.fatherName || '',
                    profession: student.fatherProfession || '',
                    education: '',
                    mobile: student.fatherMobile || '',
                    whatsapp: '',
                    nid: student.fatherNid || '',
                    income: student.fatherIncome || 0,
                },
                mother: {
                    nameBangla: student.motherNameBangla || '',
                    nameEnglish: student.motherName || '',
                    profession: student.motherProfession || '',
                    education: '',
                    mobile: student.motherMobile || '',
                    whatsapp: '',
                    nid: student.motherNid || '',
                    income: student.motherIncome || 0,
                },
                guardian: {
                    nameBangla: student.guardianNameBangla || '',
                    nameEnglish: student.guardianName || '',
                    relation: student.guardianRelation || '',
                    mobile: student.guardianMobile || '',
                    whatsapp: '',
                    profession: '',
                    address: student.guardianVillage || '',
                },
            };
        }
        // 5. Prepare Data for New Enrollment
        const newEnrollmentData = {
            student: new mongoose_1.Types.ObjectId(studentId),
            studentId: student.studentId || '',
            studentName: student.name || '',
            nameBangla: student.nameBangla || '',
            mobileNo: student.mobile || currentEnrollment.mobileNo || '',
            rollNumber: rollNumber ||
                (currentEnrollment.rollNumber
                    ? String(Number(currentEnrollment.rollNumber) + 1)
                    : '1'),
            gender: student.gender || currentEnrollment.gender || '',
            birthDate: student.birthDate || currentEnrollment.birthDate || '',
            birthRegistrationNo: student.birthRegistrationNo ||
                currentEnrollment.birthRegistrationNo ||
                '',
            bloodGroup: student.bloodGroup || currentEnrollment.bloodGroup || '',
            nationality: student.nationality || currentEnrollment.nationality || 'Bangladesh',
            studentDepartment: currentEnrollment.studentDepartment || 'hifz',
            className: [new mongoose_1.Types.ObjectId(newClassId)],
            section: section || currentEnrollment.section || '',
            roll: rollNumber ||
                (currentEnrollment.roll
                    ? String(Number(currentEnrollment.roll) + 1)
                    : '1'),
            session: currentYear.toString(),
            batch: currentEnrollment.batch || '',
            studentType: currentEnrollment.studentType || '',
            // New parentInfo structure
            parentInfo,
            presentAddress: currentEnrollment.presentAddress || student.presentAddress || {},
            permanentAddress: currentEnrollment.permanentAddress || student.permanentAddress || {},
            documents: currentEnrollment.documents || student.documents || {},
            previousSchool: currentEnrollment.previousSchool || student.previousSchool || {},
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
        const [newEnrollment] = yield model_1.Enrollment.create([newEnrollmentData], {
            session: sessionTransaction,
        });
        // 7. Update OLD Enrollment to 'passed'
        currentEnrollment.promotedTo = newEnrollment._id;
        currentEnrollment.status = 'passed';
        yield currentEnrollment.save({ session: sessionTransaction });
        // 8. Update Student's Current Class
        student.className = [new mongoose_1.Types.ObjectId(newClassId)];
        yield student.save({ session: sessionTransaction });
        // 9. Generate Fees based on NEW Class
        const feeDocs = [];
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
                        const monthFeeData = {
                            enrollment: newEnrollment._id,
                            student: new mongoose_1.Types.ObjectId(studentId),
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
                        const [monthlyFee] = yield model_2.Fees.create([monthFeeData], {
                            session: sessionTransaction,
                        });
                        feeDocs.push(monthlyFee._id);
                    }
                }
                else if (amount > 0) {
                    const feeData = {
                        enrollment: newEnrollment._id,
                        student: new mongoose_1.Types.ObjectId(studentId),
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
                    const [newFee] = yield model_2.Fees.create([feeData], {
                        session: sessionTransaction,
                    });
                    feeDocs.push(newFee._id);
                }
            }
            if (feeDocs.length > 0) {
                newEnrollment.fees = feeDocs;
                yield newEnrollment.save({ session: sessionTransaction });
                const existingStudentFees = student.fees
                    ? student.fees.map((id) => id.toString())
                    : [];
                const newFeeIds = feeDocs
                    .map((id) => id.toString())
                    .filter((id) => !existingStudentFees.includes(id));
                if (newFeeIds.length > 0) {
                    const allFeeIds = [...existingStudentFees, ...newFeeIds];
                    student.fees = allFeeIds.map((id) => new mongoose_1.Types.ObjectId(id));
                    yield student.save({ session: sessionTransaction });
                }
            }
        }
        yield sessionTransaction.commitTransaction();
        sessionTransaction.endSession();
        const populatedEnrollment = yield model_1.Enrollment.findById(newEnrollment._id)
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
    }
    catch (error) {
        yield sessionTransaction.abortTransaction();
        sessionTransaction.endSession();
        console.error('Promotion error:', error);
        throw new AppError_1.AppError(http_status_1.default.INTERNAL_SERVER_ERROR, error.message || 'Failed to promote student');
    }
});
const bulkPromoteEnrollments = (promotions) => __awaiter(void 0, void 0, void 0, function* () {
    const sessionTransaction = yield mongoose_1.default.startSession();
    sessionTransaction.startTransaction();
    try {
        const results = [];
        const errors = [];
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
                const student = yield student_model_1.Student.findById(studentId).session(sessionTransaction);
                if (!student) {
                    errors.push({ studentId, error: 'Student not found' });
                    continue;
                }
                // 3. Find Current Active Enrollment (No Session Check)
                const currentEnrollment = yield model_1.Enrollment.findOne({
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
                const newClass = yield class_model_1.Class.findById(newClassId).session(sessionTransaction);
                if (!newClass) {
                    errors.push({ studentId, error: 'New class not found' });
                    continue;
                }
                // 5. Check if already enrolled
                const alreadyEnrolled = yield model_1.Enrollment.findOne({
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
                const newEnrollmentData = {
                    student: new mongoose_1.Types.ObjectId(studentId),
                    studentId: student.studentId || '',
                    studentName: student.name || '',
                    className: [new mongoose_1.Types.ObjectId(newClassId)],
                    section: section || currentEnrollment.section || '',
                    roll: rollNumber ||
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
                const [newEnrollment] = yield model_1.Enrollment.create([newEnrollmentData], {
                    session: sessionTransaction,
                });
                currentEnrollment.promotedTo = newEnrollment._id;
                currentEnrollment.status = 'passed';
                yield currentEnrollment.save({ session: sessionTransaction });
                student.className = [new mongoose_1.Types.ObjectId(newClassId)];
                yield student.save({ session: sessionTransaction });
                results.push({
                    studentId,
                    studentName: student.name,
                    oldClass: currentEnrollment.className,
                    newClassId: newClassId,
                    newEnrollmentId: newEnrollment._id,
                });
            }
            catch (error) {
                errors.push({
                    studentId: promotion.studentId,
                    error: error.message,
                });
            }
        }
        yield sessionTransaction.commitTransaction();
        sessionTransaction.endSession();
        return {
            success: true,
            message: `Bulk promotion completed. Success: ${results.length}, Failed: ${errors.length}`,
            data: { results, errors },
        };
    }
    catch (error) {
        yield sessionTransaction.abortTransaction();
        sessionTransaction.endSession();
        throw error;
    }
});
const getPromotionHistory = (studentId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(studentId)) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Invalid student ID');
    }
    const student = yield student_model_1.Student.findById(studentId);
    if (!student) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Student not found');
    }
    const enrollments = yield model_1.Enrollment.find({ student: studentId })
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
        .select('className status admissionType createdAt roll promotedFrom promotedTo');
    const history = enrollments.map((enrollment) => {
        var _a, _b, _c, _d, _e, _f;
        return ({
            enrollmentId: enrollment._id,
            className: ((_b = (_a = enrollment.className) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.className) || 'N/A',
            status: enrollment.status,
            admissionType: enrollment.admissionType,
            roll: enrollment.roll,
            createdAt: enrollment.createdAt,
            promotedFrom: enrollment.promotedFrom
                ? {
                    enrollmentId: enrollment.promotedFrom._id,
                    className: ((_d = (_c = enrollment.promotedFrom.className) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.className) || 'N/A',
                    roll: enrollment.promotedFrom.roll,
                    status: enrollment.promotedFrom.status,
                    admissionType: enrollment.promotedFrom.admissionType,
                }
                : null,
            promotedTo: enrollment.promotedTo
                ? {
                    enrollmentId: enrollment.promotedTo._id,
                    className: ((_f = (_e = enrollment.promotedTo.className) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.className) || 'N/A',
                    roll: enrollment.promotedTo.roll,
                    status: enrollment.promotedTo.status,
                    admissionType: enrollment.promotedTo.admissionType,
                }
                : null,
        });
    });
    return {
        success: true,
        message: 'Promotion history retrieved successfully',
        data: {
            studentName: student.name,
            studentId: student.studentId,
            history: history,
        },
    };
});
const getPromotionEligibleStudents = (classId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(classId)) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Invalid Class ID');
    }
    const classExists = yield class_model_1.Class.findById(classId);
    if (!classExists) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Class not found');
    }
    const eligibleEnrollments = yield model_1.Enrollment.find({
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
    const formattedStudents = eligibleEnrollments.map((enrollment) => {
        var _a, _b, _c, _d, _e, _f, _g;
        return ({
            enrollmentId: enrollment === null || enrollment === void 0 ? void 0 : enrollment._id,
            studentId: (_a = enrollment === null || enrollment === void 0 ? void 0 : enrollment.student) === null || _a === void 0 ? void 0 : _a._id,
            studentIdentifier: (_b = enrollment === null || enrollment === void 0 ? void 0 : enrollment.student) === null || _b === void 0 ? void 0 : _b.studentId,
            studentName: (_c = enrollment === null || enrollment === void 0 ? void 0 : enrollment.student) === null || _c === void 0 ? void 0 : _c.name,
            currentClass: ((_e = (_d = enrollment === null || enrollment === void 0 ? void 0 : enrollment.className) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.className) || 'N/A',
            currentRoll: enrollment === null || enrollment === void 0 ? void 0 : enrollment.roll,
            section: enrollment === null || enrollment === void 0 ? void 0 : enrollment.section,
            fatherName: (_f = enrollment === null || enrollment === void 0 ? void 0 : enrollment.student) === null || _f === void 0 ? void 0 : _f.fatherName,
            mobile: (_g = enrollment === null || enrollment === void 0 ? void 0 : enrollment.student) === null || _g === void 0 ? void 0 : _g.mobile,
        });
    });
    return {
        success: true,
        message: 'Eligible students retrieved successfully',
        data: {
            sourceClass: classExists.className,
            students: formattedStudents,
        },
    };
});
const bulkRetainEnrollments = (promotions) => __awaiter(void 0, void 0, void 0, function* () {
    const sessionTransaction = yield mongoose_1.default.startSession();
    sessionTransaction.startTransaction();
    try {
        const results = [];
        const errors = [];
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
                const student = yield student_model_1.Student.findById(studentId).session(sessionTransaction);
                if (!student) {
                    errors.push({ studentId, error: 'Student not found' });
                    continue;
                }
                // Find current active enrollment
                const currentEnrollment = yield model_1.Enrollment.findOne({
                    student: studentId,
                    status: 'active',
                })
                    .sort({ createdAt: -1 })
                    .session(sessionTransaction);
                if (!currentEnrollment) {
                    errors.push({ studentId, error: 'No active enrollment found' });
                    continue;
                }
                const currentClassId = currentEnrollment.className[0];
                const currentClass = yield class_model_1.Class.findById(currentClassId).session(sessionTransaction);
                if (!currentClass) {
                    errors.push({ studentId, error: 'Current class data not found' });
                    continue;
                }
                const currentYear = new Date().getFullYear();
                // ----- Build parentInfo for new enrollment -----
                let parentInfo = student.parentInfo || currentEnrollment.parentInfo;
                if (!parentInfo) {
                    // Fallback: construct from flat fields (if present)
                    parentInfo = {
                        father: {
                            nameBangla: student.fatherNameBangla || '',
                            nameEnglish: student.fatherName || '',
                            profession: student.fatherProfession || '',
                            education: '',
                            mobile: student.fatherMobile || '',
                            whatsapp: '',
                            nid: student.fatherNid || '',
                            income: student.fatherIncome || 0,
                        },
                        mother: {
                            nameBangla: student.motherNameBangla || '',
                            nameEnglish: student.motherName || '',
                            profession: student.motherProfession || '',
                            education: '',
                            mobile: student.motherMobile || '',
                            whatsapp: '',
                            nid: student.motherNid || '',
                            income: student.motherIncome || 0,
                        },
                        guardian: {
                            nameBangla: student.guardianNameBangla || '',
                            nameEnglish: student.guardianName || '',
                            relation: student.guardianRelation || '',
                            mobile: student.guardianMobile || '',
                            whatsapp: '',
                            profession: '',
                            address: student.guardianVillage || '',
                        },
                    };
                }
                // Prepare new enrollment data with parentInfo and all required fields
                const newEnrollmentData = {
                    student: new mongoose_1.Types.ObjectId(studentId),
                    studentId: student.studentId || '',
                    studentName: student.name || '',
                    nameBangla: student.nameBangla || '',
                    mobileNo: student.mobile || currentEnrollment.mobileNo || '',
                    rollNumber: rollNumber ||
                        (currentEnrollment.rollNumber
                            ? String(Number(currentEnrollment.rollNumber) + 1)
                            : '1'),
                    gender: student.gender || currentEnrollment.gender || '',
                    birthDate: student.birthDate || currentEnrollment.birthDate || '',
                    birthRegistrationNo: student.birthRegistrationNo ||
                        currentEnrollment.birthRegistrationNo ||
                        '',
                    bloodGroup: student.bloodGroup || currentEnrollment.bloodGroup || '',
                    nationality: student.nationality ||
                        currentEnrollment.nationality ||
                        'Bangladesh',
                    studentDepartment: currentEnrollment.studentDepartment || 'hifz',
                    className: [new mongoose_1.Types.ObjectId(currentClassId)],
                    section: section || currentEnrollment.section || '',
                    roll: rollNumber ||
                        (currentEnrollment.roll
                            ? String(Number(currentEnrollment.roll) + 1)
                            : '1'),
                    session: currentYear.toString(),
                    batch: currentEnrollment.batch || '',
                    studentType: currentEnrollment.studentType || '',
                    // New parent structure
                    parentInfo,
                    presentAddress: currentEnrollment.presentAddress || student.presentAddress || {},
                    permanentAddress: currentEnrollment.permanentAddress ||
                        student.permanentAddress ||
                        {},
                    documents: currentEnrollment.documents || student.documents || {},
                    previousSchool: currentEnrollment.previousSchool || student.previousSchool || {},
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
                const [newEnrollment] = yield model_1.Enrollment.create([newEnrollmentData], {
                    session: sessionTransaction,
                });
                // Update old enrollment
                currentEnrollment.promotedTo = newEnrollment._id;
                currentEnrollment.status = 'failed';
                yield currentEnrollment.save({ session: sessionTransaction });
                // Update student's current class
                student.className = [new mongoose_1.Types.ObjectId(currentClassId)];
                yield student.save({ session: sessionTransaction });
                // Generate fees (same logic as before)
                const feeDocs = [];
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
                if (currentClass.feeStructure &&
                    Array.isArray(currentClass.feeStructure)) {
                    for (const feeStructure of currentClass.feeStructure) {
                        const feeType = feeStructure.feeType || '';
                        const amount = feeStructure.amount || 0;
                        const isMonthly = feeStructure.isMonthly || false;
                        if (isMonthly && amount > 0) {
                            for (let i = 0; i < 12; i++) {
                                const isCurrentMonth = i === currentMonthIndex;
                                const monthName = monthNames[i];
                                const monthKey = `${monthName}-${currentYear}`;
                                const monthFeeData = {
                                    enrollment: newEnrollment._id,
                                    student: new mongoose_1.Types.ObjectId(studentId),
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
                                const [monthlyFee] = yield model_2.Fees.create([monthFeeData], {
                                    session: sessionTransaction,
                                });
                                feeDocs.push(monthlyFee._id);
                            }
                        }
                        else if (amount > 0) {
                            const feeData = {
                                enrollment: newEnrollment._id,
                                student: new mongoose_1.Types.ObjectId(studentId),
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
                            const [newFee] = yield model_2.Fees.create([feeData], {
                                session: sessionTransaction,
                            });
                            feeDocs.push(newFee._id);
                        }
                    }
                    if (feeDocs.length > 0) {
                        newEnrollment.fees = feeDocs;
                        yield newEnrollment.save({ session: sessionTransaction });
                        const existingStudentFees = student.fees
                            ? student.fees.map((id) => id.toString())
                            : [];
                        const newFeeIds = feeDocs
                            .map((id) => id.toString())
                            .filter((id) => !existingStudentFees.includes(id));
                        if (newFeeIds.length > 0) {
                            const allFeeIds = [...existingStudentFees, ...newFeeIds];
                            student.fees = allFeeIds.map((id) => new mongoose_1.Types.ObjectId(id));
                            yield student.save({ session: sessionTransaction });
                        }
                    }
                }
                results.push({
                    studentId,
                    studentName: student.name,
                    status: 'retained',
                    newEnrollmentId: newEnrollment._id,
                });
            }
            catch (error) {
                errors.push({
                    studentId: promotion.studentId,
                    error: error.message,
                });
            }
        }
        yield sessionTransaction.commitTransaction();
        sessionTransaction.endSession();
        return {
            success: true,
            message: `Bulk retention completed. Success: ${results.length}, Failed: ${errors.length}`,
            data: { results, errors },
        };
    }
    catch (error) {
        yield sessionTransaction.abortTransaction();
        sessionTransaction.endSession();
        throw error;
    }
});
exports.enrollmentServices = {
    createEnrollment: exports.createEnrollment,
    promoteEnrollment,
    bulkPromoteEnrollments,
    getAllEnrollments,
    getSingleEnrollment,
    updateEnrollment: exports.updateEnrollment,
    deleteEnrollment: exports.deleteEnrollment,
    getPromotionHistory,
    getPromotionEligibleStudents,
    bulkRetainEnrollments,
};
