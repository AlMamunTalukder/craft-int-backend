"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentAcademicYear = void 0;
const getCurrentAcademicYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    if (month >= 1) {
        return `${year}-${year + 1}`;
    }
    return `${year - 1}-${year}`;
};
exports.getCurrentAcademicYear = getCurrentAcademicYear;
