import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { initDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import scholarshipRoutes from "./routes/scholarships.js";
import benefitRoutes from "./routes/benefits.js";
import documentRoutes from "./routes/documents.js";
import applicationRoutes from "./routes/applications.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes — all under /api
app.use("/api", authRoutes);
app.use("/api", scholarshipRoutes);
app.use("/api", benefitRoutes);
app.use("/api", documentRoutes);
app.use("/api", applicationRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 5000;

async function start() {
  await initDB();
  console.log("✅ Database initialized");

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});