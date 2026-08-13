"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollmentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const controller_1 = require("./controller");
const validation_1 = require("./validation");
const router = express_1.default.Router();
router.get('/eligible-for-promotion', controller_1.enrollmentControllers.getPromotionEligibleStudents);
router.post('/', (0, validateRequest_1.validateRequest)(validation_1.enrollmentValidationSchema), controller_1.enrollmentControllers.createEnrollment);
router.get('/', controller_1.enrollmentControllers.getAllEnrollments);
router.post('/promote', controller_1.enrollmentControllers.promoteEnrollment);
router.post('/bulk-promote', controller_1.enrollmentControllers.bulkPromoteEnrollments);
router.get('/:id', controller_1.enrollmentControllers.getSingleEnrollment);
router.patch('/:id', 
// validateRequest(enrollmentValidationSchema),
controller_1.enrollmentControllers.updateEnrollment);
router.delete('/:id', controller_1.enrollmentControllers.deleteEnrollment);
router.get('/promotion-history/:studentId', controller_1.enrollmentControllers.getPromotionHistory);
router.post('/bulk-retain', controller_1.enrollmentControllers.bulkRetainStudents);
exports.enrollmentRoutes = router;
