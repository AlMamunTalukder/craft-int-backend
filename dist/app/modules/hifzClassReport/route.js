"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hifzClassReportRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const controller_1 = require("./controller");
const validation_1 = require("./validation");
const router = express_1.default.Router();
router.post('/', (0, validateRequest_1.validateRequest)(validation_1.hifzReportValidation), controller_1.hifzClassReportControllers.createHifzClassReport);
router.get('/', controller_1.hifzClassReportControllers.getAllHifzClassReports);
router.get('/:id', controller_1.hifzClassReportControllers.getSingleHifzClassReport);
router.patch('/:id', controller_1.hifzClassReportControllers.updateHifzClassReport);
router.delete('/:id', controller_1.hifzClassReportControllers.deleteHifzClassReport);
exports.hifzClassReportRoutes = router;
