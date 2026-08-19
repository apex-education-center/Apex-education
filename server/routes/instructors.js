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
    modes: row.modes || [],
    location: row.location,
    availability: row.availability,
    bac: row.bac || [],
    teachingLanguages: row.teaching_languages || [],
  };
}

router.get("/", async (req, res) => {
  const result = await pool.query(`SELECT * FROM instructors ORDER BY name`);
  res.json(result.rows.map(toDTO));
});

router.post("/", requireAdmin, async (req, res) => {
  const {
    name, subject, email = "", experience = "", bio = "", photo = "",
    modes = [], location = "", availability = "", bac = [], teachingLanguages = [],
  } = req.body;
  // Email is now optional — only name and subject are required.
  if (!name || !subject) return res.status(400).json({ error: "Name and subject are required." });
  const id = `instr-${crypto.randomUUID()}`;
  const result = await pool.query(
    `INSERT INTO instructors (id, name, subject, email, experience, bio, photo, modes, location, availability, bac, teaching_languages)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [
      id, name, subject, email || null, experience, bio, photo,
      JSON.stringify(modes), location, availability, JSON.stringify(bac), JSON.stringify(teachingLanguages),
    ]
  );
  res.status(201).json(toDTO(result.rows[0]));
});

router.patch("/:id", requireAdmin, async (req, res) => {
  const { name, subject, email, experience, bio, photo, modes, location, availability, bac, teachingLanguages } = req.body;
  const result = await pool.query(
    `UPDATE instructors SET
       name = COALESCE($2, name), subject = COALESCE($3, subject), email = $4,
       experience = COALESCE($5, experience), bio = COALESCE($6, bio), photo = COALESCE($7, photo),
       modes = COALESCE($8, modes), location = COALESCE($9, location), availability = COALESCE($10, availability),
       bac = COALESCE($11, bac), teaching_languages = COALESCE($12, teaching_languages)
     WHERE id = $1 RETURNING *`,
    [
      req.params.id, name, subject, email || null, experience, bio, photo,
      modes ? JSON.stringify(modes) : null, location, availability,
      bac ? JSON.stringify(bac) : null, teachingLanguages ? JSON.stringify(teachingLanguages) : null,
    ]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "Instructor not found." });
  res.json(toDTO(result.rows[0]));
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await pool.query(`DELETE FROM instructors WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;