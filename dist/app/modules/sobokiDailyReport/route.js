"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sobokiDailyReportRoutes = void 0;
const express_1 = __importDefault(require("express"));
const controller_1 = require("./controller");
const validation_1 = require("./validation");
const validateRequest_1 = require("../../middlewares/validateRequest");
const router = express_1.default.Router();
router.post('/', 
// validateRequest(SobokiDailyReportValidation),
controller_1.sobokiDailyReportControllers.createSobokiDailyReport);
router.get('/', controller_1.sobokiDailyReportControllers.getAllSobokiDailyReports);
router.get('/:id', controller_1.sobokiDailyReportControllers.getSingleSobokiDailyReport);
router.patch('/:id', (0, validateRequest_1.validateRequest)(validation_1.SobokiDailyReportValidation.partial()), controller_1.sobokiDailyReportControllers.updateSobokiDailyReport);
router.delete('/:id', controller_1.sobokiDailyReportControllers.deleteSobokiDailyReport);
router.get('/student/:studentName', controller_1.sobokiDailyReportControllers.getReportsByStudent);
exports.sobokiDailyReportRoutes = router;
