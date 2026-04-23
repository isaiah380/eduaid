const Database = require('better-sqlite3');
const path = require('path');
const DB_PATH = path.join(__dirname, 'scholarship_portal.db');
const db = new Database(DB_PATH);
const user = db.prepare("SELECT id, full_name, verification_requested, verification_status FROM users WHERE email = 'gaikwadisaiah@gmail.com'").get();
const views = user ? db.prepare("SELECT COUNT(*) as c FROM scholarship_views WHERE user_id = ?").get(user.id).c : 0;
console.log('User:', JSON.stringify(user, null, 2));
console.log('Views:', views);
db.close();
