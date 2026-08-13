"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.complaintRoutes = void 0;
const express_1 = __importDefault(require("express"));
const complaint_controller_1 = require("./complaint.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const complaint_validation_1 = require("./complaint.validation");
const router = express_1.default.Router();
router.post('/', (0, validateRequest_1.validateRequest)(complaint_validation_1.ComplaintValidation.createComplaint), complaint_controller_1.complaintControllers.createComplaint);
router.get('/', complaint_controller_1.complaintControllers.getAllComplaints);
router.get('/:id', complaint_controller_1.complaintControllers.getSingleComplaint);
router.patch('/:id', (0, validateRequest_1.validateRequest)(complaint_validation_1.ComplaintValidation.updateComplaint), complaint_controller_1.complaintControllers.updateComplaint);
router.delete('/:id', complaint_controller_1.complaintControllers.deleteComplaint);
exports.complaintRoutes = router;
