const crypto = require("crypto");

const COOKIE_NAME = "apex_admin_session";
const MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours

function sign(value) {
  return crypto.createHmac("sha256", process.env.ADMIN_SESSION_SECRET || "dev-secret-change-me").update(value).digest("hex");
}

function createSessionCookie() {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${sign(issuedAt)}`;
}

function isValidSession(value) {
  if (!value) return false;
  const [issuedAt, signature] = value.split(".");
  if (!issuedAt || !signature) return false;
  if (sign(issuedAt) !== signature) return false;
  return Date.now() - Number(issuedAt) < MAX_AGE_MS;
}

function parseCookies(header) {
  const out = {};
  (header || "").split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    out[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  });
  return out;
}

function requireAdmin(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  if (!isValidSession(cookies[COOKIE_NAME])) {
    return res.status(401).json({ error: "Unauthorized. Please log in again." });
  }
  next();
}

module.exports = { COOKIE_NAME, MAX_AGE_MS, createSessionCookie, isValidSession, parseCookies, requireAdmin };
