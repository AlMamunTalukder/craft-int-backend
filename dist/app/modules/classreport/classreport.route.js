"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.classReportRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const classreport_validation_1 = require("./classreport.validation");
const classreport_controller_1 = require("./classreport.controller");
const router = express_1.default.Router();
router.post('/', (0, validateRequest_1.validateRequest)(classreport_validation_1.ClassReportValidations.createClassReportValidation), classreport_controller_1.classReportControllers.createClassReport);
// router.get(
//   '/classreport/:classreportid',
//   classReportControllers.generateClassReportPdf,
// );
router.get('/', classreport_controller_1.classReportControllers.getAllClassReports);
router.get('/:id', classreport_controller_1.classReportControllers.getSingleClassReport);
router.patch('/update-has-comments/all', classreport_controller_1.classReportControllers.updateHasCommentsForAllReports);
router.patch('/:id', (0, validateRequest_1.validateRequest)(classreport_validation_1.ClassReportValidations.updateClassReportValidation), classreport_controller_1.classReportControllers.updateClassReport);
router.delete('/:id', classreport_controller_1.classReportControllers.deleteClassReport);
exports.classReportRoutes = router;
