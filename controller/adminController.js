import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { signToken } from "../utils/jwt.js";

// Add new user (Admin only)
export const addUser = async (req, res) => {
  try {
    const { name, email, password, role, team } = req.body;
    // Prefer company from body, fall back to middleware-detected company slug
    const company = req.body.company || req.company?.slug || null;
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password, role, team, company) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, hashedPassword, role, team, company]
    );

    res.status(201).json({ message: "User added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding user" });
  }
};

// Add feature
export const addFeature = async (req, res) => {
  try {
    const { feature_name, feature_tag, type } = req.body;
    await pool.query(
      "INSERT INTO features (feature_name, feature_tag, type) VALUES (?, ?, ?)",
      [feature_name, feature_tag, type]
    );
    res.status(201).json({ message: "Feature added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding feature" });
  }
};

// Get list of features
export const getFeatures = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, feature_name, feature_tag, type FROM features"
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching features" });
  }
};

// Add feature capability
export const addFeatureCapability = async (req, res) => {
  try {
    const { capability_id, features_json } = req.body;
    await pool.query(
      "INSERT INTO feature_capability (capability_id, features_json) VALUES (?, ?)",
      [capability_id, JSON.stringify(features_json)]
    );
    res.status(201).json({ message: "Capability added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding capability" });
  }
};

// Get capabilities (feature_capability)
export const getCapabilities = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT capability_id as id, features_json FROM feature_capability"
    );
    // parse features_json for convenience
    const parsed = rows.map((r) => ({
      id: r.id,
      features: JSON.parse(r.features_json),
    }));
    res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching capabilities" });
  }
};

// Get roles list
export const getRoles = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name FROM roles");
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching roles" });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Inferred company from middleware or request body
    const company = req.body.company || req.company?.slug || null;
    const hashedPassword = await bcrypt.hash(password, 10);
    const role = "admin";
    const team = null; // Admin might not belong to a specific team
    await pool.query(
      "INSERT INTO users (name, email, password, role, team, company) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, hashedPassword, role, team, company]
    );
    const tokenPayload = {
      name,
      email,
      role,
      company,
    };

    const token = signToken(tokenPayload);

    // Send token as cookie. Use 'lax' on development to allow cross-port cookies; in production prefer 'strict' or 'none' with secure.
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 3600 * 1000,
    });
    res
      .status(200)
      .json({ message: "register successful", user: tokenPayload });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error registering admin", error: err.message });
  }
};

// Map role-team-company to capability
export const addRoleCapability = async (req, res) => {
  try {
    const { role, team, capability_id } = req.body;
    const company = req.body.company || req.company?.slug || null;
    await pool.query(
      "INSERT INTO role_capability (role, team, company, capability_id) VALUES (?, ?, ?, ?)",
      [role, team, company, capability_id]
    );
    res
      .status(201)
      .json({ message: "Role-capability mapping added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error mapping role-capability" });
  }
};
