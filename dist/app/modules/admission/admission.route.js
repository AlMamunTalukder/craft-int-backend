"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.admissionRoutes = void 0;
const express_1 = __importDefault(require("express"));
const admission_controller_1 = require("./admission.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const admission_validation_1 = require("./admission.validation");
const router = express_1.default.Router();
router.post('/', (0, validateRequest_1.validateRequest)(admission_validation_1.CreateAdmissionSchema), admission_controller_1.admissionController.createAdmission);
router.get('/', admission_controller_1.admissionController.getAllAdmissions);
router.get('/:id', admission_controller_1.admissionController.getSingleAdmission);
router.patch('/:id', (0, validateRequest_1.validateRequest)(admission_validation_1.CreateAdmissionSchema), admission_controller_1.admissionController.updateAdmission);
router.delete('/:id', admission_controller_1.admissionController.deleteAdmission);
exports.admissionRoutes = router;
