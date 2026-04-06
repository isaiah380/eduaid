import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import db from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "scholarship_portal_secret_key_2026";

// Create email transporter (Ethereal for demo)
let transporter;
async function getTransporter() {
  if (transporter) return transporter;
  // Use Ethereal for demo
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  return transporter;
}

// ==================== SEND OTP ====================
router.post("/auth/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, detail: "Email is required" });

    // Check if email already registered
    const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existingUser) {
      return res.status(400).json({ success: false, detail: "Email already registered. Please login instead." });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

    // Invalidate old OTPs for this email
    db.prepare("UPDATE otps SET used = 1 WHERE email = ? AND used = 0").run(email);

    // Store new OTP
    db.prepare("INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?)").run(email, otp, expiresAt);

    // Send email
    try {
      const transport = await getTransporter();
      const info = await transport.sendMail({
        from: '"EduAid" <noreply@eduaid.in>',
        to: email,
        subject: "Your OTP for EduAid Registration",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">EduAid</h2>
            <p>Your OTP for registration is:</p>
            <div style="background: #f0f4ff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">${otp}</span>
            </div>
            <p style="color: #666;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
          </div>
        `,
      });
      console.log(`\n╔══════════════════════════════════════╗`);
      console.log(`║  📧 OTP CODE: ${otp}                  ║`);
      console.log(`║  📬 Email: ${email}`);
      console.log(`╚══════════════════════════════════════╝\n`);
      if (nodemailer.getTestMessageUrl(info)) {
        console.log(`🔗 Preview: ${nodemailer.getTestMessageUrl(info)}\n`);
      }
    } catch (emailErr) {
      console.log(`\n╔══════════════════════════════════════╗`);
      console.log(`║  📧 OTP CODE: ${otp}                  ║`);
      console.log(`║  📬 Email: ${email}`);
      console.log(`║  ⚠️  Email send failed, use OTP above ║`);
      console.log(`╚══════════════════════════════════════╝\n`);
    }

    // Mask email for response
    const parts = email.split("@");
    const masked = parts[0].substring(0, 3) + "****@" + parts[1];

    res.json({ success: true, email_masked: masked, message: "OTP sent successfully" });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ success: false, detail: "Failed to send OTP" });
  }
});

// ==================== VERIFY OTP ====================
router.post("/auth/verify-otp", (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, detail: "Email and OTP are required" });
    }

    const otpRecord = db.prepare(
      "SELECT * FROM otps WHERE email = ? AND otp = ? AND used = 0 ORDER BY created_at DESC LIMIT 1"
    ).get(email, otp);

    if (!otpRecord) {
      return res.status(400).json({ success: false, detail: "Invalid OTP" });
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      return res.status(400).json({ success: false, detail: "OTP has expired. Please request a new one." });
    }

    // Mark OTP as used
    db.prepare("UPDATE otps SET used = 1 WHERE id = ?").run(otpRecord.id);

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ success: false, detail: "OTP verification failed" });
  }
});

// ==================== REGISTER ====================
router.post("/auth/register", async (req, res) => {
  try {
    const { full_name, email, phone, password, dob, college_name, last_exam_date } = req.body;

    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ success: false, detail: "All fields are required" });
    }

    // Check if already registered
    const existing = db.prepare("SELECT id FROM users WHERE email = ? OR phone = ?").get(email, phone);
    if (existing) {
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
    let calculatedAge = null;
    if (dob) {
      const birthYear = new Date(dob).getFullYear();
      const currentYear = new Date().getFullYear();
      calculatedAge = currentYear - birthYear;
      
      // Verification rule: reject if age is > 40
      if (calculatedAge > 40) {
        return res.status(400).json({
          success: false,
          detail: `Age verification failed. You are ${calculatedAge} years old. The portal is restricted to users 40 years old or younger.`
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, full_name, email, phone, password, dob, college_name, last_exam_date, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'USER')
    `).run(userId, full_name, email, phone, hashedPassword, dob || null, college_name || '', last_exam_date || null);

    // Generate token
    const user = { id: userId, full_name, email, phone, role: "USER", college_name: college_name || '' };
    const token = jwt.sign({ id: userId, role: "USER" }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ success: true, user, token });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, detail: "Registration failed" });
  }
});

// ==================== LOGIN ====================
router.post("/auth/login", async (req, res) => {
  try {
    const { phone, password, loginType } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, detail: "Phone and password are required" });
    }

    // Find user
    const user = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone);
    if (!user) {
      return res.status(401).json({ success: false, detail: "Invalid credentials. User not found." });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, detail: "Invalid credentials. Wrong password." });
    }

    // Check role match
    if (loginType === "ADMIN" && user.role !== "ADMIN") {
      return res.status(403).json({ success: false, detail: "This account is not an admin account." });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

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

    res.json({ success: true, user: userData, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, detail: "Login failed" });
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

export default router;