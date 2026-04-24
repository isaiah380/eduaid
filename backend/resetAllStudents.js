/**
 * Reset ALL student passwords in Firebase to "fcrit2026"
 * This includes both FCRIT emails AND manually entered Gmail/other emails.
 * 
 * Run: node resetAllStudents.js
 */

import admin from './firebaseAdmin.js';
import db from './db.js';

async function resetAll() {
  console.log('\n🔧 Resetting ALL student passwords in Firebase to "fcrit2026"...\n');

  // Get ALL students (not just FCRIT ones)
  const students = db.prepare(
    "SELECT id, email, firebase_uid FROM users WHERE role = 'USER' AND firebase_uid IS NOT NULL"
  ).all();

  console.log(`📋 Found ${students.length} students total\n`);

  let success = 0;
  let failed = 0;

  for (const student of students) {
    try {
      await admin.auth().updateUser(student.firebase_uid, {
        password: 'fcrit2026'
      });
      console.log(`  ✅ ${student.email} → password set to fcrit2026`);
      success++;
    } catch (err) {
      console.error(`  ❌ ${student.email}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Password reset complete:`);
  console.log(`  ✅ Updated: ${success}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`${'='.repeat(50)}\n`);
}

resetAll()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Reset failed:', err);
    process.exit(1);
  });
