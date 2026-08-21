"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffRoutes = void 0;
const express_1 = __importDefault(require("express"));
const staff_controller_1 = require("./staff.controller");
const router = express_1.default.Router();
router.post('/', 
// auth('admin', 'super_admin', 'staff', 'student'),
staff_controller_1.staffControllers.createStaff);
router.get('/', staff_controller_1.staffControllers.getAllStaffs);
router.get('/:id', staff_controller_1.staffControllers.getSingleStaff);
router.delete('/:id', 
// auth('admin', 'super_admin'),
staff_controller_1.staffControllers.deleteStaff);
router.patch('/:id', 
// auth('admin', 'super_admin', 'staff'),
staff_controller_1.staffControllers.updateStaff);
exports.staffRoutes = router;
