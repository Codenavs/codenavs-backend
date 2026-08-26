const express = require('express');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/* ---------- SETTINGS ---------- */
router.get('/settings', (req, res) => {
  const row = db.prepare('SELECT data FROM settings WHERE id = 1').get();
  res.json(JSON.parse(row.data));
});
router.put('/settings', requireAuth, (req, res) => {
  const current = JSON.parse(db.prepare('SELECT data FROM settings WHERE id = 1').get().data);
  const updated = { ...current, ...req.body };
  db.prepare('UPDATE settings SET data = ? WHERE id = 1').run(JSON.stringify(updated));
  res.json(updated);
});

/* ---------- SECTIONS (toggles + home page copy) ---------- */
router.get('/sections', (req, res) => {
  const row = db.prepare('SELECT data FROM sections WHERE id = 1').get();
  res.json(JSON.parse(row.data));
});
router.put('/sections', requireAuth, (req, res) => {
  const current = JSON.parse(db.prepare('SELECT data FROM sections WHERE id = 1').get().data);
  const updated = { ...current, ...req.body };
  db.prepare('UPDATE sections SET data = ? WHERE id = 1').run(JSON.stringify(updated));
  res.json(updated);
});

/* ---------- ABOUT ---------- */
router.get('/about', (req, res) => {
  const about = db.prepare('SELECT story, mission, vision FROM about WHERE id = 1').get();
  const values = db.prepare('SELECT id, title, text FROM about_values ORDER BY sort_order').all();
  res.json({ ...about, values });
});
router.put('/about', requireAuth, (req, res) => {
  const { story, mission, vision, values } = req.body || {};
  db.prepare('UPDATE about SET story = ?, mission = ?, vision = ? WHERE id = 1').run(story, mission, vision);
  if (Array.isArray(values)) {
    db.prepare('DELETE FROM about_values').run();
    const insert = db.prepare('INSERT INTO about_values (title, text, sort_order) VALUES (?, ?, ?)');
    values.forEach((v, i) => insert.run(v.title, v.text, i));
  }
  res.json({ ok: true });
});

/* ---------- INDUSTRIES ---------- */
router.get('/industries', (req, res) => {
  res.json(db.prepare('SELECT id, name, icon FROM industries ORDER BY sort_order').all());
});
router.put('/industries', requireAuth, (req, res) => {
  const items = req.body || [];
  db.prepare('DELETE FROM industries').run();
  const insert = db.prepare('INSERT INTO industries (name, icon, sort_order) VALUES (?, ?, ?)');
  items.forEach((it, i) => insert.run(it.name, it.icon, i));
  res.json({ ok: true });
});

/* ---------- PARTNERS (used in the All Services Overview section) ---------- */
router.get('/partners', (req, res) => {
  res.json(db.prepare('SELECT id, name, description, icon FROM partners ORDER BY sort_order').all());
});
router.put('/partners', requireAuth, (req, res) => {
  const items = req.body || [];
  db.prepare('DELETE FROM partners').run();
  const insert = db.prepare('INSERT INTO partners (name, description, icon, sort_order) VALUES (?, ?, ?, ?)');
  items.forEach((it, i) => insert.run(it.name, it.description, it.icon, i));
  res.json({ ok: true });
});

module.exports = router;
