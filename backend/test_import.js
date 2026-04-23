import admin from './firebaseAdmin.js';
import db from './db.js';
import { v4 as uuidv4 } from "uuid";

async function testImport() {
  const user = db.prepare("SELECT * FROM users WHERE email='gaikwadisaiah@gmail.com'").get();
  
  try {
    const importResult = await admin.auth().importUsers(
      [{
        uid: user.firebase_uid || uuidv4(),
        email: user.email,
        passwordHash: Buffer.from(user.password),
      }],
      { hash: { algorithm: 'BCRYPT' } }
    );
    console.log("Import Result:", JSON.stringify(importResult, null, 2));
  } catch (err) {
    console.error("Crash:", err);
  }
  process.exit(0);
}
testImport();
