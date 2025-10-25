import express from "express";
import {
  getCompanies,
  getCompanyApps,
} from "../controller/publicController.js";

const router = express.Router();

// GET /api/public/companies
router.get("/companies", getCompanies);

// GET /api/public/companies/:companySlug/apps
router.get("/companies/:companySlug/apps", getCompanyApps);

export default router;
