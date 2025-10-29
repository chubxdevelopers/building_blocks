import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { signToken, verifyToken } from "../utils/jwt.js";

// LOGIN controller
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    // Validate required fields early to prevent DB/query errors
    if (!email || !password) {
      console.log("Missing credentials on login attempt", { email, password });
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    // Determine current company/app from middleware (req.company) or params
    const companySlug = req.company?.slug || req.params?.company ||req.companySlug|| null;
    const appSlug = req.app?.slug || req.params?.appSlug || req.appSlug || null;

    // First verify the company exists and get the company details
    console.log("Verifying company slug:", companySlug);
    const [companys] = await pool.query(
      "SELECT  slug, name FROM companies WHERE slug = ?",
      [companySlug]
    );
    const [companysID] = await pool.query(
      "SELECT  id FROM companies WHERE slug = ?",
      [companySlug]
    );
     console.log("Company ID lookup result:", companysID);

    if (!companySlug || companys.length === 0) {
      console.log("[auth controller] Company not found:", companySlug);
      return res.status(404).json({ message: "Company not found" });
    }

    // Get the exact company slug from the database
    const correctCompanySlug = companys[0].slug;

    console.log("Request details:", {
      body: req.body,
      params: req.params,
      company: req.company,
      companySlug,
      correctCompanySlug,
      appSlug,
    });

    // Fetch the user row without joining other tables to avoid schema
    // mismatch errors (some deployments store company as slug, others
    // use company_id). We'll inspect the user row and compare against
    // the company we looked up above.
    const [rows] = await pool.query(`SELECT * FROM users WHERE email = ?`, [
      email,
    ]);

    console.log("Found user data:", rows[0]);

    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = rows[0];
    console.log("Verifying password for user:", user);
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Determine user's company value: prefer slug stored on users table
    const userCompanyId = user.company_id || null;
    const userCompanySlug = await pool.query(
      "SELECT slug FROM companies WHERE id = ? LIMIT 1",
      [user.company_id]
    ).then(([rows]) => (rows.length > 0 ? rows[0].slug : null));
    //.then(([rows]) => (rows.length > 0 ? rows[0].slug : null)); is used to fetch slug from company id

    console.log("Login attempt - user company values:", {
      userCompanySlug,
      userCompanyId,
      requestedCompanySlug: companySlug,
    });

    // If user has company slug, compare slugs. Else if user has company_id, compare ids.
    if (userCompanySlug) {
      if (userCompanySlug !== correctCompanySlug) {
        console.log("Company validation failed (slug mismatch)", {
          userCompanySlug,
          requestedCompany: companySlug,
          correctCompanySlug,
        });
        return res.status(403).json({
          message: "User does not belong to this company",
          debug: { userCompanySlug, requestedCompany: companySlug },
        });
      }
    } else if (userCompanyId) {
      if (userCompanyId !== companysID[0].id) {
        console.log("Company validation failed (id mismatch)", {
          userCompanyId,
          requestedCompany: companySlug,
          expectedCompanyId: companysID[0].id,
        });
        return res.status(403).json({
          message: "User does not belong to this company",
          debug: { userCompanyId, requestedCompany: companySlug },
        });
      }
    } else {
      console.log("User has no company info on record", { user });
      return res
        .status(403)
        .json({ message: "User does not have a company assigned" });
    }

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
      companyId: companysID && companysID[0] ? companysID[0].id : undefined,
      uiPermissions,
      appAccess, // Add list of accessible app IDs
    };

    let token;
    try {
      token = signToken(tokenPayload);
    } catch (e) {
      console.error(
        "Failed to sign JWT token:",
        e && e.message ? e.message : e
      );
      return res.status(500).json({
        message: "Server error: failed to create authentication token",
      });
    }

    // Send token as cookie
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 3600 * 1000,
    });

    // Determine the dashboard route based on user role
    const user_role=await pool.query(
      "SELECT name FROM roles WHERE id=? LIMIT 1",[user.role_id]).then(([rows]) => (rows.length > 0 ? rows[0].name : null));
    console.log("Determining dashboard route for role:", user_role);
    
    let dashboardRoute = `/${companySlug}/${appSlug}/${user_role}/dashboard`; // default route


    res.status(200).json({
      message: "Login successful",
      user: tokenPayload,
      token,
      dashboardRoute,
      company: {
        slug: correctCompanySlug,
        name: companys[0].name,
      },
      app: req.app,
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
    let token = req.cookies?.token;
    if (!token && req.headers && req.headers.authorization) {
      const auth = req.headers.authorization;
      if (typeof auth === "string" && auth.startsWith("Bearer ")) {
        token = auth.substring("Bearer ".length);
      }
    }
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
