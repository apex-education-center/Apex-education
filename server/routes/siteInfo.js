const express = require("express");
const crypto = require("crypto");
const pool = require("../db/pool");
const { requireAdmin } = require("../middleware/adminAuth");

const router = express.Router();

router.get("/site-info", async (req, res) => {
  const result = await pool.query(`SELECT value FROM site_settings WHERE key = 'siteInfo'`);
  res.json(result.rows[0]?.value || {});
});

router.patch("/site-info", requireAdmin, async (req, res) => {
  const current = await pool.query(`SELECT value FROM site_settings WHERE key = 'siteInfo'`);
  const merged = { ...(current.rows[0]?.value || {}), ...req.body };
  await pool.query(
    `INSERT INTO site_settings (key, value) VALUES ('siteInfo', $1) ON CONFLICT (key) DO UPDATE SET value = $1`,
    [JSON.stringify(merged)]
  );
  res.json(merged);
});

router.get("/stats", async (req, res) => {
  const result = await pool.query(`SELECT value FROM site_settings WHERE key = 'stats'`);
  res.json(result.rows[0]?.value || {});
});

router.patch("/stats", requireAdmin, async (req, res) => {
  const current = await pool.query(`SELECT value FROM site_settings WHERE key = 'stats'`);
  const merged = { ...(current.rows[0]?.value || {}), ...req.body };
  await pool.query(
    `INSERT INTO site_settings (key, value) VALUES ('stats', $1) ON CONFLICT (key) DO UPDATE SET value = $1`,
    [JSON.stringify(merged)]
  );
  res.json(merged);
});

router.get("/categories", async (req, res) => {
  const result = await pool.query(`SELECT id, name, icon FROM categories ORDER BY name`);
  res.json(result.rows);
});

router.post("/categories", requireAdmin, async (req, res) => {
  const { name, icon = "book" } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required." });
  const id = `category-${crypto.randomUUID()}`;
  const result = await pool.query(
    `INSERT INTO categories (id, name, icon) VALUES ($1,$2,$3) RETURNING id, name, icon`,
    [id, name, icon]
  );
  res.status(201).json(result.rows[0]);
});

router.patch("/categories/:id", requireAdmin, async (req, res) => {
  const { name, icon } = req.body;
  const result = await pool.query(
    `UPDATE categories SET name = COALESCE($2, name), icon = COALESCE($3, icon)
     WHERE id = $1 RETURNING id, name, icon`,
    [req.params.id, name, icon]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "Category not found." });
  res.json(result.rows[0]);
});

router.delete("/categories/:id", requireAdmin, async (req, res) => {
  await pool.query(`DELETE FROM categories WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;