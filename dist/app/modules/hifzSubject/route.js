"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hifzSubjectRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const auth_1 = require("../../middlewares/auth");
const validation_1 = require("./validation");
const controller_1 = require("./controller");
const router = express_1.default.Router();
router.post('/', (0, auth_1.auth)('admin', 'super_admin'), (0, validateRequest_1.validateRequest)(validation_1.HifzSubjectValidations.createHifzSubjectValidation), controller_1.hifzSubjectControllers.createHifzSubject);
router.get('/', controller_1.hifzSubjectControllers.getAllHifzSubjects);
router.get('/:id', controller_1.hifzSubjectControllers.getSingleHifzSubject);
router.patch('/:id', (0, auth_1.auth)('admin', 'super_admin'), (0, validateRequest_1.validateRequest)(validation_1.HifzSubjectValidations.updateHifzSubjectValidation), controller_1.hifzSubjectControllers.updateHifzSubject);
router.delete('/:id', (0, auth_1.auth)('admin', 'super_admin'), controller_1.hifzSubjectControllers.deleteHifzSubject);
exports.hifzSubjectRoutes = router;
