"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectAssign = void 0;
const mongoose_1 = require("mongoose");
const subjectSchema = new mongoose_1.Schema({
    subjectName: {
        type: String,
        required: true,
        trim: true,
    },
    subjectCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
    },
    description: {
        type: String,
    },
    classId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Class',
        required: true,
    },
    teacherId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});
exports.SubjectAssign = (0, mongoose_1.model)('Subject', subjectSchema);
