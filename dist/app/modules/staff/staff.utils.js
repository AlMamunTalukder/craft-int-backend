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
exports.getStaffPopulations = exports.generateStaffId = void 0;
const staff_model_1 = require("./staff.model");
const findLastStaffNo = () => __awaiter(void 0, void 0, void 0, function* () {
    const lastStaffNo = yield staff_model_1.Staff.findOne({}, {
        staffId: 1,
    })
        .sort({ createdAt: -1 })
        .lean();
    return (lastStaffNo === null || lastStaffNo === void 0 ? void 0 : lastStaffNo.staffId) ? lastStaffNo.staffId : undefined;
});
const generateStaffId = () => __awaiter(void 0, void 0, void 0, function* () {
    const currentId = (yield findLastStaffNo()) || '0000';
    const incrementId = (Number(currentId) + 1).toString().padStart(4, '0');
    return `${incrementId}`;
});
exports.generateStaffId = generateStaffId;
const getStaffPopulations = (options = {}) => {
    var _a;
    const populations = [];
    // If withAll is true, enable all populations
    const shouldPopulateMeals = options.withAll || options.withMeals;
    // Optional populations based on options
    if (shouldPopulateMeals) {
        populations.push({
            path: 'mealAttendances',
            select: ((_a = options.selectFields) === null || _a === void 0 ? void 0 : _a.mealAttendances) || 'date mealType status breakfast lunch dinner totalMeals mealCost month academicYear',
            options: {
                sort: { date: -1 },
                limit: options.limit || 30
            }
        });
    }
    return populations;
};
exports.getStaffPopulations = getStaffPopulations;
