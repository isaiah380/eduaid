import admin from './firebaseAdmin.js';
import db from './db.js';

async function restoreActualPasswords() {
  console.log('\n🔄 Restoring actual original passwords into Firebase...\n');

  const users = db.prepare('SELECT id, email, full_name, password, firebase_uid, role FROM users WHERE firebase_uid IS NOT NULL').all();
  console.log(`📋 Found ${users.length} users in SQLite configured for Firebase.\n`);

  let successCount = 0;
  let failCount = 0;

  for (const user of users) {
    if (!user.password || !user.password.startsWith('$2')) {
      console.log(`  ⏭️  Skipping ${user.email} (No valid bcrypt hash)`);
      continue;
    }

    try {
      // Use importUsers to override their current Firebase password with the 
      // exact bcrypt hash stored in SQLite!
      const importResult = await admin.auth().importUsers(
        [{
          uid: user.firebase_uid,
          passwordHash: Buffer.from(user.password),
        }],
        { hash: { algorithm: 'BCRYPT' } }
      );

      if (importResult.failureCount > 0) {
        console.error(`  ❌ Failed for ${user.email}:`, importResult.errors[0].error.message);
        failCount++;
      } else {
        console.log(`  ✅ Restored original password for: ${user.email}`);
        successCount++;
      }
    } catch (err) {
      console.error(`  ❌ Error on ${user.email}:`, err.message);
      failCount++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Restore complete:`);
  console.log(`  ✅ Successfully restored: ${successCount}`);
  console.log(`  ❌ Failed: ${failCount}`);
  console.log(`${'='.repeat(50)}\n`);
}

restoreActualPasswords()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
  });
