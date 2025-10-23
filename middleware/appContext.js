import { pool } from "../db.js";

/**
 * Middleware to detect which app/company is being used from the request URL.
 * It expects the URL to include an app slug as the first path segment after /api
 * Example: /api/:appSlug/admin/..., /api/:appSlug/user/...
 * Attaches the company/app record to req.company if found.
 */
export const appContext = async (req, res, next) => {
  try {
    const parts = req.path.split("/").filter(Boolean); // removes empty

    let appSlug = null;
    if (parts.length > 0 && parts[0].toLowerCase() === "api") {
      if (parts.length > 1) appSlug = parts[1];
    } else {
      if (parts.length > 0) appSlug = parts[0];
    }

    // Sometimes clients (Postman examples) include a leading ':' like
    // '/api/:abc/auth' — normalize that by stripping a leading colon.
    if (appSlug && appSlug.startsWith(":")) {
      appSlug = appSlug.slice(1);
    }

    // Also allow the Express param (if mounted) as a fallback
    if (!appSlug && req.params && req.params.appSlug) {
      appSlug = req.params.appSlug;
      if (appSlug.startsWith(":")) appSlug = appSlug.slice(1);
    }

    if (!appSlug) {
      req.company = null;
      return next();
    }

    const sql = "SELECT * FROM companies WHERE slug = ? LIMIT 1";
    // Use promise-based query
    const [results] = await pool.query(sql, [appSlug]);

    if (!results || results.length === 0) {
      // Company not found; return 404 so clients know the app is invalid
      return res.status(404).json({ message: `App not found: ${appSlug}` });
    }

    const company = results[0];
    // Normalize settings: if settings is a JSON string, parse it
    try {
      if (company.settings && typeof company.settings === "string") {
        company.settings = JSON.parse(company.settings);
      }
    } catch (e) {
      // If JSON parse fails, keep as-is and log
      console.warn("Failed to parse company.settings JSON", e);
    }

    req.company = company;

    // Remove the app slug segment from the URL so existing route mounts like
    // '/api/auth' keep working when clients call '/api/:appSlug/auth'.
    try {
      const prefix = `/api/${appSlug}`;
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
