"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hifzClassRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const validation_1 = require("./validation");
const controller_1 = require("./controller");
const router = express_1.default.Router();
router.post('/', (0, validateRequest_1.validateRequest)(validation_1.HifzClassValidations.createHifzClassValidation), controller_1.hifzClassControllers.createHifzClass);
router.get('/', controller_1.hifzClassControllers.getAllHifzClasss);
router.get('/:id', controller_1.hifzClassControllers.getSingleHifzClass);
router.patch('/:id', (0, validateRequest_1.validateRequest)(validation_1.HifzClassValidations.updateHifzClassValidation), controller_1.hifzClassControllers.updateHifzClass);
router.delete('/:id', controller_1.hifzClassControllers.deleteHifzClass);
exports.hifzClassRoutes = router;
