import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db.js";
import admin from "../firebaseAdmin.js";
import { verifyFirebaseToken } from "../middleware/firebaseAuth.js";

const router = express.Router();

// ==================== REGISTER (Firebase Auth + SQLite Profile) ====================
// Frontend creates Firebase user first, then calls this with the Firebase ID token
router.post("/auth/register", verifyFirebaseToken, async (req, res) => {
  try {
    const { full_name, phone, dob, college_name, last_exam_date } = req.body;
    const firebaseUid = req.firebaseUser.uid;
    const email = req.firebaseUser.email;

    if (!full_name || !phone) {
      return res.status(400).json({ success: false, detail: "Full name and phone are required" });
    }

    // Check if already registered in SQLite
    const existing = db.prepare("SELECT id FROM users WHERE firebase_uid = ?").get(firebaseUid);
    if (existing) {
      return res.status(400).json({ success: false, detail: "User already registered" });
    }

    // Check if email or phone already exists
    const existingEmail = db.prepare("SELECT id FROM users WHERE email = ? OR phone = ?").get(email, phone);
    if (existingEmail) {
      return res.status(400).json({ success: false, detail: "User already registered with this email or phone" });
    }

    // Validate last exam date (must be on or before Feb 2026)
    if (last_exam_date) {
      const examDate = new Date(last_exam_date);
      const cutoff = new Date("2026-02-28");
      if (examDate > cutoff) {
        return res.status(400).json({
          success: false,
          detail: "Only students who passed 12th grade exam on or before February 2026 are eligible."
        });
      }
    }

    // Age calculation and verification from DOB
    if (dob) {
      const birthYear = new Date(dob).getFullYear();
      const currentYear = new Date().getFullYear();
      const calculatedAge = currentYear - birthYear;

      if (calculatedAge > 40) {
        return res.status(400).json({
          success: false,
          detail: `Age verification failed. You are ${calculatedAge} years old. The portal is restricted to users 40 years old or younger.`
        });
      }
    }

    // Create user in SQLite
    const userId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, firebase_uid, full_name, email, phone, password, dob, college_name, last_exam_date, role)
      VALUES (?, ?, ?, ?, ?, '', ?, ?, ?, 'USER')
    `).run(userId, firebaseUid, full_name, email, phone, dob || null, college_name || '', last_exam_date || null);

    const user = {
      id: userId,
      _id: userId,
      full_name,
      email,
      phone,
      role: "USER",
      college_name: college_name || '',
      dob: dob || null,
      language: 'en'
    };

    res.json({ success: true, user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, detail: "Registration failed" });
  }
});

// ==================== GET PROFILE (after Firebase login) ====================
// Frontend signs in with Firebase, then calls this to get the SQLite profile
router.get("/auth/profile", verifyFirebaseToken, async (req, res) => {
  try {
    const firebaseUid = req.firebaseUser.uid;

    const user = db.prepare("SELECT * FROM users WHERE firebase_uid = ?").get(firebaseUid);
    if (!user) {
      return res.status(404).json({ success: false, detail: "User profile not found. Please register first." });
    }

    const userData = {
      id: user.id,
      _id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      college_name: user.college_name,
      dob: user.dob,
      language: user.language
    };

    res.json({ success: true, user: userData });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ success: false, detail: "Failed to get profile" });
  }
});

// ==================== UPDATE LANGUAGE ====================
router.post("/auth/set-language", (req, res) => {
  try {
    const { userId, language } = req.body;
    if (!userId || !language) {
      return res.status(400).json({ success: false, detail: "User ID and language are required" });
    }
    db.prepare("UPDATE users SET language = ? WHERE id = ?").run(language, userId);
    res.json({ success: true, message: "Language updated" });
  } catch (err) {
    res.status(500).json({ success: false, detail: "Failed to update language" });
  }
});

// ==================== SAVE FCM TOKEN ====================
router.post("/auth/fcm-token", verifyFirebaseToken, (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, detail: "FCM token is required" });
    }

    if (!req.dbUser) {
      return res.status(404).json({ success: false, detail: "User not found" });
    }

    db.prepare("UPDATE users SET fcm_token = ? WHERE id = ?").run(token, req.dbUser.id);
    res.json({ success: true, message: "FCM token saved" });
  } catch (err) {
    console.error("FCM token save error:", err);
    res.status(500).json({ success: false, detail: "Failed to save FCM token" });
  }
});

// ==================== LOOKUP EMAIL BY PHONE (for phone-based login) ====================
router.post("/auth/lookup-email", (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, detail: "Phone number is required" });
    }

    const user = db.prepare("SELECT email FROM users WHERE phone = ?").get(phone);
    if (!user) {
      return res.status(404).json({ success: false, detail: "No account found with this phone number" });
    }

    // Return masked email for security + full email for login
    const parts = user.email.split("@");
    const masked = parts[0].substring(0, 3) + "****@" + parts[1];

    res.json({ success: true, email: user.email, email_masked: masked });
  } catch (err) {
    console.error("Lookup email error:", err);
    res.status(500).json({ success: false, detail: "Lookup failed" });
  }
});

// ==================== ADMIN: GET VERIFICATION QUEUE ====================
// Returns students who clicked on a scholarship for the first time and need verification
router.get("/auth/admin/verification-queue", (req, res) => {
  try {
    const students = db.prepare(`
      SELECT id, full_name, email, phone, college_name, verification_status, verification_requested, created_at
      FROM users
      WHERE role = 'USER' AND (verification_requested = 1 OR verification_status = 'pending')
      ORDER BY verification_requested DESC, created_at ASC
    `).all();
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, detail: "Failed to fetch verification queue" });
  }
});

// ==================== ADMIN: VERIFY STUDENT PROFILE ====================
router.post("/auth/admin/verify-student/:id", (req, res) => {
  try {
    const { status } = req.body;
    const studentId = req.params.id;

    if (!['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, detail: "Invalid status" });
    }

    db.prepare("UPDATE users SET verification_status = ?, is_verified = ?, verification_requested = 0 WHERE id = ?")
      .run(status, status === 'verified' ? 1 : 0, studentId);

    res.json({ success: true, message: `Student profile ${status}` });
  } catch (err) {
    console.error("Verify student error:", err);
    res.status(500).json({ success: false, detail: "Failed to update verification status" });
  }
});

export default router;