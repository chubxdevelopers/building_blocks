import { verifyToken } from "../utils/jwt.js";

/**
 * Lightweight middleware to attach decoded JWT payload (if present) to req.jwt
 * so the queryBuilder's security injector can use it whether or not routes
 * are protected.
 */
export const attachJwt = (req, res, next) => {
  try {
    let token = null;
    if (req.cookies && req.cookies.token) token = req.cookies.token;
    if (!token && req.headers && req.headers.authorization) {
      const auth = req.headers.authorization;
      if (typeof auth === "string" && auth.startsWith("Bearer ")) {
        token = auth.substring("Bearer ".length);
      }
    }

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) req.jwt = decoded;
    }
  } catch (err) {
    // Don't block requests for token problems; downstream auth middleware
    // will enforce authentication where needed.
    console.warn("attachJwt: failed to decode token", err);
  }

  return next();
};

export default attachJwt;
