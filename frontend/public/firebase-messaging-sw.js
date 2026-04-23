/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */

// Firebase Cloud Messaging Service Worker
// This file MUST be in the public/ folder at the root

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBZ9m4SdNOuUVzNI6vs2V4JXRvixnzgn3s",
  authDomain: "eduaid-7eaed.firebaseapp.com",
  projectId: "eduaid-7eaed",
  storageBucket: "eduaid-7eaed.firebasestorage.app",
  messagingSenderId: "598517599382",
  appId: "1:598517599382:web:6938e930f25a67d495c6b7"
});

const messaging = firebase.messaging();

// Handle background messages (when app is not in focus)
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'EduAid Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: payload.data,
    tag: 'eduaid-notification'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window or open new one
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/dashboard');
    })
  );
});
