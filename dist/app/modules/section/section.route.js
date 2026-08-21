"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sectionRoutes = void 0;
const express_1 = __importDefault(require("express"));
const section_controller_1 = require("./section.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const section_validation_1 = require("./section.validation");
const router = express_1.default.Router();
router.post('/', 
// auth('admin', 'super_admin'),
(0, validateRequest_1.validateRequest)(section_validation_1.SectionValidations.createSectionValidation), section_controller_1.sectionControllers.createSection);
router.get('/', section_controller_1.sectionControllers.getAllSections);
router.get('/:id', section_controller_1.sectionControllers.getSingleSection);
router.patch('/:id', 
// auth('admin', 'super_admin'),
(0, validateRequest_1.validateRequest)(section_validation_1.SectionValidations.updateSectionValidation), section_controller_1.sectionControllers.updateSection);
router.delete('/:id', 
// auth('admin', 'super_admin'),
section_controller_1.sectionControllers.deleteSection);
exports.sectionRoutes = router;
