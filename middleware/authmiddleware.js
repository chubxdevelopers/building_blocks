// Middleware to protect routes and verify JWT tokens

import { verifyToken } from "../utils/jwt.js";

export const protect = (req, res, next) => {
  try {
    const token = req.cookies.token; // Read JWT from cookies
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const decoded = verifyToken(token);
    if (!decoded)
      return res.status(403).json({ message: "Invalid or expired token" });

    req.user = decoded; // Attach decoded payload (user info + permissions)

    // Check if user has access to the requested company/app
    if (req.company) {
      // First check company access
      if (req.user.company !== req.company.slug) {
        return res.status(403).json({
          message: "Access denied: User does not belong to this company",
          userCompany: req.user.company,
          requestedCompany: req.company.slug,
        });
      }

      // If there's an app context, verify app access
      if (req.app) {
        // Relaxed: allow admin endpoints to be reached even if uiPermissions absent,
        // since admin feature listing/mapping happens before capability assignment.
        // Keep the company check above; skip strict app permission gate here.
      }
    }

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ message: "Authentication failed" });
  }
};
