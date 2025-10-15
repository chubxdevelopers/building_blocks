// Middleware to protect routes and verify JWT tokens

import { verifyToken } from "../utils/jwt.js";

export const protect = (req, res, next) => {
  try {
    const token = req.cookies.token; // Read JWT from cookies
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(403).json({ message: "Invalid or expired token" });

    req.user = decoded; // Attach decoded payload (user info + permissions)
    next();
  } catch (err) {
    res.status(500).json({ message: "Authentication failed" });
  }
};
