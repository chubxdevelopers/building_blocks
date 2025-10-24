import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { signToken } from "../utils/jwt.js";

// LOGIN controller
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Determine current company/app from middleware (req.company) or params
    const companySlug = req.company?.slug || req.params?.company || null;
    const appSlug = req.app?.slug || req.params?.appSlug || null;

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Ensure the user belongs to the same company as the companySlug
    if (companySlug && user.company !== companySlug) {
      return res
        .status(403)
        .json({ message: "User does not belong to this company" });
    }

    // Fetch role-based capability and features (permissions)
    const [capabilityRows] = await pool.query(
      `SELECT f.features_json, a.id as app_id 
       FROM feature_capability f 
       JOIN role_capability r ON f.capability_id = r.capability_id 
       LEFT JOIN apps a ON r.company = ? AND a.slug = ?
       WHERE r.role = ? AND r.team = ? AND r.company = ?`,
      [
        companySlug || user.company,
        appSlug,
        user.role,
        user.team,
        companySlug || user.company,
      ]
    );

    let uiPermissions = [];
    let appAccess = [];

    if (capabilityRows.length > 0) {
      // Parse the JSON string from DB
      const features = JSON.parse(capabilityRows[0].features_json);

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
    res.status(200).json({ message: "Login successful", user: tokenPayload });
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
