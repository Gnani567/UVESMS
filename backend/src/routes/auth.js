const { Router } = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../../db");
const { requireAuth } = require("../middlewares/auth");

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "uvesms-secret-key-2024";

// ─── POST /login ─────────────────────────────────────────────────────────────
// Body: { userId, password }
// Returns: { token, user: { userId, name, role, gateAssigned } }
router.post("/login", async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ error: "userId and password are required" });
    }

    // Look up user
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [userId]
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Fetch profile details based on role
    let name = user.name;
    let gateAssigned = null;
    let email = null;

    if (user.user_type === "admin") {
      const { rows: adminRows } = await pool.query(
        "SELECT admin_name, email FROM admin WHERE user_id = $1",
        [user.id]
      );
      if (adminRows[0]) {
        name = adminRows[0].admin_name;
        email = adminRows[0].email;
      }
    } else if (user.user_type === "security_staff") {
      const { rows: staffRows } = await pool.query(
        "SELECT staff_name, gate_assigned FROM security_staff WHERE user_id = $1",
        [user.id]
      );
      if (staffRows[0]) {
        name = staffRows[0].staff_name;
        gateAssigned = staffRows[0].gate_assigned;
      }
    }

    // Sign JWT — use same secret as middleware
    const token = jwt.sign(
      { userId: user.user_id, role: user.user_type, dbId: user.id },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        userId: user.user_id,
        name,
        role: user.user_type,
        email,
        gateAssigned,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /me ──────────────────────────────────────────────────────────────────
// FIX: was "/auth/me" which when mounted at "/api" became "/api/auth/me" — but
// index.js mounts this router at BOTH "/" and "/api".  Keeping it as "/me"
// means it is reachable as both GET /me AND GET /api/me.
// The frontend calls GET /api/auth/me, so we expose that path separately below.
router.get("/me", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [req.user.dbId]
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    let name = user.name;
    let gateAssigned = null;
    let email = null;

    if (user.user_type === "admin") {
      const { rows: adminRows } = await pool.query(
        "SELECT admin_name, email FROM admin WHERE user_id = $1",
        [user.id]
      );
      if (adminRows[0]) {
        name = adminRows[0].admin_name;
        email = adminRows[0].email;
      }
    } else if (user.user_type === "security_staff") {
      const { rows: staffRows } = await pool.query(
        "SELECT staff_name, gate_assigned FROM security_staff WHERE user_id = $1",
        [user.id]
      );
      if (staffRows[0]) {
        name = staffRows[0].staff_name;
        gateAssigned = staffRows[0].gate_assigned;
      }
    }

    res.json({
      userId: user.user_id,
      name,
      role: user.user_type,
      email,
      gateAssigned,
    });
  } catch (err) {
    console.error("GET /me error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Alias so both /api/me and /api/auth/me work (frontend uses the latter)
router.get("/auth/me", requireAuth, (req, res, next) => {
  // reuse the same handler by delegating
  req.url = "/me";
  router.handle(req, res, next);
});

module.exports = router;
