"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sunaniReportRoutes = void 0;
const express_1 = __importDefault(require("express"));
const controller_1 = require("./controller");
const validation_1 = require("./validation");
const validateRequest_1 = require("../../middlewares/validateRequest");
const router = express_1.default.Router();
router.post('/', (0, validateRequest_1.validateRequest)(validation_1.SunaniReportValidation), controller_1.sunaniReportControllers.createSunaniReport);
router.get('/', controller_1.sunaniReportControllers.getAllSunaniReports);
router.get('/:id', controller_1.sunaniReportControllers.getSingleSunaniReport);
router.patch('/:id', (0, validateRequest_1.validateRequest)(validation_1.SunaniReportValidation.partial()), controller_1.sunaniReportControllers.updateSunaniReport);
router.delete('/:id', controller_1.sunaniReportControllers.deleteSunaniReport);
router.get('/student/:studentName', controller_1.sunaniReportControllers.getReportsByStudent);
exports.sunaniReportRoutes = router;
