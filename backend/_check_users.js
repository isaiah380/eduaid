import Database from 'better-sqlite3';

const db = new Database('./scholarship_portal.db');
const users = db.prepare("SELECT id, full_name, email, phone, password, role, created_at FROM users WHERE role='USER' ORDER BY created_at ASC LIMIT 10").all();
users.forEach((u, i) => {
  console.log(`${i+1}. ${u.full_name} | ${u.email} | ${u.phone} | hash:${u.password?.substring(0,20)} | ${u.created_at}`);
});
db.close();
