const express = require("express");
const crypto = require("crypto");
const pool = require("../db/pool");
const { requireAdmin } = require("../middleware/adminAuth");

const router = express.Router();

function toDTO(row) {
  return { id: row.id, title: row.title, message: row.message, date: row.date };
}

router.get("/", async (req, res) => {
  const result = await pool.query(`SELECT * FROM announcements ORDER BY date DESC`);
  res.json(result.rows.map(toDTO));
});

router.post("/", requireAdmin, async (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) return res.status(400).json({ error: "Title and message are required." });
  const id = `ann-${crypto.randomUUID()}`;
  const result = await pool.query(
    `INSERT INTO announcements (id, title, message) VALUES ($1,$2,$3) RETURNING *`,
    [id, title, message]
  );
  res.status(201).json(toDTO(result.rows[0]));
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await pool.query(`DELETE FROM announcements WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
