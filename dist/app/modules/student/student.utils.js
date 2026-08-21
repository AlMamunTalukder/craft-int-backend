"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStudentId = exports.StudentStatus = exports.Gender = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
const student_model_1 = require("./student.model");
var Gender;
(function (Gender) {
    Gender["MALE"] = "Male";
    Gender["FEMALE"] = "Female";
    Gender["OTHER"] = "Other";
    Gender[""] = "";
})(Gender || (exports.Gender = Gender = {}));
var StudentStatus;
(function (StudentStatus) {
    StudentStatus["ACTIVE"] = "active";
    StudentStatus["PASSED"] = "passed";
    StudentStatus["GRADUATED"] = "failed";
    StudentStatus["LEFT"] = "left";
})(StudentStatus || (exports.StudentStatus = StudentStatus = {}));
const generateStudentId = (className) => __awaiter(void 0, void 0, void 0, function* () {
    const prefix = 'CII';
    const pattern = `^${prefix}\\d{4}$`;
    const lastStudent = yield student_model_1.Student.findOne({
        studentId: { $regex: pattern, $options: 'i' },
    }, { studentId: 1 })
        .sort({ studentId: -1 })
        .lean();
    let sequenceNumber = 1;
    if (lastStudent === null || lastStudent === void 0 ? void 0 : lastStudent.studentId) {
        const lastId = lastStudent.studentId;
        const numericPart = lastId.slice(3);
        sequenceNumber = parseInt(numericPart, 10) + 1;
        if (sequenceNumber > 9999) {
            throw new Error('Sequence number exceeded maximum (CII9999)');
        }
    }
    const studentId = `${prefix}${sequenceNumber.toString().padStart(4, '0')}`;
    return studentId;
});
exports.generateStudentId = generateStudentId;
