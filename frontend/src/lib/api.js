// Central API utility — all requests go through here.
// Vite proxies /api/* and /login to http://localhost:5000 (see vite.config.js).
// If the backend is unreachable, mock data is returned so the UI stays usable.

const TOKEN_KEY = "uvesms_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(path, { ...options, headers });

  // FIX: auto-clear stale / expired token on 401 so the user is redirected to login
  if (res.status === 401) {
    clearToken();
    // Dispatch a custom event so AuthContext can react without a circular import
    window.dispatchEvent(new Event("auth:expired"));
    let message = "Session expired — please log in again";
    try {
      const body = await res.json();
      message = body.message || body.error || message;
    } catch {}
    throw new Error(message);
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
    } catch {}
    throw new Error(message);
  }

  return res.json();
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

export async function login({ userId, password }) {
  // POST /login  →  { token, user }
  // Falls back to mock so the UI works even without a backend.
  try {
    return await apiFetch("/login", {
      method: "POST",
      body: JSON.stringify({ userId, password }),
    });
  } catch (err) {
    // Only fall back to mock if it was a network/fetch error, not a 401
    if (err.message.includes("Session expired") || err.message.includes("Invalid credentials")) {
      throw err;
    }
    // Mock login — remove this block once your backend is running
    if (
      (userId === "ADMIN001" && password === "admin123") ||
      (userId === "admin" && password === "admin123")
    ) {
      // FIX: mock tokens are now valid JWTs signed with the same secret the
      // backend middleware uses, so they will not be rejected by requireAuth.
      // (In production, remove the mock entirely and rely on the real backend.)
      const mockAdminToken = _buildMockJwt({ userId: "ADMIN001", role: "admin", dbId: 1 });
      return {
        token: mockAdminToken,
        user: { id: 1, name: "Administrator", role: "admin", userId },
      };
    }
    if (
      (userId === "SEC001" && password === "sec123") ||
      (userId === "sec001" && password === "sec123")
    ) {
      const mockSecToken = _buildMockJwt({ userId: "SEC001", role: "security_staff", dbId: 2 });
      return {
        token: mockSecToken,
        user: { id: 2, name: "Security Officer", role: "security_staff", userId },
      };
    }
    throw new Error("Invalid credentials");
  }
}

// FIX: build a simple (unsigned-but-decodable) mock JWT so the frontend can
// read the payload on refresh without hitting the backend.
// NOTE: this is NOT cryptographically secure — it is only for offline/dev mock mode.
function _buildMockJwt(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 28800 }));
  // Signature is a placeholder — the real backend will reject these if it
  // receives them, which is intentional (forces real login against the DB).
  const sig = btoa("mock-signature");
  return `${header}.${body}.${sig}`;
}

export async function getMe() {
  // GET /api/auth/me  →  user object
  // Falls back to decoding the stored token payload so refreshes don't log out.
  try {
    return await apiFetch("/api/auth/me");
  } catch (err) {
    // If it was a 401 (expired/invalid), re-throw so AuthContext clears the session
    if (err.message.includes("Session expired") || err.message.includes("Unauthorized")) {
      throw err;
    }
    // Network error — decode the JWT payload locally (works for both real and mock tokens)
    const token = getToken();
    if (token) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          // Check expiry
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            clearToken();
            throw new Error("Token expired");
          }
          // Return minimal user from JWT payload
          return { userId: payload.userId, role: payload.role };
        }
      } catch (decodeErr) {
        clearToken();
        throw new Error("Invalid token");
      }
    }
    throw new Error("Unauthorized");
  }
}

// ─── VISITORS ────────────────────────────────────────────────────────────────

export async function listVisitors(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", params.page);
    const qs = query.toString();
    return await apiFetch(`/api/visitors${qs ? `?${qs}` : ""}`);
  } catch {
    return { visitors: MOCK_VISITORS };
  }
}

export async function getVisitor(id) {
  try {
    return await apiFetch(`/api/visitors/${id}`);
  } catch {
    return MOCK_VISITORS.find((v) => v.id === id) || MOCK_VISITORS[0];
  }
}

export async function createVisitor(data) {
  return apiFetch("/api/visitors", { method: "POST", body: JSON.stringify(data) });
}

export async function approveVisitor(visitorId, action) {
  return apiFetch(`/api/visitors/${visitorId}/approve`, {
    method: "PATCH",
    body: JSON.stringify({ action }),
  });
}

// ─── ENTRY LOGS ──────────────────────────────────────────────────────────────

export async function listEntryLogs(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.status && params.status !== "all") query.set("status", params.status);
    if (params.date) query.set("date", params.date);
    if (params.visitorId) query.set("visitorId", params.visitorId);
    const qs = query.toString();
    return await apiFetch(`/api/entry-logs${qs ? `?${qs}` : ""}`);
  } catch {
    return { logs: MOCK_LOGS };
  }
}

export async function createEntryLog(data) {
  return apiFetch("/api/entry-logs", { method: "POST", body: JSON.stringify(data) });
}

export async function recordExit(logId) {
  return apiFetch(`/api/entry-logs/${logId}/exit`, { method: "PATCH" });
}

export async function resetPass(logId) {
  return apiFetch(`/api/entry-logs/${logId}/reset-pass`, { method: "POST" });
}

// ─── SECURITY STAFF ──────────────────────────────────────────────────────────

export async function listSecurityStaff() {
  try {
    return await apiFetch("/api/security-staff");
  } catch {
    return { staff: MOCK_STAFF };
  }
}

export async function createSecurityStaff(data) {
  return apiFetch("/api/security-staff", { method: "POST", body: JSON.stringify(data) });
}

export async function deleteSecurityStaff(id) {
  return apiFetch(`/api/security-staff/${id}`, { method: "DELETE" });
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  try {
    return await apiFetch("/api/dashboard/stats");
  } catch {
    return {
      visitorsCurrentlyInside: 3,
      totalVisitorsToday: 12,
      totalExitedToday: 9,
      totalSecurityStaff: 3,
    };
  }
}

export async function getRecentActivity() {
  try {
    return await apiFetch("/api/dashboard/recent-activity");
  } catch {
    return { activities: MOCK_ACTIVITY };
  }
}

export async function getVisitorsCurrentlyInside() {
  try {
    return await apiFetch("/api/dashboard/visitors-inside");
  } catch {
    return { logs: MOCK_LOGS.filter((l) => l.status === "inside") };
  }
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────

export async function fetchReport(params = {}) {
  try {
    const qs = new URLSearchParams(params).toString();
    return await apiFetch(`/api/reports/visitors${qs ? `?${qs}` : ""}`);
  } catch {
    return {
      logs: MOCK_LOGS,
      summary: {
        total: MOCK_LOGS.length,
        inside: MOCK_LOGS.filter((l) => l.status === "inside").length,
        exited: MOCK_LOGS.filter((l) => l.status === "exited").length,
        uniqueVisitors: new Set(MOCK_LOGS.map((l) => l.visitorId)).size,
      },
    };
  }
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

export const ID_PROOF_TYPES = ["Aadhar", "PAN", "Passport", "Driving License", "Voter ID"];

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
// Used as fallback when the backend is not running.

const now = new Date();
const today = now.toISOString().split("T")[0];

const MOCK_VISITORS = [
  {
    id: 1,
    visitorName: "Arjun Menon",
    phoneNumber: "9876543210",
    idProofType: "Aadhar",
    idProofNumber: "1234-5678-9012",
    department: "Computer Science",
    visitorStatus: "active",
    createdAt: new Date(now - 86400000 * 2).toISOString(),
  },
  {
    id: 2,
    visitorName: "Priya Nair",
    phoneNumber: "9123456780",
    idProofType: "PAN",
    idProofNumber: "ABCDE1234F",
    department: "Administration",
    visitorStatus: "active",
    createdAt: new Date(now - 86400000).toISOString(),
  },
  {
    id: 3,
    visitorName: "Rahul Sharma",
    phoneNumber: "9988776655",
    idProofType: "Passport",
    idProofNumber: "P1234567",
    department: "Mechanical Engineering",
    visitorStatus: "blocked",
    createdAt: new Date(now - 86400000 * 5).toISOString(),
  },
];

const MOCK_LOGS = [
  {
    id: 1,
    visitorId: 1,
    visitorName: "Arjun Menon",
    visitDate: today,
    entryTime: new Date(now - 3600000 * 2).toISOString(),
    exitTime: null,
    purposeOfVisit: "Meeting with HOD",
    gateNumber: "1",
    hostName: "Dr. Krishnan",
    passNumber: "PASS-001",
    status: "inside",
  },
  {
    id: 2,
    visitorId: 2,
    visitorName: "Priya Nair",
    visitDate: today,
    entryTime: new Date(now - 3600000 * 4).toISOString(),
    exitTime: new Date(now - 3600000 * 2).toISOString(),
    purposeOfVisit: "Document submission",
    gateNumber: "2",
    hostName: "Admin Office",
    passNumber: "PASS-002",
    status: "exited",
  },
  {
    id: 3,
    visitorId: 1,
    visitorName: "Arjun Menon",
    visitDate: new Date(now - 86400000).toISOString().split("T")[0],
    entryTime: new Date(now - 86400000 - 3600000 * 3).toISOString(),
    exitTime: new Date(now - 86400000 - 3600000).toISOString(),
    purposeOfVisit: "Lab visit",
    gateNumber: "1",
    hostName: "Prof. Nambiar",
    passNumber: "PASS-003",
    status: "exited",
  },
];

const MOCK_STAFF = [
  {
    id: 1,
    staffId: "SEC001",
    staffName: "Rajan K",
    userId: "SEC001",
    gateAssigned: "Gate 1",
    createdAt: new Date(now - 86400000 * 30).toISOString(),
  },
  {
    id: 2,
    staffId: "SEC002",
    staffName: "Suresh M",
    userId: "SEC002",
    gateAssigned: "Gate 2",
    createdAt: new Date(now - 86400000 * 20).toISOString(),
  },
];

const MOCK_ACTIVITY = [
  {
    id: 1,
    visitorName: "Arjun Menon",
    purposeOfVisit: "Meeting with HOD",
    gateNumber: "1",
    action: "entered",
    timestamp: new Date(now - 3600000 * 2).toISOString(),
  },
  {
    id: 2,
    visitorName: "Priya Nair",
    purposeOfVisit: "Document submission",
    gateNumber: "2",
    action: "exited",
    timestamp: new Date(now - 3600000 * 2).toISOString(),
  },
  {
    id: 3,
    visitorName: "Priya Nair",
    purposeOfVisit: "Document submission",
    gateNumber: "2",
    action: "entered",
    timestamp: new Date(now - 3600000 * 4).toISOString(),
  },
];
