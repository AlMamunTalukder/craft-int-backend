"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const feedback_controller_1 = require("./feedback.controller");
const feedback_validation_1 = require("./feedback.validation");
const router = express_1.default.Router();
router.post('/', 
// auth('admin', 'user', 'super_admin'), // uncomment if needed
(0, validateRequest_1.validateRequest)(feedback_validation_1.FeedbackValidations.createFeedbackValidation), feedback_controller_1.feedbackControllers.createFeedback);
router.get('/', feedback_controller_1.feedbackControllers.getAllFeedbacks);
router.get('/:id', feedback_controller_1.feedbackControllers.getSingleFeedback);
router.patch('/:id', 
// auth('admin', 'super_admin'),
(0, validateRequest_1.validateRequest)(feedback_validation_1.FeedbackValidations.updateFeedbackValidation), feedback_controller_1.feedbackControllers.updateFeedback);
router.delete('/:id', 
// auth('admin', 'super_admin'),
feedback_controller_1.feedbackControllers.deleteFeedback);
exports.feedbackRoutes = router;
