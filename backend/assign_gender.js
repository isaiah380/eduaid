import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'scholarship_portal.db');
const db = new Database(DB_PATH);

const femaleNames = ["shreya", "renata", "sidra", "taiba", "sania", "sneha", "navya", "neha", "sweety", "aditi", "ritu", "samaruddhi", "anushka", "vishakha", "tanaya", "sonia", "lyshelle", "deena", "merin", "riya", "steffi", "abigael", "mukta", "snehal", "alison", "anna", "joys"];

const users = db.prepare("SELECT id, full_name, role FROM users WHERE role = 'USER'").all();

let maleCount = 0;
let femaleCount = 0;

const updateStmt = db.prepare("UPDATE users SET gender = ? WHERE id = ?");

db.transaction(() => {
    for (const user of users) {
        const nameParts = user.full_name.toLowerCase().split(' ');
        let isFemale = false;
        
        for (const part of nameParts) {
            if (femaleNames.includes(part)) {
                isFemale = true;
                break;
            }
        }
        
        // Additional heuristic: if first name ends with 'a' or 'i', often female in India
        // (but we'll stick to our strict list for precision based on the dataset)
        
        const gender = isFemale ? 'Female' : 'Male';
        if (gender === 'Male') maleCount++;
        else femaleCount++;
        
        updateStmt.run(gender, user.id);
    }
})();

console.log(`✅ Gender assignment complete!`);
console.log(`Assigned Male to ${maleCount} students.`);
console.log(`Assigned Female to ${femaleCount} students.`);
