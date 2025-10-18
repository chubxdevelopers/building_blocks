import { pool } from "../db.js";

/**
 * GET /api/:appSlug/app/query
 * Return company/app info (settings, logo, name, slug, raw row)
 * Uses req.company if appContext middleware attached it, otherwise falls back
 * to querying the companies table by slug.
 */
export const getAppQuery = async (req, res) => {
  try {
    // Prefer company already loaded by middleware
    let company = req.company || null;
    const appSlug =
      req.params && req.params.appSlug ? req.params.appSlug : null;

    if (!company) {
      if (!appSlug)
        return res.status(400).json({ message: "Missing app slug" });
      const sql = "SELECT * FROM companies WHERE slug = ? LIMIT 1";
      const [rows] = await pool.promise().query(sql, [appSlug]);
      if (!rows || rows.length === 0)
        return res.status(404).json({ message: "Company not found" });
      company = rows[0];
      // parse settings if needed
      try {
        if (company.settings && typeof company.settings === "string")
          company.settings = JSON.parse(company.settings);
      } catch (e) {
        /* ignore */
      }
    }

    const response = {
      appSlug: appSlug || company.slug || null,
      companyName: company.name || null,
      settings: company.settings || {},
      raw: company,
    };

    return res.json(response);
  } catch (err) {
    console.error("getAppQuery error", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};
