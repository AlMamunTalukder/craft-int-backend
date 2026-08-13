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
exports.generateTeacherId = void 0;
const teacher_model_1 = require("./teacher.model");
const findLastTeacherNo = () => __awaiter(void 0, void 0, void 0, function* () {
    const lastTeacherNo = yield teacher_model_1.Teacher.findOne({}, {
        teacherId: 1,
    })
        .sort({ createdAt: -1 })
        .lean();
    return (lastTeacherNo === null || lastTeacherNo === void 0 ? void 0 : lastTeacherNo.teacherId) ? lastTeacherNo === null || lastTeacherNo === void 0 ? void 0 : lastTeacherNo.teacherId : undefined;
});
const generateTeacherId = () => __awaiter(void 0, void 0, void 0, function* () {
    const currentId = (yield findLastTeacherNo()) || '0000';
    let incrementId = (Number(currentId) + 1).toString().padStart(4, '0');
    incrementId = `${incrementId}`;
    return incrementId;
});
exports.generateTeacherId = generateTeacherId;
