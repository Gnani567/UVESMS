// =============================================================
// UVESMS Backend — index.js (FIXED VERSION)
// =============================================================

const express = require("express");
const cors    = require("cors");
const pool    = require("./db");

// Route modules
const authRoutes         = require("./src/routes/auth");
const visitorRoutes      = require("./src/routes/visitors");
const staffRoutes        = require("./src/routes/securityStaff");
const entryLogRoutes     = require("./src/routes/entryLogs");
const dashboardRoutes    = require("./src/routes/dashboard");
const reportRoutes       = require("./src/routes/reports");

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method}  ${req.path}`);
  next();
});

// ─── Health ───────────────────────────────────────────────────

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "UVESMS backend running 🚀" });
});

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(503).json({ status: "error", database: err.message });
  }
});

// ─── AUTH ─────────────────────────────────────────────────────

// supports BOTH:
// POST /login
// POST /api/login
app.use("/", authRoutes);
app.use("/api", authRoutes);

// ─── MAIN ROUTES (FIXED) ──────────────────────────────────────

// ORIGINAL (kept)
app.use("/api", visitorRoutes);
app.use("/api", staffRoutes);
app.use("/api", entryLogRoutes);

// 🔥 NEW (compatibility for your frontend)
app.use("/visitors", visitorRoutes);
app.use("/staff", staffRoutes);
app.use("/logs", entryLogRoutes);

// ─── OTHER ROUTES ─────────────────────────────────────────────

app.use("/api", dashboardRoutes);
app.use("/api", reportRoutes);

// ─── 404 ─────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`
  });
});

// ─── ERROR HANDLER ────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ─── START ────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n✅ Backend running → http://localhost:${PORT}`);
});
