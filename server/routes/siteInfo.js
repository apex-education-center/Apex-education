const express = require("express");
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

module.exports = router;
