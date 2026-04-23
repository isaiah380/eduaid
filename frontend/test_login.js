import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBZ9m4SdNOuUVzNI6vs2V4JXRvixnzgn3s",
  authDomain: "eduaid-7eaed.firebaseapp.com",
  projectId: "eduaid-7eaed",
  storageBucket: "eduaid-7eaed.firebasestorage.app",
  messagingSenderId: "598517599382",
  appId: "1:598517599382:web:6938e930f25a67d495c6b7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testLogins() {
  console.log("Testing Student 1 (CSV user): 5024101@it.fcrit.ac.in / fcrit2026");
  try {
    const cred = await signInWithEmailAndPassword(auth, "5024101@it.fcrit.ac.in", "fcrit2026");
    console.log("✅ Success! UID:", cred.user.uid);
  } catch(err) {
    console.error("❌ Failed:", err.code, err.message);
  }

  console.log("\nTesting Original User 1: gaikwadisaiah@gmail.com / password123");
  try {
    const cred = await signInWithEmailAndPassword(auth, "gaikwadisaiah@gmail.com", "password123");
    console.log("✅ Success! UID:", cred.user.uid);
  } catch(err) {
    console.error("❌ Failed:", err.code, err.message);
  }
  
  process.exit(0);
}

testLogins();
