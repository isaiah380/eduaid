import admin from '../firebaseAdmin.js';
import db from '../db.js';

/**
 * Send a push notification to a user via FCM.
 * Fails silently if the user has no FCM token.
 */
async function sendNotification(userId, title, body, data = {}) {
  try {
    const user = db.prepare('SELECT fcm_token FROM users WHERE id = ?').get(userId);

    if (!user || !user.fcm_token) {
      console.log(`📭 No FCM token for user ${userId}, skipping notification`);
      return false;
    }

    const message = {
      token: user.fcm_token,
      notification: {
        title,
        body
      },
      data: {
        ...data,
        click_action: 'OPEN_APP'
      },
      webpush: {
        notification: {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200]
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log(`🔔 Notification sent to ${userId}: ${title} (${response})`);
    return true;
  } catch (error) {
    // Don't crash the server if notification fails
    console.error(`⚠️ FCM notification failed for ${userId}:`, error.message);
    return false;
  }
}

/**
 * Notify a student when their document is verified or rejected.
 */
export async function notifyDocumentVerified(userId, documentType, status) {
  const docLabel = documentType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  if (status === 'verified') {
    return sendNotification(
      userId,
      '✅ Document Verified',
      `Your ${docLabel} has been verified successfully by the admin.`,
      { type: 'document_verified', document_type: documentType }
    );
  } else {
    return sendNotification(
      userId,
      '❌ Document Rejected',
      `Your ${docLabel} was rejected. Please upload a valid document.`,
      { type: 'document_rejected', document_type: documentType }
    );
  }
}

/**
 * Notify a student when their scholarship application status changes.
 */
export async function notifyApplicationStatus(userId, scholarshipName, status) {
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return sendNotification(
    userId,
    `📋 Application ${statusLabel}`,
    `Your application for "${scholarshipName}" has been updated to: ${statusLabel}`,
    { type: 'application_status', status }
  );
}
