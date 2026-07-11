const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db/pool");
const { requireAdmin, createSessionCookie, COOKIE_NAME, MAX_AGE_MS } = require("../middleware/adminAuth");
const calendarService = require("../services/googleCalendar");

const router = express.Router();

async function getPasswordHash() {
  const result = await pool.query(`SELECT value FROM site_settings WHERE key = 'adminPasswordHash'`);
  if (result.rows[0]) return result.rows[0].value;
  // First run: seed from ADMIN_PASSWORD env var (or a safe default), then store the hash.
  const initial = process.env.ADMIN_PASSWORD || "admin123";
  const hash = await bcrypt.hash(initial, 10);
  await pool.query(`INSERT INTO site_settings (key, value) VALUES ('adminPasswordHash', $1) ON CONFLICT (key) DO NOTHING`, [
    JSON.stringify(hash),
  ]);
  return hash;
}

router.post("/login", async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password is required." });

  const hash = await getPasswordHash();
  const valid = await bcrypt.compare(password, hash);
  if (!valid) return res.status(401).json({ error: "Incorrect password." });

  const cookieValue = createSessionCookie();
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(cookieValue)}; HttpOnly; Max-Age=${MAX_AGE_MS / 1000}; Path=/; SameSite=Lax`);
  res.json({ ok: true });
});

router.post("/logout", (req, res) => {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; Max-Age=0; Path=/; SameSite=Lax`);
  res.json({ ok: true });
});

router.post("/change-password", requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: "Current password and a new password (4+ characters) are required." });
  }
  const hash = await getPasswordHash();
  const valid = await bcrypt.compare(currentPassword, hash);
  if (!valid) return res.status(401).json({ error: "Current password is incorrect." });

  const newHash = await bcrypt.hash(newPassword, 10);
  await pool.query(`UPDATE site_settings SET value = $1 WHERE key = 'adminPasswordHash'`, [JSON.stringify(newHash)]);
  res.json({ ok: true });
});

router.get("/google-status", requireAdmin, async (req, res) => {
  const connected = await calendarService.isCalendarConnected();
  res.json({ connected });
});

module.exports = router;
