const express = require("express");
const crypto = require("crypto");
const pool = require("../db/pool");
const { requireAdmin } = require("../middleware/adminAuth");

const router = express.Router();

function toDTO(row) {
  return { id: row.id, courseId: row.course_id, instructorId: row.instructor_id, day: row.day, time: row.time_range };
}

router.get("/", async (req, res) => {
  const result = await pool.query(`SELECT * FROM schedule ORDER BY day`);
  res.json(result.rows.map(toDTO));
});

router.post("/", requireAdmin, async (req, res) => {
  const { courseId, instructorId, day, time } = req.body;
  if (!courseId || !day || !time) return res.status(400).json({ error: "Course, day, and time are required." });
  const id = `sched-${crypto.randomUUID()}`;
  const result = await pool.query(
    `INSERT INTO schedule (id, course_id, instructor_id, day, time_range) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [id, courseId, instructorId || null, day, time]
  );
  res.status(201).json(toDTO(result.rows[0]));
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await pool.query(`DELETE FROM schedule WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
