import Database from 'better-sqlite3';
const db = new Database('backend/database.sqlite');
const user = db.prepare("SELECT id, full_name, verification_requested, verification_status FROM users WHERE email = 'gaikwadisaiah@gmail.com'").get();
console.log(JSON.stringify(user, null, 2));
db.close();
