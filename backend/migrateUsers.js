/**
 * Migration Script: Sync existing SQLite users to Firebase Auth
 * 
 * This script reads all users from SQLite (including their bcrypt password hashes)
 * and imports them into Firebase Auth using importUsers(), which natively supports
 * bcrypt hashes. This means students keep their exact same email + password.
 * 
 * Run once: node migrateUsers.js
 */

import admin from './firebaseAdmin.js';
import db from './db.js';

async function migrateUsers() {
  console.log('\n🔄 Starting user migration to Firebase Auth...\n');

  // Get all users from SQLite that don't have a firebase_uid yet
  const users = db.prepare('SELECT * FROM users WHERE firebase_uid IS NULL').all();

  if (users.length === 0) {
    console.log('✅ No users to migrate — all users already have Firebase UIDs.');
    return;
  }

  console.log(`📋 Found ${users.length} users to migrate:\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const user of users) {
    try {
      console.log(`  Migrating: ${user.email} (${user.full_name})...`);

      // Check if user already exists in Firebase by email
      let firebaseUser;
      try {
        firebaseUser = await admin.auth().getUserByEmail(user.email);
        console.log(`    ↳ Already exists in Firebase (uid: ${firebaseUser.uid})`);
      } catch (e) {
        if (e.code === 'auth/user-not-found') {
          // Create the user in Firebase
          // If we have a bcrypt hash, we need to use importUsers()
          // If not (or if it fails), create with a known password
          if (user.password && user.password.startsWith('$2')) {
            // Import with bcrypt hash
            const importResult = await admin.auth().importUsers(
              [{
                uid: undefined, // Let Firebase generate UID
                email: user.email,
                displayName: user.full_name,
                passwordHash: Buffer.from(user.password),
              }],
              {
                hash: {
                  algorithm: 'BCRYPT',
                },
              }
            );

            if (importResult.errors.length > 0) {
              console.log(`    ⚠️ Import failed, creating with password directly...`);
              // Fallback: create user with known password
              // This means user will need to use "admin123" or their original password
              firebaseUser = await admin.auth().createUser({
                email: user.email,
                displayName: user.full_name,
                password: user.role === 'ADMIN' ? 'admin123' : 'password123',
              });
              console.log(`    ⚠️ Created with fallback password`);
            } else {
              // Get the created user
              firebaseUser = await admin.auth().getUserByEmail(user.email);
              console.log(`    ✅ Imported with bcrypt hash (uid: ${firebaseUser.uid})`);
            }
          } else {
            // No password hash, create with a default password
            firebaseUser = await admin.auth().createUser({
              email: user.email,
              displayName: user.full_name,
              password: user.role === 'ADMIN' ? 'admin123' : 'password123',
            });
            console.log(`    ✅ Created with default password (uid: ${firebaseUser.uid})`);
          }
        } else {
          throw e;
        }
      }

      // Update SQLite with the Firebase UID
      db.prepare('UPDATE users SET firebase_uid = ? WHERE id = ?').run(firebaseUser.uid, user.id);

      // Set custom claims for admin users
      if (user.role === 'ADMIN') {
        await admin.auth().setCustomUserClaims(firebaseUser.uid, { role: 'ADMIN' });
        console.log(`    🛡️ Set ADMIN custom claim`);
      }

      successCount++;
    } catch (err) {
      console.error(`    ❌ Failed to migrate ${user.email}:`, err.message);
      errorCount++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Migration complete:`);
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ❌ Failed:  ${errorCount}`);
  console.log(`${'='.repeat(50)}\n`);
}

migrateUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
