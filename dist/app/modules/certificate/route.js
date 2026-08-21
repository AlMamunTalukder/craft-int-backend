"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.certificateRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const auth_1 = require("../../middlewares/auth");
const controller_1 = require("./controller");
const validation_1 = require("./validation");
const router = express_1.default.Router();
router.get('/id-cards', (0, auth_1.auth)('admin', 'super_admin'), controller_1.certificateControllers.getIdCards);
router.post('/', (0, auth_1.auth)('admin', 'super_admin'), (0, validateRequest_1.validateRequest)(validation_1.certificateValidations.createCertificateValidation), controller_1.certificateControllers.createCertificate);
router.get('/', controller_1.certificateControllers.getAllCertificates);
router.get('/:id', controller_1.certificateControllers.getSingleCertificate);
router.patch('/:id', (0, auth_1.auth)('admin', 'super_admin'), (0, validateRequest_1.validateRequest)(validation_1.certificateValidations.updateCertificateValidation), controller_1.certificateControllers.updateCertificate);
router.delete('/:id', (0, auth_1.auth)('admin', 'super_admin'), controller_1.certificateControllers.deleteCertificate);
exports.certificateRoutes = router;
