// ============================================================
// BULK STUDENT IMPORT SCRIPT
// Usage: node import_students.js
// 
// Place your CSV file as 'students.csv' in the backend/ folder.
// Expected CSV columns: name, roll_no, email
// College is set to "fcrit" for all students.
// Default password: fcrit2026
// ============================================================

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'scholarship_portal.db');
const CSV_PATH = path.join(__dirname, 'students.csv');
const DEFAULT_PASSWORD = 'fcrit2026';
const COLLEGE_NAME = 'fcrit';

// Open DB
const db = new Database(DB_PATH);

// Read CSV
if (!fs.existsSync(CSV_PATH)) {
  console.error(`❌ File not found: ${CSV_PATH}`);
  console.error(`   Please place your students.csv file in the backend/ folder.`);
  console.error(`   Expected format: name,roll_no,email`);
  process.exit(1);
}

const raw = fs.readFileSync(CSV_PATH, 'utf-8');
const lines = raw.split(/\r?\n/).filter(l => l.trim());

// Parse header
const header = lines[0].toLowerCase().split(',').map(h => h.trim());
const nameIdx = header.findIndex(h => h.includes('name'));
const rollIdx = header.findIndex(h => h.includes('roll'));
const emailIdx = header.findIndex(h => h.includes('email'));

if (nameIdx === -1 || emailIdx === -1) {
  console.error(`❌ CSV must have 'name' and 'email' columns. Found: ${header.join(', ')}`);
  process.exit(1);
}

console.log(`\n📂 Reading: ${CSV_PATH}`);
console.log(`📊 Found ${lines.length - 1} student rows`);
console.log(`🔑 Default password: ${DEFAULT_PASSWORD}`);
console.log(`🏫 College: ${COLLEGE_NAME}\n`);

// Hash default password once
const hashedPassword = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

const insertStmt = db.prepare(`
  INSERT INTO users (id, full_name, email, phone, password, college_name, role)
  VALUES (?, ?, ?, ?, ?, ?, 'USER')
`);

let added = 0;
let skipped = 0;
const errors = [];

const importAll = db.transaction(() => {
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const name = cols[nameIdx];
    const email = cols[emailIdx];
    const rollNo = rollIdx !== -1 ? cols[rollIdx] : '';

    if (!name || !email) {
      errors.push(`Row ${i + 1}: Missing name or email — skipped`);
      skipped++;
      continue;
    }

    // Check if email already exists
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      console.log(`  ⏭️  Skipped (already exists): ${email}`);
      skipped++;
      continue;
    }

    // Use roll number as phone placeholder (or generate one)
    const phone = rollNo || `ROLL${String(i).padStart(4, '0')}`;

    try {
      insertStmt.run(uuidv4(), name, email, phone, hashedPassword, COLLEGE_NAME);
      console.log(`  ✅ Added: ${name} (${email})`);
      added++;
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err.message}`);
      skipped++;
    }
  }
});

importAll();

console.log(`\n${'='.repeat(50)}`);
console.log(`✅ Successfully added: ${added} students`);
console.log(`⏭️  Skipped: ${skipped}`);
if (errors.length > 0) {
  console.log(`\n⚠️  Errors:`);
  errors.forEach(e => console.log(`   ${e}`));
}
console.log(`\n🔑 All new students can login with:`);
console.log(`   Email: <their email>`);
console.log(`   Password: ${DEFAULT_PASSWORD}`);
console.log(`${'='.repeat(50)}\n`);

db.close();
