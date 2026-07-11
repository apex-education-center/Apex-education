const express = require("express");
const crypto = require("crypto");
const pool = require("../db/pool");
const { requireAdmin } = require("../middleware/adminAuth");

const router = express.Router();

function toDTO(row) {
  return { id: row.id, question: row.question, answer: row.answer };
}

router.get("/", async (req, res) => {
  const result = await pool.query(`SELECT * FROM faqs ORDER BY question`);
  res.json(result.rows.map(toDTO));
});

router.post("/", requireAdmin, async (req, res) => {
  const { question, answer } = req.body;
  if (!question || !answer) return res.status(400).json({ error: "Question and answer are required." });
  const id = `faq-${crypto.randomUUID()}`;
  const result = await pool.query(
    `INSERT INTO faqs (id, question, answer) VALUES ($1,$2,$3) RETURNING *`,
    [id, question, answer]
  );
  res.status(201).json(toDTO(result.rows[0]));
});

router.patch("/:id", requireAdmin, async (req, res) => {
  const { question, answer } = req.body;
  const result = await pool.query(
    `UPDATE faqs SET question = COALESCE($2, question), answer = COALESCE($3, answer) WHERE id = $1 RETURNING *`,
    [req.params.id, question, answer]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "FAQ not found." });
  res.json(toDTO(result.rows[0]));
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await pool.query(`DELETE FROM faqs WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
