const express = require("express");
const crypto = require("crypto");
const pool = require("../db/pool");
const { requireAdmin, parseCookies, isValidSession, COOKIE_NAME } = require("../middleware/adminAuth");

const router = express.Router();

function toDTO(row) {
  return { id: row.id, name: row.name, rating: row.rating, comment: row.comment, date: row.date, approved: row.approved, hidden: row.hidden };
}

// Public: only approved, non-hidden testimonials. Admin: everything (?all=true).
router.get("/", async (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const isAdmin = isValidSession(cookies[COOKIE_NAME]);

  const result =
    req.query.all === "true" && isAdmin
      ? await pool.query(`SELECT * FROM testimonials ORDER BY date DESC`)
      : await pool.query(`SELECT * FROM testimonials WHERE approved = true AND hidden = false ORDER BY date DESC`);

  res.json(result.rows.map(toDTO));
});

router.post("/", async (req, res) => {
  const { name, rating, comment } = req.body;
  if (!name || !rating || !comment) return res.status(400).json({ error: "Name, rating, and comment are required." });
  const id = `test-${crypto.randomUUID()}`;
  const result = await pool.query(
    `INSERT INTO testimonials (id, name, rating, comment, approved, hidden) VALUES ($1,$2,$3,$4,false,false) RETURNING *`,
    [id, name, rating, comment]
  );
  res.status(201).json(toDTO(result.rows[0]));
});

router.patch("/:id", requireAdmin, async (req, res) => {
  const { approved, hidden } = req.body;
  const result = await pool.query(
    `UPDATE testimonials SET approved = COALESCE($2, approved), hidden = COALESCE($3, hidden) WHERE id = $1 RETURNING *`,
    [req.params.id, approved, hidden]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "Testimonial not found." });
  res.json(toDTO(result.rows[0]));
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await pool.query(`DELETE FROM testimonials WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
