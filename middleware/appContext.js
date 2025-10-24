import { pool } from "../db.js";

/**
 * Middleware to detect which app/company is being used from the request URL.
 * It expects the URL to include an app slug as the first path segment after /api
 * Example: /api/:appSlug/admin/..., /api/:appSlug/user/...
 * Attaches the company/app record to req.company if found.
 */
export const appContext = async (req, res, next) => {
  try {
    // Expect URL shape: /api/:company/:appSlug/...
    const parts = req.path.split("/").filter(Boolean); // removes empty

    let companySlug = null;
    let appSlug = null;

    // parts may be ['api', company, appSlug, ...] or [company, appSlug, ...]
    if (parts.length > 0 && parts[0].toLowerCase() === "api") {
      companySlug = parts.length > 1 ? parts[1] : null;
      appSlug = parts.length > 2 ? parts[2] : null;
    } else {
      companySlug = parts.length > 0 ? parts[0] : null;
      appSlug = parts.length > 1 ? parts[1] : null;
    }

    // normalize leading ':' if present
    if (companySlug && companySlug.startsWith(":"))
      companySlug = companySlug.slice(1);
    if (appSlug && appSlug.startsWith(":")) appSlug = appSlug.slice(1);

    // fallback to express params if not found in path
    if ((!companySlug || !appSlug) && req.params) {
      if (!companySlug && req.params.company) companySlug = req.params.company;
      if (!appSlug && req.params.appSlug) appSlug = req.params.appSlug;
    }

    // If neither slug present, skip attaching context
    if (!companySlug) {
      req.company = null;
      req.app = null;
      return next();
    }

    // Load company record
    const [companyRows] = await pool.query(
      "SELECT * FROM companies WHERE slug = ? LIMIT 1",
      [companySlug]
    );
    if (!companyRows || companyRows.length === 0) {
      return res
        .status(404)
        .json({ message: `Company not found: ${companySlug}` });
    }
    const company = companyRows[0];
    try {
      if (company.settings && typeof company.settings === "string")
        company.settings = JSON.parse(company.settings);
    } catch (e) {
      console.warn("Failed to parse company.settings JSON", e);
    }

    // Attach company
    req.company = company;

    // If appSlug provided, load app under this company
    if (appSlug) {
      const [appRows] = await pool.query(
        "SELECT * FROM apps WHERE slug = ? AND company_id = ? LIMIT 1",
        [appSlug, company.id]
      );
      if (!appRows || appRows.length === 0) {
        return res
          .status(404)
          .json({
            message: `App not found: ${appSlug} for company ${companySlug}`,
          });
      }
      const appRow = appRows[0];
      try {
        if (appRow.settings && typeof appRow.settings === "string")
          appRow.settings = JSON.parse(appRow.settings);
      } catch (e) {
        console.warn("Failed to parse app.settings JSON", e);
      }
      req.app = appRow;
    } else {
      req.app = null;
    }

    // Remove the prefix '/api/:company/:appSlug' (or '/:company/:appSlug') from req.url
    try {
      let prefix = `/api/${companySlug}/${appSlug}`;
      if (appSlug == null) prefix = `/api/${companySlug}`;
      if (req.url && req.url.startsWith(prefix)) {
        req.url = req.url.replace(prefix, "/api");
      }
    } catch (e) {
      // ignore
    }

    return next();
  } catch (err) {
    console.error("appContext error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
