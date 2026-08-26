const express = require('express');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const md = db.prepare('SELECT name, role, photo, bio FROM team_md WHERE id = 1').get();
  const members = db.prepare('SELECT * FROM team_members ORDER BY sort_order').all();
  res.json({ md, members });
});

router.put('/md', requireAuth, (req, res) => {
  const { name, role, photo, bio } = req.body || {};
  db.prepare('UPDATE team_md SET name = ?, role = ?, photo = COALESCE(?, photo), bio = ? WHERE id = 1')
    .run(name, role, photo, bio);
  res.json({ ok: true });
});

router.post('/members', requireAuth, (req, res) => {
  const { name, role, photo, bio } = req.body || {};
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) m FROM team_members').get().m;
  const info = db.prepare('INSERT INTO team_members (name, role, photo, bio, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(name, role, photo || '', bio, maxOrder + 1);
  res.status(201).json({ id: info.lastInsertRowid });
});

router.put('/members/:id', requireAuth, (req, res) => {
  const { name, role, photo, bio } = req.body || {};
  db.prepare('UPDATE team_members SET name = ?, role = ?, photo = COALESCE(?, photo), bio = ? WHERE id = ?')
    .run(name, role, photo, bio, req.params.id);
  res.json({ ok: true });
});

router.delete('/members/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM team_members WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
