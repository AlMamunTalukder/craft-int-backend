"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metaRoute = void 0;
const express_1 = __importDefault(require("express"));
const meta_controller_1 = require("./meta.controller");
const router = express_1.default.Router();
router.get('/', meta_controller_1.metaController.getAllMeta);
router.get('/accounting-report', meta_controller_1.metaController.getAccountingReport);
router.get('/class-wise-student-count', meta_controller_1.metaController.getClassWiseStudentCount);
exports.metaRoute = router;
