"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Certificate = void 0;
const mongoose_1 = require("mongoose");
const CertificateSchema = new mongoose_1.Schema({
    certificateType: { type: String, required: true },
    certificateNo: { type: String, required: true, unique: true },
    student: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Student', required: true },
    academicYear: { type: String },
    issueDate: { type: Date, default: Date.now },
    issuedBy: { type: String },
    data: { type: mongoose_1.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
exports.Certificate = (0, mongoose_1.model)('Certificate', CertificateSchema);
CertificateSchema.index({ student: 1 });
CertificateSchema.index({ certificateType: 1 });
