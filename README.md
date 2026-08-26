# Codenavs Digital Limited — Backend API

A real Node.js + Express + SQLite backend for the Codenavs website admin panel.
It replaces the browser-only storage in the website file with:

- A proper database (SQLite, via `better-sqlite3` — a single file, no separate database server to install or manage)
- Password hashing with **bcrypt** (never stored in plain text)
- **JWT** session tokens for the admin panel, expiring after 12 hours
- Rate limiting on login and the contact form (brute-force / spam protection)
- Real image uploads, compressed and resized on the server with `sharp`, served from `/uploads`
- Real message delivery for the contact form to **Telegram**, **WhatsApp Cloud API**, or **email**
- A CRUD API for every section of the site: settings, home sections, services, industries, partners, team, portfolio (with image galleries), clients (with image galleries), about page, and a simple contact-message inbox

## 1. Install

You'll need [Node.js](https://nodejs.org) 18 or later installed on your machine or server.

```bash
cd backend
npm install
```

## 2. Configure

```bash
cp .env.example .env
```

Open `.env` and fill in:

- `JWT_SECRET` — any long random string (e.g. run `openssl rand -hex 32`)
- `ADMIN_INITIAL_PASSWORD` — the password you'll use to log into the admin panel the **first** time. Change it from the admin panel afterwards — that update is stored as a bcrypt hash in the database and this value is then ignored.
- `FRONTEND_ORIGIN` — the URL(s) your website is served from, comma-separated (e.g. `https://codenavs.com`). This is a security setting: only these origins will be allowed to call the API.
- Telegram, WhatsApp and email settings are all **optional** — leave any of them blank to disable that delivery option. The contact form will still save every message to the database inbox even if none of these are configured.

### Telegram setup (optional)
1. Message [@BotFather](https://t.me/BotFather) on Telegram, run `/newbot`, and copy the token it gives you into `TELEGRAM_BOT_TOKEN`.
2. Send your new bot any message, then visit `https://api.telegram.org/bot<token>/getUpdates` in a browser — your chat ID will be in the response. Put it in `TELEGRAM_CHAT_ID`.

### WhatsApp setup (optional)
This uses Meta's official WhatsApp Cloud API (requires a Meta developer account and a verified WhatsApp Business number). Follow Meta's [Cloud API getting-started guide](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started) to get `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`, and set `WHATSAPP_RECIPIENT_NUMBER` to the number that should receive enquiries.

### Email setup (optional)
Any SMTP provider works (Gmail, Zoho, SendGrid, etc.) — fill in `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_EMAIL_TO`.

> Note: the two clickable "Chat on WhatsApp" / "Chat on Telegram" cards on the contact page work immediately with no backend at all — they're just direct chat links. This backend is what enables the **contact form itself** to deliver into Telegram/WhatsApp/email automatically.

## 3. Seed the database

```bash
npm run seed
```

This creates `data/codenavs.sqlite` and fills it with your current site content and your admin password. Safe to run again — it won't duplicate data or overwrite an existing admin password.

## 4. Run it

```bash
npm start
```

The API will be running at `http://localhost:4000` (or whatever `PORT` you set). Check `http://localhost:4000/api/health` — it should return `{"ok":true, ...}`.

For local development with auto-restart on file changes:

```bash
npm run dev
```

## 5. Deploying it somewhere real

This is a normal Node.js app, so it runs on any of these with no code changes:

- **Render** or **Railway** — connect your GitHub repo, set the environment variables from `.env` in their dashboard, set the start command to `npm start`, and add a persistent disk/volume mounted at `/data` and `/uploads` (both services support this) so your SQLite file and uploaded images survive restarts.
- **A VPS (DigitalOcean, Hetzner, etc.)** — install Node, clone the repo, run the steps above, then use `pm2` or a `systemd` service to keep it running, and put Nginx in front of it for HTTPS.

Whichever you choose, **the SQLite file and the `uploads/` folder must be on persistent storage** — on platforms with ephemeral filesystems (e.g. plain serverless functions) you'd lose your data on every restart, so a small always-on instance or VPS with a real disk is the right fit here.

## 6. Connecting the website to this backend

The website file (`index.html`) has a field in the admin panel's **Site Settings** tab called **"Backend API URL"**. Once you deploy this backend and put its URL there (e.g. `https://api.codenavs.com`), the contact form will send messages through this real backend (Telegram/WhatsApp/email) instead of only opening a pre-filled chat link.

Everything else on the site (content editing, image uploads, toggles) still runs on the browser-based storage built into the site file by default, so it keeps working instantly with zero setup. If/when you're ready to move **all** content management onto this backend too (so multiple people can safely manage the site with real login accounts, and content lives in a real database instead of the browser), the API below is ready for it — this is the natural next step, and I'm happy to wire it up.

## API reference

All `GET` routes are public. Every other route requires `Authorization: Bearer <token>` from `POST /api/auth/login`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/login` | `{ password }` → `{ token }` |
| POST | `/api/auth/change-password` | `{ currentPassword, newPassword }` |
| GET | `/api/auth/verify` | Check if current token is still valid |
| POST | `/api/upload` | `multipart/form-data`, field `image` → `{ url }` |
| GET/PUT | `/api/settings` | Company details, socials, WhatsApp/Telegram |
| GET/PUT | `/api/sections` | Home page section content + on/off toggles |
| GET/PUT | `/api/about` | Story, mission, vision, values |
| GET/PUT | `/api/industries` | Industries We Serve list |
| GET/PUT | `/api/partners` | Partner cards in the All Services Overview section |
| GET/POST/PUT/DELETE | `/api/services` / `/api/services/:id` | Services list |
| GET | `/api/team` | `{ md, members }` |
| PUT | `/api/team/md` | Managing Director profile |
| POST/PUT/DELETE | `/api/team/members` / `/api/team/members/:id` | Department leads |
| GET/POST/PUT/DELETE | `/api/portfolio` / `/api/portfolio/:id` | Portfolio items |
| POST/DELETE | `/api/portfolio/:id/images` / `/api/portfolio/:id/images/:imageId` | Portfolio image gallery |
| GET/POST/PUT/DELETE | `/api/clients` / `/api/clients/:id` | Client profiles |
| POST/DELETE | `/api/clients/:id/images` / `/api/clients/:id/images/:imageId` | Client image gallery |
| POST | `/api/contact` | `{ name, email, phone, service, message, destination }` → delivers to Telegram/WhatsApp/email and saves to the inbox |
| GET | `/api/contact/messages` | Admin inbox of all contact submissions (protected) |

## Security notes

- Passwords are hashed with bcrypt (12 rounds) — never stored or logged in plain text.
- Admin sessions are short-lived JWTs (12 hours); log in again after that.
- Login and contact form are both rate-limited to slow down brute-force and spam.
- CORS is restricted to the origins you list in `FRONTEND_ORIGIN` — update this before going live.
- Keep your real `.env` file out of version control (a `.gitignore` is included).
