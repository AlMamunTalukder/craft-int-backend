import express from "express";
import { auth } from "../../middlewares/auth";
import { feeAdjustmentControllers } from "./controller";

const router = express.Router();

router.post(
  "/",
  auth("admin", "super_admin"),
  feeAdjustmentControllers.createFeeAdjustment
);

router.get("/", feeAdjustmentControllers.getAllFeeAdjustments);
router.get("/:id", feeAdjustmentControllers.getSingleFeeAdjustment);

router.patch(
  "/:id",
  auth("admin", "super_admin"),
  feeAdjustmentControllers.updateFeeAdjustment
);

router.delete("/:id", auth("admin", "super_admin"), feeAdjustmentControllers.deleteFeeAdjustment);

export const feeAdjustmentRoutes = router;
