import admin from '../firebaseAdmin.js';
import db from '../db.js';

/**
 * Express middleware to verify Firebase ID tokens.
 * Attaches req.firebaseUser (Firebase decoded token) and req.dbUser (SQLite user record).
 */
export async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, detail: 'No authentication token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.firebaseUser = decodedToken;

    // Look up the user in SQLite by firebase_uid
    const user = db.prepare('SELECT * FROM users WHERE firebase_uid = ?').get(decodedToken.uid);
    if (user) {
      req.dbUser = user;
    }

    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error.message);
    return res.status(401).json({ success: false, detail: 'Invalid or expired authentication token' });
  }
}

/**
 * Middleware that requires the user to be an admin.
 * Must be used AFTER verifyFirebaseToken.
 */
export async function requireAdmin(req, res, next) {
  if (!req.dbUser || req.dbUser.role !== 'ADMIN') {
    return res.status(403).json({ success: false, detail: 'Admin access required' });
  }
  next();
}
