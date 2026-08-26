const express = require('express');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function withImages(item) {
  const images = db.prepare('SELECT id, url FROM portfolio_images WHERE item_id = ? ORDER BY sort_order').all(item.id);
  return { ...item, images };
}

router.get('/', (req, res) => {
  const items = db.prepare('SELECT * FROM portfolio_items ORDER BY sort_order').all();
  res.json(items.map(withImages));
});

router.post('/', requireAuth, (req, res) => {
  const { title, category, description } = req.body || {};
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) m FROM portfolio_items').get().m;
  const info = db.prepare('INSERT INTO portfolio_items (title, category, description, sort_order) VALUES (?, ?, ?, ?)')
    .run(title, category, description, maxOrder + 1);
  res.status(201).json({ id: info.lastInsertRowid });
});

router.put('/:id', requireAuth, (req, res) => {
  const { title, category, description } = req.body || {};
  db.prepare('UPDATE portfolio_items SET title = ?, category = ?, description = ? WHERE id = ?')
    .run(title, category, description, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM portfolio_items WHERE id = ?').run(req.params.id); // cascades to images
  res.json({ ok: true });
});

// Add an image (by URL returned from POST /api/upload) to a portfolio item's gallery
router.post('/:id/images', requireAuth, (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url is required' });
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) m FROM portfolio_images WHERE item_id = ?').get(req.params.id).m;
  const info = db.prepare('INSERT INTO portfolio_images (item_id, url, sort_order) VALUES (?, ?, ?)')
    .run(req.params.id, url, maxOrder + 1);
  res.status(201).json({ id: info.lastInsertRowid });
});

router.delete('/:id/images/:imageId', requireAuth, (req, res) => {
  db.prepare('DELETE FROM portfolio_images WHERE id = ? AND item_id = ?').run(req.params.imageId, req.params.id);
  res.json({ ok: true });
});

module.exports = router;
