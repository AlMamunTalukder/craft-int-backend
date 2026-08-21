"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const auth_1 = require("../../middlewares/auth");
const controller_1 = require("./controller");
const validation_1 = require("./validation");
const router = express_1.default.Router();
router.get("/summary", controller_1.assetControllers.getSummary);
router.post("/", (0, auth_1.auth)("admin", "super_admin"), (0, validateRequest_1.validateRequest)(validation_1.assetValidations.createAssetValidation), controller_1.assetControllers.createAsset);
router.get("/", controller_1.assetControllers.getAllAssets);
router.get("/:id", controller_1.assetControllers.getSingleAsset);
router.patch("/:id", (0, auth_1.auth)("admin", "super_admin"), (0, validateRequest_1.validateRequest)(validation_1.assetValidations.updateAssetValidation), controller_1.assetControllers.updateAsset);
router.delete("/:id", (0, auth_1.auth)("admin", "super_admin"), controller_1.assetControllers.deleteAsset);
exports.assetRoutes = router;
