const express = require("express");
const crypto = require("crypto");
const pool = require("../db/pool");
const { requireAdmin } = require("../middleware/adminAuth");
const email = require("../services/email");

const router = express.Router();

/** Owner inbox — all "Contact Owner" messages route here (apex). */
function getOwnerEmail() {
  return (
    process.env.OWNER_EMAIL ||
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    "apex2025.edu@gmail.com"
  );
}

async function saveAndNotifyContact({ name, fromEmail, message, subjectPrefix = "Contact" }) {
  const id = `msg-${crypto.randomUUID()}`;
  const taggedMessage = `[${subjectPrefix}] ${message}`;
  await pool.query(
    `INSERT INTO contact_messages (id, name, email, message) VALUES ($1,$2,$3,$4)`,
    [id, name, fromEmail, taggedMessage]
  );

  const ownerEmail = getOwnerEmail();
  try {
    await email.sendContactAlert({
      to: ownerEmail,
      name,
      email: fromEmail,
      message: taggedMessage,
      subject: `${subjectPrefix} from ${name}`,
    });
  } catch (err) {
    console.error("Failed to send contact alert email:", err.message);
  }

  return { ok: true };
}

router.post("/contact", async (req, res) => {
  const { name, email: fromEmail, message } = req.body;
  if (!name || !fromEmail || !message) return res.status(400).json({ error: "Name, email, and message are required." });

  try {
    await saveAndNotifyContact({ name, fromEmail, message, subjectPrefix: "General Contact" });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message." });
  }
});

/** Contact Owner — routes directly to apex owner inbox. */
router.post("/contact-owner", async (req, res) => {
  const { name, email: fromEmail, message } = req.body;
  if (!name || !fromEmail || !message) return res.status(400).json({ error: "Name, email, and message are required." });

  try {
    await saveAndNotifyContact({ name, fromEmail, message, subjectPrefix: "Contact Owner" });
    res.status(201).json({ ok: true, recipient: "apex" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message to owner." });
  }
});

router.get("/contact", requireAdmin, async (req, res) => {
  const result = await pool.query(`SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100`);
  res.json(result.rows);
});

function toNewsletterDTO(row) {
  return { id: row.id, email: row.email, phone: row.phone, createdAt: row.created_at };
}

/** Public: subscribe with email (required) and phone (optional). */
router.post("/newsletter", async (req, res) => {
  const { email: subEmail, phone = "" } = req.body;
  if (!subEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subEmail)) {
    return res.status(400).json({ error: "A valid email address is required." });
  }
  await pool.query(
    `INSERT INTO newsletter_subscribers (email, phone) VALUES ($1,$2)
     ON CONFLICT (email) DO UPDATE SET phone = COALESCE(EXCLUDED.phone, newsletter_subscribers.phone)`,
    [subEmail, phone || null]
  );
  res.status(201).json({ ok: true });
});

/** Admin: list all subscribers (Admin → Newsletter panel). */
router.get("/newsletter", requireAdmin, async (req, res) => {
  const result = await pool.query(`SELECT * FROM newsletter_subscribers ORDER BY created_at DESC`);
  res.json(result.rows.map(toNewsletterDTO));
});

router.delete("/newsletter/:id", requireAdmin, async (req, res) => {
  await pool.query(`DELETE FROM newsletter_subscribers WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;