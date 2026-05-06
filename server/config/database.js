import initSqlJs from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.join(__dirname, '..', 'database');
const DB_PATH = path.join(DB_DIR, 'loantrackr.db');

let db;

export function getDb() {
  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Auto-save every 5 seconds
setInterval(saveDatabase, 5000);

export async function initializeDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      mobile TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      preferred_currency TEXT DEFAULT 'INR',
      is_verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      app_name TEXT NOT NULL,
      loan_amount REAL NOT NULL,
      disbursed_amount REAL NOT NULL,
      interest_rate REAL NOT NULL,
      tenure_type TEXT NOT NULL CHECK(tenure_type IN ('months', 'days')),
      tenure_value INTEGER NOT NULL,
      emi_amount REAL NOT NULL,
      start_date TEXT NOT NULL,
      next_emi_date TEXT,
      total_payable REAL NOT NULL,
      extra_charges REAL DEFAULT 0,
      currency TEXT DEFAULT 'INR',
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'closed')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS emi_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
      payment_date TEXT NOT NULL,
      amount_paid REAL NOT NULL,
      is_late INTEGER DEFAULT 0,
      late_fee REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      purpose TEXT DEFAULT 'signup',
      expires_at TEXT NOT NULL,
      is_used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS custom_apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      app_name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  saveDatabase();
  console.log('✅ Database initialized successfully');
}

// Helper functions to make sql.js work like better-sqlite3 API
export function dbRun(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
  const result = db.exec("SELECT last_insert_rowid() as id");
  return { lastInsertRowid: result.length > 0 ? result[0].values[0][0] : 0 };
}

export function dbGet(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

export function dbAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}
