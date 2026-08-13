import express from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { auth } from "../../middlewares/auth";
import { assetControllers } from "./controller";
import { assetValidations } from "./validation";

const router = express.Router();

router.get("/summary", assetControllers.getSummary);

router.post(
  "/",
  auth("admin", "super_admin"),
  validateRequest(assetValidations.createAssetValidation),
  assetControllers.createAsset,
);

router.get("/", assetControllers.getAllAssets);
router.get("/:id", assetControllers.getSingleAsset);

router.patch(
  "/:id",
  auth("admin", "super_admin"),
  validateRequest(assetValidations.updateAssetValidation),
  assetControllers.updateAsset,
);

router.delete(
  "/:id",
  auth("admin", "super_admin"),
  assetControllers.deleteAsset,
);

export const assetRoutes = router;
