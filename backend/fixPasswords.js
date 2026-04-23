/**
 * Fix Firebase passwords for migrated users:
 * - CSV-imported students: set password to "fcrit2026"
 * - Admin: already correct (admin123)
 * - Original 4 users: will be handled separately
 * 
 * Run: node fixPasswords.js
 */

import admin from './firebaseAdmin.js';
import db from './db.js';

async function fixPasswords() {
  console.log('\n🔧 Fixing Firebase passwords for CSV-imported students...\n');

  // Get all CSV-imported students (they have @it.fcrit.ac.in emails)
  const csvStudents = db.prepare(
    "SELECT id, email, firebase_uid FROM users WHERE email LIKE '%@it.fcrit.ac.in' AND firebase_uid IS NOT NULL"
  ).all();

  console.log(`📋 Found ${csvStudents.length} CSV-imported students`);

  let success = 0;
  let failed = 0;

  for (const student of csvStudents) {
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
  console.log(`Password fix complete:`);
  console.log(`  ✅ Updated: ${success}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`${'='.repeat(50)}\n`);
}

fixPasswords()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fix failed:', err);
    process.exit(1);
  });
