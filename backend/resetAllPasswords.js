import admin from './firebaseAdmin.js';
import db from './db.js';

async function resetAllPasswords() {
  console.log('\n🔧 Resetting Firebase passwords...\n');

  // Set admin password to admin123
  const adminUsers = db.prepare("SELECT firebase_uid FROM users WHERE role = 'ADMIN' AND firebase_uid IS NOT NULL").all();
  for (const user of adminUsers) {
    try {
      await admin.auth().updateUser(user.firebase_uid, { password: 'admin123' });
      console.log(`✅ Admin password reset to: admin123`);
    } catch(e) {
      console.log(`❌ Admin error: ${e.message}`);
    }
  }

  // Set ALL student passwords to fcrit2026
  const students = db.prepare("SELECT email, firebase_uid FROM users WHERE role = 'USER' AND firebase_uid IS NOT NULL").all();
  let scount = 0;
  for (const student of students) {
    try {
      await admin.auth().updateUser(student.firebase_uid, { password: 'fcrit2026' });
      scount++;
    } catch(e) {
      console.log(`❌ Student error (${student.email}): ${e.message}`);
    }
  }
  
  console.log(`✅ Reset ${scount} student passwords to: fcrit2026`);
  console.log('\nDone!');
}

resetAllPasswords()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
  });
