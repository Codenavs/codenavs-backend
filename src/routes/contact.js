const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { error: 'Too many messages sent. Please try again later.' }
});

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error('Telegram is not configured on the server (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID).');
  const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  const data = await resp.json();
  if (!data.ok) throw new Error(data.description || 'Telegram delivery failed.');
}

async function sendWhatsApp(text) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = process.env.WHATSAPP_RECIPIENT_NUMBER;
  if (!token || !phoneId || !to) throw new Error('WhatsApp Cloud API is not configured on the server.');
  const resp = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } })
  });
  const data = await resp.json();
  if (data.error) throw new Error(data.error.message || 'WhatsApp delivery failed.');
}

async function sendEmail(text, subject) {
  if (!process.env.SMTP_HOST) {
    throw new Error('Email is not configured on the server.');
  }

  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.CONTACT_EMAIL_TO,
    subject,
    text
  });
}

// POST /api/contact { name, email, phone, service, message, destination }
router.post('/', contactLimiter, async (req, res) => {
  const { name, email, phone, service, message, destination } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required.' });
  }
  const text = `New enquiry from ${name}\nEmail: ${email}\nPhone: ${phone || '-'}\nService: ${service || '-'}\n\n${message}`;

  let delivered = false;
  let deliveryError = null;
  try {
    if (destination === 'telegram') await sendTelegram(text);
    else if (destination === 'whatsapp') await sendWhatsApp(text);
    else await sendEmail(text, `New enquiry from ${name}`);
    delivered = true;
  } catch (e) {
    deliveryError = e.message;
  }

  db.prepare(`INSERT INTO messages (name, email, phone, service, message, destination, delivered, delivery_error)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(name, email, phone, service, message, destination, delivered ? 1 : 0, deliveryError);

  if (delivered) {
    res.json({ ok: true });
  } else {
    // Message is still saved so the admin can see it in the inbox even if live delivery failed.
    res.status(200).json({ ok: false, warning: `Message saved, but live delivery failed: ${deliveryError}` });
  }
});

// GET /api/contact/messages (protected) — simple admin inbox
router.get('/messages', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM messages ORDER BY created_at DESC LIMIT 200').all());
});

module.exports = router;
