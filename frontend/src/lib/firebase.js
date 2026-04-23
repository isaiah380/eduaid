import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getMessaging, isSupported } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZ9m4SdNOuUVzNI6vs2V4JXRvixnzgn3s",
  authDomain: "eduaid-7eaed.firebaseapp.com",
  projectId: "eduaid-7eaed",
  storageBucket: "eduaid-7eaed.firebasestorage.app",
  messagingSenderId: "598517599382",
  appId: "1:598517599382:web:6938e930f25a67d495c6b7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Auth
export const auth = getAuth(app);

// Firebase Cloud Messaging (only on supported browsers)
export let messaging = null;

isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
    console.log('🔔 Firebase Cloud Messaging initialized');
  } else {
    console.log('⚠️ FCM not supported in this browser');
  }
}).catch(() => {
  console.log('⚠️ FCM initialization skipped');
});

export default app;
