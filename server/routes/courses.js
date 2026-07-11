const express = require("express");
const crypto = require("crypto");
const pool = require("../db/pool");
const { requireAdmin } = require("../middleware/adminAuth");

const router = express.Router();

function toDTO(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    instructorId: row.instructor_id,
    level: row.level,
    mode: row.mode,
    price: row.price,
    duration: row.duration,
    image: row.image,
    shortDesc: row.short_desc,
    fullDesc: row.full_desc,
    syllabus: row.syllabus,
  };
}

router.get("/", async (req, res) => {
  const result = await pool.query(`SELECT * FROM courses ORDER BY created_at`);
  res.json(result.rows.map(toDTO));
});

router.post("/", requireAdmin, async (req, res) => {
  const { title, category, instructorId, level = "", mode = "Online", price = 0, duration = "", image = "", shortDesc = "", fullDesc = "", syllabus = [] } = req.body;
  if (!title || !category) return res.status(400).json({ error: "Title and category are required." });
  const id = `course-${crypto.randomUUID()}`;
  const result = await pool.query(
    `INSERT INTO courses (id, title, category, instructor_id, level, mode, price, duration, image, short_desc, full_desc, syllabus)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [id, title, category, instructorId || null, level, mode, price, duration, image, shortDesc, fullDesc, JSON.stringify(syllabus)]
  );
  res.status(201).json(toDTO(result.rows[0]));
});

router.patch("/:id", requireAdmin, async (req, res) => {
  const { title, category, instructorId, level, mode, price, duration, image, shortDesc, fullDesc, syllabus } = req.body;
  const result = await pool.query(
    `UPDATE courses SET
       title = COALESCE($2, title), category = COALESCE($3, category), instructor_id = COALESCE($4, instructor_id),
       level = COALESCE($5, level), mode = COALESCE($6, mode), price = COALESCE($7, price),
       duration = COALESCE($8, duration), image = COALESCE($9, image), short_desc = COALESCE($10, short_desc),
       full_desc = COALESCE($11, full_desc), syllabus = COALESCE($12, syllabus)
     WHERE id = $1 RETURNING *`,
    [req.params.id, title, category, instructorId, level, mode, price, duration, image, shortDesc, fullDesc, syllabus ? JSON.stringify(syllabus) : null]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "Course not found." });
  res.json(toDTO(result.rows[0]));
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await pool.query(`DELETE FROM courses WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
