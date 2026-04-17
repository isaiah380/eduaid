import express from "express";
import db from "../db.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// ==================== APPLY FOR SCHOLARSHIP ====================
router.post("/applications", (req, res) => {
  try {
    const { user_id, scholarship_id, eligibility_check } = req.body;
    if (!user_id || !scholarship_id) {
      return res.status(400).json({ success: false, detail: "user_id and scholarship_id are required" });
    }

    // Check if already applied
    const existing = db.prepare(
      "SELECT id FROM applications WHERE user_id = ? AND scholarship_id = ?"
    ).get(user_id, scholarship_id);

    if (existing) {
      return res.status(400).json({ success: false, detail: "You have already applied for this scholarship" });
    }

    const appId = uuidv4();
    db.prepare(`
      INSERT INTO applications (id, user_id, scholarship_id, status, eligibility_check)
      VALUES (?, ?, ?, 'applied', ?)
    `).run(appId, user_id, scholarship_id, JSON.stringify(eligibility_check || {}));

    res.json({ success: true, id: appId, message: "Application submitted" });
  } catch (err) {
    console.error("Apply error:", err);
    res.status(500).json({ success: false, detail: "Failed to apply" });
  }
});

// ==================== GET USER'S APPLICATIONS ====================
router.get("/applications/:userId", (req, res) => {
  try {
    const apps = db.prepare(`
      SELECT a.*, s.name as scholarship_name, s.provider, s.amount, s.deadline, s.link
      FROM applications a
      JOIN scholarships s ON a.scholarship_id = s.id
      WHERE a.user_id = ?
      ORDER BY a.applied_at DESC
    `).all(req.params.userId);

    const applications = apps.map((a) => ({
      ...a,
      eligibility_check: JSON.parse(a.eligibility_check || "{}"),
    }));

    res.json({ success: true, applications });
  } catch (err) {
    console.error("Get apps error:", err);
    res.status(500).json({ success: false, detail: "Failed to fetch applications" });
  }
});

// ==================== ADMIN: GET APPLICATIONS BY COLLEGE ====================
router.get("/applications/admin/college/:collegeName", (req, res) => {
  try {
    const collegeName = decodeURIComponent(req.params.collegeName);
    const apps = db.prepare(`
      SELECT a.*, s.name as scholarship_name, s.provider, s.amount,
             u.full_name as student_name, u.email as student_email, u.college_name
      FROM applications a
      JOIN scholarships s ON a.scholarship_id = s.id
      JOIN users u ON a.user_id = u.id
      WHERE u.college_name LIKE ?
      ORDER BY a.applied_at DESC
    `).all(`%${collegeName}%`);

    res.json({ success: true, applications: apps });
  } catch (err) {
    console.error("Admin apps error:", err);
    res.status(500).json({ success: false, detail: "Failed to fetch" });
  }
});

// ==================== ADMIN: GET ALL STUDENTS ====================
router.get("/applications/admin/students", (req, res) => {
  try {
    const students = db.prepare(`
      SELECT u.id, u.full_name, u.email, u.phone, u.college_name, u.created_at,
             COUNT(a.id) as total_applications
      FROM users u
      LEFT JOIN applications a ON u.id = a.user_id
      WHERE u.role = 'USER'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, detail: "Failed to fetch students" });
  }
});

// ==================== LOG SCHOLARSHIP VIEW (deduplicates) ====================
router.post("/scholarships/view", (req, res) => {
  try {
    const { user_id, scholarship_id } = req.body;
    if (!user_id || !scholarship_id) {
      return res.status(400).json({ success: false, detail: "user_id and scholarship_id are required" });
    }
    // INSERT OR IGNORE ensures only the first view is recorded
    db.prepare(
      "INSERT OR IGNORE INTO scholarship_views (user_id, scholarship_id) VALUES (?, ?)"
    ).run(user_id, scholarship_id);
    res.json({ success: true });
  } catch (err) {
    console.error("View log error:", err);
    res.status(500).json({ success: false, detail: "Failed to log view" });
  }
});

// ==================== ADMIN: GET STATS ====================
router.get("/admin/stats", (req, res) => {
  try {
    const total_scholarships = db.prepare("SELECT COUNT(*) as c FROM scholarships").get().c;
    const total_students = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'USER'").get().c;
    const total_applications = db.prepare("SELECT COUNT(*) as c FROM applications").get().c;
    const total_views = db.prepare("SELECT COUNT(*) as c FROM scholarship_views").get().c;
    res.json({ success: true, total_scholarships, total_students, total_applications, total_views });
  } catch (err) {
    res.status(500).json({ success: false, detail: "Failed to fetch stats" });
  }
});

// ==================== ADMIN: GET ALL APPLICATIONS WITH STUDENT INFO ====================
router.get("/admin/applications", (req, res) => {
  try {
    const apps = db.prepare(`
      SELECT a.id, a.status, a.applied_at,
             s.name as scholarship_name, s.type as scholarship_type, s.provider,
             u.full_name as student_name, u.email as student_email, u.dob, u.college_name, u.phone
      FROM applications a
      JOIN scholarships s ON a.scholarship_id = s.id
      JOIN users u ON a.user_id = u.id
      ORDER BY a.applied_at DESC
    `).all();

    // Calculate age from dob
    const currentYear = new Date().getFullYear();
    const result = apps.map(a => ({
      ...a,
      student_age: a.dob ? currentYear - new Date(a.dob).getFullYear() : null
    }));

    res.json({ success: true, applications: result });
  } catch (err) {
    console.error("Admin apps error:", err);
    res.status(500).json({ success: false, detail: "Failed to fetch applications" });
  }
});

// ==================== ADMIN: GET ALL SCHOLARSHIP VIEWS WITH STUDENT INFO ====================
router.get("/admin/views", (req, res) => {
  try {
    const views = db.prepare(`
      SELECT sv.id, sv.viewed_at,
             s.name as scholarship_name, s.type as scholarship_type, s.provider,
             u.full_name as student_name, u.email as student_email, u.dob, u.college_name, u.phone
      FROM scholarship_views sv
      JOIN scholarships s ON sv.scholarship_id = s.id
      JOIN users u ON sv.user_id = u.id
      ORDER BY sv.viewed_at DESC
    `).all();

    const currentYear = new Date().getFullYear();
    const result = views.map(v => ({
      ...v,
      student_age: v.dob ? currentYear - new Date(v.dob).getFullYear() : null
    }));

    res.json({ success: true, views: result });
  } catch (err) {
    console.error("Admin views error:", err);
    res.status(500).json({ success: false, detail: "Failed to fetch views" });
  }
});

// ==================== ADMIN: UPDATE APPLICATION STATUS ====================
router.post("/admin/applications/:appId/status", (req, res) => {
  try {
    const { status } = req.body;
    db.prepare("UPDATE applications SET status = ? WHERE id = ?").run(status, req.params.appId);
    res.json({ success: true, message: "Status updated" });
  } catch (err) {
    res.status(500).json({ success: false, detail: "Failed to update status" });
  }
});

export default router;
