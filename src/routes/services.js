const express = require('express');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM services ORDER BY sort_order').all());
});

router.post('/', requireAuth, (req, res) => {
  const { category, icon, title, description } = req.body || {};
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) m FROM services').get().m;
  const info = db.prepare('INSERT INTO services (category, icon, title, description, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(category, icon, title, description, maxOrder + 1);
  res.status(201).json({ id: info.lastInsertRowid });
});

router.put('/:id', requireAuth, (req, res) => {
  const { category, icon, title, description } = req.body || {};
  db.prepare('UPDATE services SET category = ?, icon = ?, title = ?, description = ? WHERE id = ?')
    .run(category, icon, title, description, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
