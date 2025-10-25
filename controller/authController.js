import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { signToken, verifyToken } from "../utils/jwt.js";

// LOGIN controller
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Determine current company/app from middleware (req.company) or params
    const companySlug = req.company?.slug || req.params?.company || null;
    const appSlug = req.app?.slug || req.params?.appSlug || null;

    // First verify the company exists and get the exact slug
    console.log("Verifying company slug:", companySlug);
    const [companyRows] = await pool.query(
      "SELECT slug FROM companies WHERE slug = ?",
      [companySlug]
    );

    if (!companySlug || companyRows.length === 0) {
      console.log("Company not found:", companySlug);
      return res.status(404).json({ message: "Company not found" });
    }

    // Get the exact company slug from the database
    const correctCompanySlug = companyRows[0].slug;

    console.log("Request details:", {
      body: req.body,
      params: req.params,
      company: req.company,
      companySlug,
      correctCompanySlug,
      appSlug,
    });

    // Get user data with company/role/team names (join by _id FK columns)
    const [rows] = await pool.query(
      `
      SELECT u.*, c.slug as company_slug, c.id as company_id, c.name as company_name,
             r.name as role_name, t.name as team_name
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN teams t ON u.team_id = t.id
      WHERE u.email = ?
    `,
      [email]
    );

    console.log("Found user data:", rows[0]);

    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Ensure the user belongs to the same company as the companySlug
    console.log(
      "Login attempt - User company_id:",
      user.company_id,
      "Request company (slug):",
      companySlug
    );

    // Check if user has company info (company_id FK)
    if (!user.company_id) {
      console.log("User has no company assigned:", user);
      return res
        .status(403)
        .json({ message: "User does not have a company assigned" });
    }

    console.log("Company comparison:", {
      userCompanyId: user.company_id,
      expectedCompanyId: companyRows[0].id,
      userCompanySlug: user.company_slug,
      correctCompanySlug,
      match: user.company_id === companyRows[0].id,
    });

    // Compare using company id
    if (user.company_id !== companyRows[0].id) {
      console.log("Company validation failed", {
        userCompanyId: user.company_id,
        requestedCompany: companySlug,
        expectedCompanyId: companyRows[0].id,
      });
      return res
        .status(403)
        .json({
          message: "User does not belong to this company",
          debug: {
            userCompanyId: user.company_id,
            requestedCompany: companySlug,
          },
        });
    }

    // Fetch role-based capability and features (permissions)
    // Fetch role-based capability and features (permissions)
    let capabilityRows = [];
    const roleName = user.role_name || user.role || null;
    const teamName = user.team_name || user.team || null;
    try {
      const [capRows] = await pool.query(
        `SELECT f.features_json, a.id as app_id 
         FROM features_capability f 
         JOIN role_capability r ON f.capability_id = r.capability_id 
         LEFT JOIN apps a ON r.company = ? AND a.slug = ?
         WHERE r.role = ? AND r.team = ? AND r.company = ?`,
        [correctCompanySlug, appSlug, roleName, teamName, correctCompanySlug]
      );
      capabilityRows = capRows;
    } catch (e) {
      // If capability tables are not present or query fails, continue without permissions
      console.warn(
        "Capability lookup failed or tables missing, continuing without uiPermissions:",
        e.message
      );
      capabilityRows = [];
    }

    let uiPermissions = [];
    let appAccess = [];

    if (capabilityRows.length > 0) {
      // Parse the JSON string from DB safely
      try {
        const features = JSON.parse(capabilityRows[0].features_json || "[]");

        // Filter only frontend features and attach app context
        uiPermissions = features
          .filter((f) => f.type === "frontend")
          .map((f) => ({
            ...f,
            appId: capabilityRows[0].app_id, // Attach app ID to each permission
          }));

        // Store app access information
        if (capabilityRows[0].app_id) {
          appAccess.push(capabilityRows[0].app_id);
        }
      } catch (e) {
        console.warn("Failed to parse features_json:", e.message);
      }
    }

    // Create JWT payload with user info and permissions
    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      team: user.team,
      company: companySlug || user.company,
      uiPermissions,
      appAccess, // Add list of accessible app IDs
    };

    const token = signToken(tokenPayload);

    // Send token as cookie. Use 'lax' on development to allow cross-port cookies; in production prefer 'strict' or 'none' with secure.
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 3600 * 1000,
    });
    // Determine the dashboard route based on user role
    let dashboardRoute = "/dashboard"; // default route

    switch (user.role?.toLowerCase()) {
      case "admin":
        dashboardRoute = "/admin/dashboard";
        break;
      case "user":
        dashboardRoute = "/user/dashboard";
        break;
      case "manager":
        dashboardRoute = "/manager/dashboard";
        break;
      // Add more role-based routes as needed
    }

    res.status(200).json({
      message: "Login successful",
      user: tokenPayload,
      dashboardRoute,
      company: {
        slug: correctCompanySlug,
        name: rows[0].company_name,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    // Include error.message during development to help debugging
    res
      .status(500)
      .json({ message: "Server error during login", error: err.message });
  }
};

// Verify token from cookie and return user payload (if valid)
export const verifyUser = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });
    const decoded = verifyToken(token);
    if (!decoded)
      return res.status(403).json({ message: "Invalid or expired token" });
    return res.status(200).json({ user: decoded });
  } catch (err) {
    console.error("Verify user error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
