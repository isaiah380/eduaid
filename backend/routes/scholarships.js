import express from "express";
import db from "../db.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// ==================== GET ALL SCHOLARSHIPS ====================
router.get("/scholarships", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM scholarships ORDER BY name ASC").all();
    const scholarships = rows.map((s) => ({
      ...s,
      _id: s.id,
      education_qualifications: JSON.parse(s.education_qualifications || "[]"),
      communities: JSON.parse(s.communities || "[]"),
    }));
    res.json({ success: true, scholarships, total: scholarships.length });
  } catch (err) {
    console.error("Get scholarships error:", err);
    res.status(500).json({ success: false, detail: "Failed to fetch scholarships" });
  }
});

// ==================== GET SCHOLARSHIP STATS ====================
router.get("/scholarships/stats", (req, res) => {
  try {
    const total = db.prepare("SELECT COUNT(*) as count FROM scholarships").get();
    const allScholarships = db.prepare("SELECT education_qualifications, communities FROM scholarships").all();

    const communitySet = new Set();
    const eduSet = new Set();
    allScholarships.forEach((s) => {
      JSON.parse(s.education_qualifications || "[]").forEach((e) => eduSet.add(e));
      JSON.parse(s.communities || "[]").forEach((c) => communitySet.add(c));
    });

    res.json({
      success: true,
      total_scholarships: total.count,
      communities: [...communitySet],
      education_levels: [...eduSet],
    });
  } catch (err) {
    res.status(500).json({ success: false, detail: "Failed to fetch stats" });
  }
});

// ==================== ADD SCHOLARSHIP (Admin) ====================
router.post("/scholarships", (req, res) => {
  try {
    const s = req.body;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO scholarships (id, name, description, type, education_qualifications, communities,
        income_limit, min_percentage, deadline, min_age, max_age, benefits, link, eligibility_criteria, provider, amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, s.name, s.description || "", s.type || "MERIT",
      JSON.stringify(s.education_qualifications || []),
      JSON.stringify(s.communities || []),
      s.incomeLimit || s.income_limit || null,
      s.minPercentage || s.min_percentage || null,
      s.deadline || null, s.minAge || s.min_age || null,
      s.maxAge || s.max_age || null,
      s.benefits || "", s.link || "",
      s.eligibility_criteria || "", s.provider || "", s.amount || ""
    );

    res.json({ success: true, id, message: "Scholarship added" });
  } catch (err) {
    console.error("Add scholarship error:", err);
    res.status(500).json({ success: false, detail: "Failed to add scholarship" });
  }
});

// ==================== DELETE SCHOLARSHIP ====================
router.delete("/scholarships/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM scholarships WHERE id = ?").run(req.params.id);
    res.json({ success: true, message: "Scholarship deleted" });
  } catch (err) {
    res.status(500).json({ success: false, detail: "Failed to delete" });
  }
});

export default router;
