import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load service account key
const serviceAccountPath = path.join(__dirname, 'eduaid firebase.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Firebase service account key not found at:', serviceAccountPath);
  console.error('   Please download it from Firebase Console → Project Settings → Service accounts');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  console.log('🔥 Firebase Admin SDK initialized');
}

export default admin;
