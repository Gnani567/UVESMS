const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "uvesms-secret-key-2024";

/**
 * Verifies the Bearer token and attaches req.user = { userId, role, dbId }.
 * Returns 401 if missing or invalid.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized — missing token" });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, role, dbId }
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Must be used AFTER requireAuth.
 * Returns 403 if the logged-in user is not an admin.
 */
function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
