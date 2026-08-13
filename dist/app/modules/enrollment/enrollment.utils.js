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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClassNameFromClassModel = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const mongoose_1 = __importDefault(require("mongoose"));
const getClassNameFromClassModel = (classId, session) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const Class = mongoose_1.default.model('Class');
        const classDoc = yield Class.findById(classId)
            .select('className')
            .session(session)
            .lean();
        if (!classDoc) {
            return '';
        }
        if (classDoc.className) {
            return classDoc.className;
        }
        return '';
    }
    catch (error) {
        console.error('Error fetching class name from Class model:', error);
        return '';
    }
});
exports.getClassNameFromClassModel = getClassNameFromClassModel;
