import { execQuery } from "../utils/queryBuilder/queryExecutor.js";

export const getPublicData = (req, res) => {
  res.json({ message: "This is a public route accessible without login." });
};

// GET /api/public/companies
export const getCompanies = async (req, res) => {
  try {
    const rows = await execQuery({
      resource: "companies",
      filters: null,
      orderBy: { name: "asc" },
      pagination: null,
      jwt: req.jwt,
    });
    return res.json(rows);
  } catch (err) {
    console.error("getCompanies error:", err);
    return res.status(500).json({ message: "Failed to load companies" });
  }
};

// GET /api/public/companies/:companySlug/apps
export const getCompanyApps = async (req, res) => {
  const { companySlug } = req.params;
  try {
    // Resolve company by slug via query builder
    const companyRows = await execQuery({
      resource: "companies",
      filters: { slug: companySlug },
      orderBy: null,
      pagination: null,
      jwt: req.jwt,
    });
    if (!companyRows || companyRows.length === 0) {
      return res.status(404).json({ message: "Company not found" });
    }
    const companyId = companyRows[0].id;

    const apps = await execQuery({
      resource: "apps",
      filters: { company_id: companyId },
      orderBy: { name: "asc" },
      pagination: null,
      jwt: req.jwt,
    });
    return res.json(apps);
  } catch (err) {
    console.error("getCompanyApps error:", err);
    return res.status(500).json({ message: "Failed to load apps for company" });
  }
};

// GET /api/public/teams
export const getTeams = async (req, res) => {
  try {
    const rows = await execQuery({
      resource: "teams",
      filters: null,
      orderBy: { name: "asc" },
      pagination: null,
      jwt: req.jwt,
    });
    return res.json(rows);
  } catch (err) {
    console.error("getTeams error:", err);
    return res.status(500).json({ message: "Failed to load teams" });
  }
};

// GET /api/public/ROLES
export const getRoles = async (req, res) => {
  try {
    const rows = await execQuery({
      resource: "roles",
      filters: null,
      orderBy: { name: "asc" },
      pagination: null,
      jwt: req.jwt,
    });
    return res.json(rows);
  } catch (err) {
    console.error("getRoles error:", err);
    return res.status(500).json({ message: "Failed to load roels" });
  }
};

// // GET /api/public/capabilities
export const getCapabilities = async (req, res) => {
  try {
    const rows = await execQuery({
      resource: "features_capability",
      filters: null,
      orderBy: { name: "asc" },
      pagination: null,
      jwt: req.jwt,
    });
    return res.json(rows);
  } catch (err) {
    console.error("getCapabilities error:", err);
    return res.status(500).json({ message: "Failed to load capabilities" });
  }
};

export const getFeatures = async (req, res) => {
  try {
    const rows = await execQuery({
      resource: "features",
      filters: null,
      orderBy: { feature_name: "asc" },
      pagination: null,
      jwt: req.jwt,
    });
    return res.json(rows);
  } catch (err) {
    console.error("getFeatures error:", err);
    return res.status(500).json({ message: "Failed to load features" });
  }
};