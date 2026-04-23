import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import axios from "axios";

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

async function testBackend() {
  try {
    const cred = await signInWithEmailAndPassword(auth, "5024101@it.fcrit.ac.in", "fcrit2026");
    const idToken = await cred.user.getIdToken();
    
    console.log("Got idToken, testing backend...");
    const res = await axios.get("http://localhost:5000/api/auth/profile", {
      headers: { Authorization: `Bearer ${idToken}` }
    });
    console.log("Backend response:", res.data);
  } catch(err) {
    if (err.response) {
      console.error("❌ Backend Error:", err.response.status, err.response.data);
    } else {
      console.error("❌ Failed:", err?.code || err.message);
    }
  }
  process.exit(0);
}

testBackend();
