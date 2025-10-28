import { pool } from "../db.js";

export const getPublicData = (req, res) => {
  res.json({ message: "This is a public route accessible without login." });
};

// GET /api/public/companies
export const getCompanies = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, slug FROM companies ORDER BY name"
    );
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
    const [companyRows] = await pool.query(
      "SELECT id FROM companies WHERE slug = ? LIMIT 1",
      [companySlug]
    );
    if (!companyRows || companyRows.length === 0) {
      return res.status(404).json({ message: "Company not found" });
    }
    const companyId = companyRows[0].id;
    const [apps] = await pool.query(
      "SELECT id, name, slug, company_id FROM apps WHERE company_id = ? ORDER BY name",
      [companyId]
    );
    return res.json(apps);
  } catch (err) {
    console.error("getCompanyApps error:", err);
    return res.status(500).json({ message: "Failed to load apps for company" });
  }
};

// GET /api/public/teams
export const getTeams = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name FROM teams ORDER BY name"
    );
    return res.json(rows);
  } catch (err) {
    console.error("getTeams error:", err);
    return res.status(500).json({ message: "Failed to load teams" });
  }
};

// GET /api/public/ROLES
export const getRoles = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name FROM roles ORDER BY name"
    );
    return res.json(rows);
  } catch (err) {
    console.error("getRoles error:", err);
    return res.status(500).json({ message: "Failed to load roels" });
  }
};