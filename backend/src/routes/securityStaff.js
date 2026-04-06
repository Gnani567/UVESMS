const { Router } = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../../db");
const { requireAuth, requireAdmin } = require("../middlewares/auth");

const router = Router();

// ─── GET /api/security-staff ─────────────────────────────────────────────────
router.get("/security-staff", requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        ss.id,
        ss.staff_id,
        ss.staff_name,
        ss.gate_assigned,
        ss.created_at,
        u.user_id
      FROM security_staff ss
      JOIN users u ON u.id = ss.user_id
      ORDER BY ss.staff_id
    `);

    const { rows: countRows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM security_staff"
    );

    res.json({
      staff: rows.map(toStaffJson),
      total: countRows[0]?.count ?? 0,
    });
  } catch (err) {
    console.error("GET /security-staff error:", err.message);
    res.status(500).json({ error: "Failed to fetch security staff" });
  }
});

// ─── POST /api/security-staff ────────────────────────────────────────────────
router.post("/security-staff", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { staffName, password, gateAssigned } = req.body;

    if (!staffName || !password) {
      return res.status(400).json({ error: "staffName and password are required" });
    }

    // Auto-generate sequential staff ID
    const { rows: countRows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM security_staff"
    );
    const staffId = `SEC${String((countRows[0]?.count ?? 0) + 1).padStart(3, "0")}`;

    // Make sure staffId is not already taken (edge case on concurrent inserts)
    const { rows: existing } = await pool.query(
      "SELECT id FROM security_staff WHERE staff_id = $1",
      [staffId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: `Staff ID ${staffId} already exists` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user row
    const { rows: userRows } = await pool.query(
      `INSERT INTO users (user_id, name, password, user_type)
       VALUES ($1, $2, $3, 'security_staff')
       RETURNING *`,
      [staffId, staffName, hashedPassword]
    );
    const user = userRows[0];

    // Create staff row
    const { rows: staffRows } = await pool.query(
      `INSERT INTO security_staff (staff_id, staff_name, gate_assigned, user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [staffId, staffName, gateAssigned || null, user.id]
    );

    res.status(201).json({
      id:           staffRows[0].id,
      staffId:      staffRows[0].staff_id,
      staffName:    staffRows[0].staff_name,
      gateAssigned: staffRows[0].gate_assigned,
      userId:       user.user_id,
      createdAt:    staffRows[0].created_at,
    });
  } catch (err) {
    console.error("POST /security-staff error:", err.message);
    res.status(500).json({ error: "Failed to create staff member" });
  }
});

// ─── GET /api/security-staff/:id ─────────────────────────────────────────────
router.get("/security-staff/:id", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ss.*, u.user_id
       FROM security_staff ss
       JOIN users u ON u.id = ss.user_id
       WHERE ss.id = $1`,
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    res.json(toStaffJson(rows[0]));
  } catch (err) {
    console.error("GET /security-staff/:id error:", err.message);
    res.status(500).json({ error: "Failed to fetch staff member" });
  }
});

// ─── PATCH /api/security-staff/:id ───────────────────────────────────────────
router.patch("/security-staff/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { staffName, gateAssigned, password } = req.body;

    const { rows: existing } = await pool.query(
      "SELECT * FROM security_staff WHERE id = $1",
      [req.params.id]
    );
    if (!existing[0]) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    const current = existing[0];
    const newName = staffName ?? current.staff_name;
    const newGate = gateAssigned !== undefined ? gateAssigned : current.gate_assigned;

    // Update staff row
    const { rows: staffRows } = await pool.query(
      `UPDATE security_staff
       SET staff_name = $1, gate_assigned = $2
       WHERE id = $3
       RETURNING *`,
      [newName, newGate, req.params.id]
    );

    // Update user name if changed
    if (staffName) {
      await pool.query("UPDATE users SET name = $1 WHERE id = $2", [
        staffName,
        current.user_id,
      ]);
    }

    // Update password if provided
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
        hash,
        current.user_id,
      ]);
    }

    const { rows: userRows } = await pool.query(
      "SELECT user_id FROM users WHERE id = $1",
      [current.user_id]
    );

    res.json({
      id:           staffRows[0].id,
      staffId:      staffRows[0].staff_id,
      staffName:    staffRows[0].staff_name,
      gateAssigned: staffRows[0].gate_assigned,
      userId:       userRows[0]?.user_id ?? "",
      createdAt:    staffRows[0].created_at,
    });
  } catch (err) {
    console.error("PATCH /security-staff/:id error:", err.message);
    res.status(500).json({ error: "Failed to update staff member" });
  }
});

// ─── DELETE /api/security-staff/:id ──────────────────────────────────────────
router.delete("/security-staff/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM security_staff WHERE id = $1",
      [req.params.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Deleting the user cascades to security_staff (FK ON DELETE CASCADE)
    await pool.query("DELETE FROM users WHERE id = $1", [rows[0].user_id]);

    res.sendStatus(204);
  } catch (err) {
    console.error("DELETE /security-staff/:id error:", err.message);
    res.status(500).json({ error: "Failed to delete staff member" });
  }
});

// ─── Helper ──────────────────────────────────────────────────────────────────
function toStaffJson(row) {
  return {
    id:           row.id,
    staffId:      row.staff_id,
    staffName:    row.staff_name,
    gateAssigned: row.gate_assigned,
    userId:       row.user_id,
    createdAt:    row.created_at,
  };
}

module.exports = router;
