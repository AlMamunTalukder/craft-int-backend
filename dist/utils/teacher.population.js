"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeacherPopulations = void 0;
const getTeacherPopulations = (options = {}) => {
    const populations = [];
    // Always populate basic relations
    populations.push({ path: 'section', select: 'name code capacity' }, { path: 'class', select: 'name level code section' }, { path: 'room', select: 'roomNo buildingName type capacity' });
    // Optional populations based on options
    if (options.withSchedule) {
        populations.push({
            path: 'schedule',
            select: 'day startTime endTime subject room',
            populate: { path: 'subject', select: 'name code creditHours' }
        });
    }
    if (options.withAssignments) {
        populations.push({
            path: 'assignment',
            select: 'title subject dueDate totalMarks status',
            populate: { path: 'subject', select: 'name code' }
        });
    }
    if (options.withAttendance) {
        populations.push({
            path: 'attendance',
            select: 'date status presentCount absentCount',
            options: { sort: { date: -1 }, limit: options.limit || 10 }
        });
    }
    if (options.withMeals) {
        populations.push({
            path: 'mealAttendances',
            options: { sort: { date: -1 }, limit: options.limit || 30 }
        });
    }
    return populations;
};
exports.getTeacherPopulations = getTeacherPopulations;
