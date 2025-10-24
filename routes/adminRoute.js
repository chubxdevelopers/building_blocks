import express from "express";
import { protect } from "../middleware/authmiddleware.js";
import {
  addUser,
  addFeature,
  addFeatureCapability,
  getFeatures,
  getCapabilities,
  getRoles,
  addRoleCapability,
  registerAdmin,
} from "../controller/adminController.js";

const router = express.Router();

// Protect all admin routes
// router.use(protect);
router.post("/register", registerAdmin);
router.post("/add-user", protect, addUser);
router.post("/add-feature", protect, addFeature);
// list features (non-destructive)
router.get("/features", protect, getFeatures);
router.post("/add-feature-capability", protect, addFeatureCapability);
// list capabilities
router.get("/capabilities", protect, getCapabilities);
// list roles
router.get("/roles", protect, getRoles);
router.post("/add-role-capability", protect, addRoleCapability);

export default router;
