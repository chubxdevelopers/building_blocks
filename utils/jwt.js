// Utility functions for signing and verifying JWT tokens

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const signToken = (payload) => {
  // Generate JWT token using user info as payload
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token) => {
  // Verify and decode JWT token
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};
