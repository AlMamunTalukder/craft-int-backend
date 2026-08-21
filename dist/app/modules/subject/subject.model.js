"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subject = void 0;
const mongoose_1 = require("mongoose");
const SubjectSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Subject name is required'],
    },
    paper: {
        type: String,
        default: '',
    }
}, {
    timestamps: true,
});
exports.Subject = (0, mongoose_1.model)('Subject', SubjectSchema);
