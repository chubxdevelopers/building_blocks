import bcrypt from "bcryptjs";
import { pool } from "../db.js";

// Add new user (Admin only)
export const addUser = async (req, res) => {
  try {
    const { name, email, password, role, team, company } = req.body;
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
    await pool.query("INSERT INTO features (feature_name, feature_tag, type) VALUES (?, ?, ?)", [
      feature_name,
      feature_tag,
      type,
    ]);
    res.status(201).json({ message: "Feature added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding feature" });
  }
};

// Add feature capability
export const addFeatureCapability = async (req, res) => {
  try {
    const { capability_id, features_json } = req.body;
    await pool.query("INSERT INTO features_capability (capability_id, features_json) VALUES (?, ?)", [
      capability_id,
      JSON.stringify(features_json),
    ]);
    res.status(201).json({ message: "Capability added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding capability" });
  }
};

// Map role-team-company to capability
export const addRoleCapability = async (req, res) => {
  try {
    const { role, team, company, capability_id } = req.body;
    await pool.query(
      "INSERT INTO role_capability (role, team, company, capability_id) VALUES (?, ?, ?, ?)",
      [role, team, company, capability_id]
    );
    res.status(201).json({ message: "Role-capability mapping added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error mapping role-capability" });
  }
};
