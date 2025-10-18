import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { signToken } from "../utils/jwt.js";

// LOGIN controller
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    // If route is mounted under /api/:appSlug/auth, appSlug will be available
    const appSlug =
      req.params && req.params.appSlug ? req.params.appSlug : null;
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Ensure the user belongs to the same company as the app slug
    if (appSlug && user.company !== appSlug) {
      return res
        .status(403)
        .json({ message: "User does not belong to this app/company" });
    }

    // Fetch role-based capability and features (permissions)
    const [capabilityRows] = await pool.query(
      "SELECT f.features_json FROM feature_capability f JOIN role_capability r ON f.capability_id = r.capability_id WHERE r.role = ? AND r.team = ? AND r.company = ?",
      [user.role, user.team, user.company]
    );

    let uiPermissions = [];

    if (capabilityRows.length > 0) {
      // Parse the JSON string from DB
      const features = JSON.parse(capabilityRows[0].features_json);

      // Filter only frontend features
      uiPermissions = features.filter((f) => f.type === "frontend");
    }

    // Create JWT payload with user info and permissions
    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      team: user.team,
      company: user.company,
      uiPermissions,
    };

    const token = signToken(tokenPayload);

    // Send token as cookie
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
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
