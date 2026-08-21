"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Teacher = void 0;
const mongoose_1 = require("mongoose");
// Address schema structure that matches both permanent and present address forms
const addressSchema = new mongoose_1.Schema({
    address: String,
    village: String,
    postOffice: String,
    thana: String,
    district: String,
    state: String,
    country: String,
    zipCode: String,
}, { _id: false });
// Education qualification schema
const educationSchema = new mongoose_1.Schema({
    degree: String,
    institution: String,
    year: String,
    specialization: String,
}, { _id: false });
// Certification schema
const certificationSchema = new mongoose_1.Schema({
    certificateName: String,
    issuedBy: String,
    year: String,
    description: String,
}, { _id: false });
// Work experience schema
const experienceSchema = new mongoose_1.Schema({
    organization: String,
    position: String,
    from: String,
    to: String,
    description: String,
}, { _id: false });
const teacherSchema = new mongoose_1.Schema({
    // Basic Information (Step 1)
    teacherId: {
        type: String,
    },
    teacherSerial: {
        type: Number,
    },
    smartIdCard: {
        type: String,
    },
    teacherDepartment: {
        type: String,
    },
    name: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
    },
    email: {
        type: String,
        required: true,
    },
    dateOfBirth: {
        type: Date,
    },
    bloodGroup: {
        type: String,
    },
    gender: {
        type: String,
    },
    nationality: {
        type: String,
    },
    religion: {
        type: String,
    },
    maritalStatus: {
        type: String,
    },
    teacherPhoto: {
        type: String,
    },
    resumeDoc: {
        type: String,
    },
    certificateDoc: {
        type: String,
    },
    nationalIdDoc: {
        type: String,
    },
    category: {
        type: String,
    },
    permanentAddress: {
        type: addressSchema,
        required: true,
    },
    currentAddress: {
        type: addressSchema,
    },
    sameAsPermanent: {
        type: Boolean,
        default: false,
    },
    designation: {
        type: String,
    },
    department: {
        type: String,
    },
    joiningDate: {
        type: Date,
    },
    monthlySalary: {
        type: Number,
    },
    staffType: {
        type: String,
        // enum: ['Teacher', 'Staff', 'Other'],
        // default:'Teacher'
    },
    // Educational Information (Step 4)
    educationalQualifications: {
        type: [educationSchema],
    },
    certifications: {
        type: [certificationSchema],
    },
    workExperience: {
        type: [experienceSchema],
    },
    // Additional Information (Step 5)
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
    },
    language: {
        type: String,
        // enum: ['Bangla', 'English', 'Other'],
        // default: 'Bangla',
    },
    activeSession: {
        type: String,
    },
    section: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Section',
    },
    class: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Class',
    },
    schedule: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Schedule',
    },
    assignment: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Assignment',
    },
    attendance: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Attendance',
    },
    room: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Room',
    },
    mealAttendances: {
        type: [{ type: mongoose_1.Types.ObjectId, ref: 'MealAttendance' }],
        // select: false,
    },
}, {
    timestamps: true,
});
exports.Teacher = (0, mongoose_1.model)('Teacher', teacherSchema);
