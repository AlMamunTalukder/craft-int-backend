"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.amparaDailyReportRoutes = void 0;
const express_1 = __importDefault(require("express"));
const controller_1 = require("./controller");
const validation_1 = require("./validation");
const validateRequest_1 = require("../../middlewares/validateRequest");
const router = express_1.default.Router();
router.post('/', (0, validateRequest_1.validateRequest)(validation_1.AmparaDailyReportValidation), controller_1.amparaDailyReportControllers.createAmparaDailyReport);
router.get('/', controller_1.amparaDailyReportControllers.getAllAmparaDailyReports);
router.get('/:id', controller_1.amparaDailyReportControllers.getSingleAmparaDailyReport);
router.patch('/:id', (0, validateRequest_1.validateRequest)(validation_1.AmparaDailyReportValidation.partial()), controller_1.amparaDailyReportControllers.updateAmparaDailyReport);
router.delete('/:id', controller_1.amparaDailyReportControllers.deleteAmparaDailyReport);
router.get('/student/:studentName', controller_1.amparaDailyReportControllers.getReportsByStudent);
exports.amparaDailyReportRoutes = router;
