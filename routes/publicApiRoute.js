import express from "express";
import {
  getCompanies,
  getCompanyApps,
  getTeams,
  getCapabilities,
  getFeatures,
  getRoles,
} from "../controller/publicController.js";

const router = express.Router();

// GET /api/public/companies
router.get("/companies", getCompanies);

// GET /api/public/companies/:companySlug/apps
router.get("/companies/:companySlug/apps", getCompanyApps);

//GET /api/public/teams
router.get("/teams", getTeams);

//GET /api/public/roles
router.get("/roles", getRoles);

//GET /api/public/capabilities
router.get("/capabilities", getCapabilities);

//GET /api/public/features
router.get("/features", getFeatures);

export default router;
