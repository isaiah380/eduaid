import express from "express";
import db from "../db.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// ==================== GET ALL BENEFITS ====================
router.get("/benefits", (req, res) => {
  try {
    const { category } = req.query;
    let rows;
    if (category) {
      rows = db.prepare("SELECT * FROM benefits WHERE category = ? ORDER BY name ASC").all(category);
    } else {
      rows = db.prepare("SELECT * FROM benefits ORDER BY name ASC").all();
    }
    const benefits = rows.map((b) => ({ ...b, _id: b.id }));
    res.json({ success: true, benefits, total: benefits.length });
  } catch (err) {
    console.error("Get benefits error:", err);
    res.status(500).json({ success: false, detail: "Failed to fetch benefits" });
  }
});

// ==================== ADD BENEFIT (Admin) ====================
router.post("/benefits", (req, res) => {
  try {
    const b = req.body;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO benefits (id, name, brand, description, category, discount, eligibility, link, logo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, b.name || "", b.brand || "", b.description || "", b.category || "General",
      b.discount || "", b.eligibility || "", b.link || "", b.logo || "");

    res.json({ success: true, id, message: "Benefit added" });
  } catch (err) {
    console.error("Add benefit error:", err);
    res.status(500).json({ success: false, detail: "Failed to add benefit" });
  }
});

// ==================== DELETE BENEFIT ====================
router.delete("/benefits/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM benefits WHERE id = ?").run(req.params.id);
    res.json({ success: true, message: "Benefit deleted" });
  } catch (err) {
    res.status(500).json({ success: false, detail: "Failed to delete" });
  }
});

export default router;
