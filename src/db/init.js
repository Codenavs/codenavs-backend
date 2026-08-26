const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', '..', 'data', 'codenavs.sqlite');
require('fs').mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS admin (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sections (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS about (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  story TEXT, mission TEXT, vision TEXT
);

CREATE TABLE IF NOT EXISTS about_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT, text TEXT, sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS industries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, icon TEXT, sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT, icon TEXT, title TEXT, description TEXT, sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS team_md (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT, role TEXT, photo TEXT, bio TEXT
);

CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, role TEXT, photo TEXT, bio TEXT, sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS portfolio_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT, category TEXT, description TEXT, sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS portfolio_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
  url TEXT NOT NULL, sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, role TEXT, description TEXT, logo TEXT, sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS client_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  url TEXT NOT NULL, sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, description TEXT, icon TEXT, sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, email TEXT, phone TEXT, service TEXT, message TEXT,
  destination TEXT, delivered INTEGER DEFAULT 0, delivery_error TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

module.exports = db;
