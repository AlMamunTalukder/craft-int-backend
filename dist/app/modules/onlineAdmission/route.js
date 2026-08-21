"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.admissionApplicationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const validation_1 = require("./validation");
const controller_1 = require("./controller");
const router = express_1.default.Router();
router.post('/', controller_1.admissionApplicationControllers.createAdmissionApplication);
router.get('/', 
// auth('admin', 'super_admin'),
controller_1.admissionApplicationControllers.getAllAdmissionApplications);
router.get('/:id', 
// auth('admin', 'super_admin'),
controller_1.admissionApplicationControllers.getSingleAdmissionApplication);
router.patch('/:id', 
// auth('admin', 'super_admin'),
(0, validateRequest_1.validateRequest)(validation_1.AdmissionApplicationValidations.updateAdmissionApplicationValidation), controller_1.admissionApplicationControllers.updateAdmissionApplication);
router.delete('/:id', 
// auth('super_admin'),
controller_1.admissionApplicationControllers.deleteAdmissionApplication);
exports.admissionApplicationRoutes = router;
