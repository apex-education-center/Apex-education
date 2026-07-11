const express = require("express");
const crypto = require("crypto");
const pool = require("../db/pool");
const { requireAdmin } = require("../middleware/adminAuth");

const router = express.Router();

function toDTO(row) {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    email: row.email,
    experience: row.experience,
    bio: row.bio,
    photo: row.photo,
  };
}

router.get("/", async (req, res) => {
  const result = await pool.query(`SELECT * FROM instructors ORDER BY name`);
  res.json(result.rows.map(toDTO));
});

router.post("/", requireAdmin, async (req, res) => {
  const { name, subject, email, experience = "", bio = "", photo = "" } = req.body;
  if (!name || !subject || !email) return res.status(400).json({ error: "Name, subject, and email are required." });
  const id = `instr-${crypto.randomUUID()}`;
  const result = await pool.query(
    `INSERT INTO instructors (id, name, subject, email, experience, bio, photo) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [id, name, subject, email, experience, bio, photo]
  );
  res.status(201).json(toDTO(result.rows[0]));
});

router.patch("/:id", requireAdmin, async (req, res) => {
  const { name, subject, email, experience, bio, photo } = req.body;
  const result = await pool.query(
    `UPDATE instructors SET
       name = COALESCE($2, name), subject = COALESCE($3, subject), email = COALESCE($4, email),
       experience = COALESCE($5, experience), bio = COALESCE($6, bio), photo = COALESCE($7, photo)
     WHERE id = $1 RETURNING *`,
    [req.params.id, name, subject, email, experience, bio, photo]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "Instructor not found." });
  res.json(toDTO(result.rows[0]));
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await pool.query(`DELETE FROM instructors WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
