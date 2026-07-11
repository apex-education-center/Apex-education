const express = require("express");
const { requireAdmin } = require("../middleware/adminAuth");
const calendarService = require("../services/googleCalendar");

const router = express.Router();

// Admin clicks "Connect Google Calendar" in the dashboard, which hits this route.
router.get("/google", requireAdmin, (req, res) => {
  try {
    res.redirect(calendarService.getAuthUrl());
  } catch (err) {
    res.status(500).send(`<p>${err.message}</p><p><a href="/dashboard.html">Back to dashboard</a></p>`);
  }
});

// Google redirects back here with a one-time code after the admin grants access.
// Protected by the same admin session cookie (SameSite=Lax allows it to survive
// the top-level redirect through Google's consent screen and back).
router.get("/google/callback", requireAdmin, async (req, res) => {
  const { code, error } = req.query;
  if (error) {
    return res.send(`<p>Google Calendar authorization was cancelled: ${error}</p><p><a href="/dashboard.html">Back to dashboard</a></p>`);
  }
  try {
    await calendarService.handleOAuthCallback(code);
    res.send(`<p>Google Calendar connected successfully. You can close this tab.</p><script>setTimeout(() => window.location.href = "/dashboard.html", 1500)</script>`);
  } catch (err) {
    res.status(500).send(`<p>${err.message}</p><p><a href="/dashboard.html">Back to dashboard</a></p>`);
  }
});

module.exports = router;
