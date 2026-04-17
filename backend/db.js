import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'scholarship_portal.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============== CREATE TABLES ==============
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password TEXT NOT NULL,
    dob TEXT,
    college_name TEXT DEFAULT '',
    last_exam_date TEXT,
    role TEXT DEFAULT 'USER',
    language TEXT DEFAULT 'en',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS scholarships (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'MERIT',
    education_qualifications TEXT DEFAULT '[]',
    communities TEXT DEFAULT '[]',
    income_limit INTEGER,
    min_percentage REAL,
    deadline TEXT,
    passing_year_required INTEGER,
    min_age INTEGER,
    max_age INTEGER,
    benefits TEXT,
    link TEXT,
    eligibility_criteria TEXT DEFAULT '',
    provider TEXT DEFAULT '',
    amount TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS benefits (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT DEFAULT '',
    description TEXT,
    category TEXT DEFAULT 'General',
    discount TEXT DEFAULT '',
    eligibility TEXT DEFAULT '',
    link TEXT DEFAULT '',
    logo TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    document_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    verification_status TEXT DEFAULT 'pending',
    is_verified INTEGER DEFAULT 0,
    ocr_result TEXT,
    uploaded_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    scholarship_id TEXT NOT NULL,
    status TEXT DEFAULT 'applied',
    applied_at TEXT DEFAULT (datetime('now')),
    eligibility_check TEXT DEFAULT '{}',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (scholarship_id) REFERENCES scholarships(id)
  );

  CREATE TABLE IF NOT EXISTS scholarship_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    scholarship_id TEXT NOT NULL,
    viewed_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (scholarship_id) REFERENCES scholarships(id),
    UNIQUE(user_id, scholarship_id)
  );
`);

// ============== INIT & SEED ==============
export async function initDB() {
  const bcrypt = await import('bcryptjs');
  const { v4: uuidv4 } = await import('uuid');

  // Seed admin
  const adminExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('ADMIN');
  if (adminExists.count === 0) {
    const hashedPassword = bcrypt.default.hashSync('admin123', 10);
    db.prepare(`INSERT INTO users (id, full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(uuidv4(), 'Admin User', 'admin@test.com', '9999999999', hashedPassword, 'ADMIN');
    console.log('✅ Seeded admin user (phone: 9999999999 / password: admin123)');
  }

  // Seed scholarships
  const schCount = db.prepare('SELECT COUNT(*) as count FROM scholarships').get();
  if (schCount.count === 0) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'scholarships.json'), 'utf-8'));
      const stmt = db.prepare(`INSERT INTO scholarships (id, name, description, type, education_qualifications, communities,
        income_limit, min_percentage, deadline, min_age, max_age, benefits, link, eligibility_criteria, provider, amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      const insertAll = db.transaction((items) => {
        for (const s of items) {
          stmt.run(s.id, s.name, s.description || '', s.type || 'MERIT',
            JSON.stringify(s.education_qualifications || []), JSON.stringify(s.communities || []),
            s.income_limit || null, s.min_percentage || null, s.deadline || null,
            s.min_age || null, s.max_age || null, s.benefits || '', s.link || '',
            s.eligibility_criteria || '', s.provider || '', s.amount || '');
        }
      });
      insertAll(data);
      console.log(`✅ Seeded ${data.length} scholarships`);
    } catch (e) { console.error('Scholarship seed error:', e.message); }
  }

  // Seed benefits
  const benCount = db.prepare('SELECT COUNT(*) as count FROM benefits').get();
  if (benCount.count === 0) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'benefits.json'), 'utf-8'));
      const stmt = db.prepare(`INSERT INTO benefits (id, name, brand, description, category, discount, eligibility, link, logo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      const insertAll = db.transaction((items) => {
        for (const b of items) {
          stmt.run(b.id, b.name || b.brand, b.brand || b.name, b.description || '',
            b.category || b.type || 'General', b.discount || '', b.eligibility || '', b.link || '', b.logo || '');
        }
      });
      insertAll(data);
      console.log(`✅ Seeded ${data.length} benefits`);
    } catch (e) { console.error('Benefit seed error:', e.message); }
  }
}

export default db;
