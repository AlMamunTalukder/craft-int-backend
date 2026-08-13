"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Staff = void 0;
const mongoose_1 = require("mongoose");
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
const educationSchema = new mongoose_1.Schema({
    degree: String,
    institution: String,
    year: String,
    specialization: String,
}, { _id: false });
const certificationSchema = new mongoose_1.Schema({
    certificateName: String,
    issuedBy: String,
    year: String,
    description: String,
}, { _id: false });
const experienceSchema = new mongoose_1.Schema({
    organization: String,
    position: String,
    from: String,
    to: String,
    description: String,
}, { _id: false });
const staffSchema = new mongoose_1.Schema({
    staffId: {
        type: String,
    },
    staffSerial: {
        type: Number,
    },
    smartIdCard: {
        type: String,
    },
    staffDepartment: {
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
    staffPhoto: {
        type: String,
    },
    resumeDoc: {
        type: String,
    },
    category: {
        type: String,
    },
    certificateDoc: {
        type: String,
    },
    nationalIdDoc: {
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
    department: {
        type: String,
    },
    joiningDate: {
        type: Date,
    },
    monthlySalary: {
        type: Number,
    },
    educationalQualifications: {
        type: [educationSchema],
    },
    certifications: {
        type: [certificationSchema],
    },
    workExperience: {
        type: [experienceSchema],
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
    },
    mealAttendances: {
        type: [{ type: mongoose_1.Types.ObjectId, ref: 'MealAttendance' }],
    },
}, {
    timestamps: true,
});
exports.Staff = (0, mongoose_1.model)('Staff', staffSchema);
