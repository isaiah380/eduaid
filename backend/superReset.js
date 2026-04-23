import admin from './firebaseAdmin.js';
import db from './db.js';

async function superReset() {
  console.log('\n🚀 Starting Super Reset of Firebase Passwords...\n');

  const users = db.prepare("SELECT * FROM users WHERE firebase_uid IS NOT NULL OR email IN ('admin@test.com', 'gaikwadisaiah@gmail.com')").all();
  
  for (const user of users) {
    const targetPassword = user.role === 'ADMIN' ? 'admin123' : 'fcrit2026';
    let firebaseUser;
    
    try {
      firebaseUser = await admin.auth().getUserByEmail(user.email);
      console.log(`🔍 Found ${user.email} in Firebase (UID: ${firebaseUser.uid})`);
      
      await admin.auth().updateUser(firebaseUser.uid, {
        password: targetPassword
      });
      console.log(`  ✅ Password updated to: ${targetPassword}`);

      // Ensure SQLite is synced with the correct UID if it was different
      if (user.firebase_uid !== firebaseUser.uid) {
         db.prepare("UPDATE users SET firebase_uid = ? WHERE id = ?").run(firebaseUser.uid, user.id);
         console.log(`  🔗 Synced UID in SQLite`);
      }
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        console.log(`➕ User ${user.email} not found in Firebase. Creating...`);
        firebaseUser = await admin.auth().createUser({
          email: user.email,
          password: targetPassword,
          displayName: user.full_name
        });
        console.log(`  ✅ Created with password: ${targetPassword}`);
        
        db.prepare("UPDATE users SET firebase_uid = ? WHERE id = ?").run(firebaseUser.uid, user.id);
        console.log(`  🔗 Saved new UID to SQLite`);
      } else {
        console.error(`  ❌ Error for ${user.email}:`, e.message);
      }
    }
    
    // Set admin claims if applicable
    if (user.role === 'ADMIN' && firebaseUser) {
       await admin.auth().setCustomUserClaims(firebaseUser.uid, { role: 'ADMIN' });
       console.log(`  🛡️ Set ADMIN custom claim`);
    }
  }

  console.log('\n✨ Super Reset Complete!');
}

superReset().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
