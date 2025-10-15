import express from "express";
import { protect } from "../middleware/authmiddleware.js";
import {
  addUser,
  addFeature,
  addFeatureCapability,
  addRoleCapability,
} from "../controller/adminController.js";

const router = express.Router();

// Protect all admin routes
router.use(protect);

router.post("/add-user", addUser);
router.post("/add-feature", addFeature);
router.post("/add-feature-capability", addFeatureCapability);
router.post("/add-role-capability", addRoleCapability);

export default router;
