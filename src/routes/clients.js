const express = require('express');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function withImages(client) {
  const images = db.prepare('SELECT id, url FROM client_images WHERE client_id = ? ORDER BY sort_order').all(client.id);
  return { ...client, images };
}

router.get('/', (req, res) => {
  const items = db.prepare('SELECT * FROM clients ORDER BY sort_order').all();
  res.json(items.map(withImages));
});

router.post('/', requireAuth, (req, res) => {
  const { name, role, description, logo } = req.body || {};
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) m FROM clients').get().m;
  const info = db.prepare('INSERT INTO clients (name, role, description, logo, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(name, role, description, logo || '', maxOrder + 1);
  res.status(201).json({ id: info.lastInsertRowid });
});

router.put('/:id', requireAuth, (req, res) => {
  const { name, role, description, logo } = req.body || {};
  db.prepare('UPDATE clients SET name = ?, role = ?, description = ?, logo = COALESCE(?, logo) WHERE id = ?')
    .run(name, role, description, logo, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id); // cascades to images
  res.json({ ok: true });
});

router.post('/:id/images', requireAuth, (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url is required' });
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) m FROM client_images WHERE client_id = ?').get(req.params.id).m;
  const info = db.prepare('INSERT INTO client_images (client_id, url, sort_order) VALUES (?, ?, ?)')
    .run(req.params.id, url, maxOrder + 1);
  res.status(201).json({ id: info.lastInsertRowid });
});

router.delete('/:id/images/:imageId', requireAuth, (req, res) => {
  db.prepare('DELETE FROM client_images WHERE id = ? AND client_id = ?').run(req.params.imageId, req.params.id);
  res.json({ ok: true });
});

module.exports = router;
