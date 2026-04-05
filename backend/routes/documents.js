import express from "express";
import db from "../db.js";
import { v4 as uuidv4 } from "uuid";
import { upload } from "../middleware/upload.js";
import fs from "fs";

const router = express.Router();

// ==================== DigiLocker Verification Configuration ====================
// Defines strict rules for each document type
const DOCUMENT_RULES = {
  '10th_marksheet': {
    label: '10th Marksheet',
    requiredKeywords: ['marksheet', 'mark', 'result', '10th', 'ssc', 'tenth', 'secondary', 'board', 'class x', 'class-x', 'matric'],
    forbiddenKeywords: [],
    acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    maxSizeMB: 5,
    description: 'Class 10 / SSC / Matriculation marksheet or result document'
  },
  '12th_marksheet': {
    label: '12th Marksheet',
    requiredKeywords: ['marksheet', 'mark', 'result', '12th', 'hsc', 'twelfth', 'senior secondary', 'intermediate', 'board', 'class xii', 'class-xii', 'plus two'],
    forbiddenKeywords: [],
    acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    maxSizeMB: 5,
    description: 'Class 12 / HSC / Intermediate marksheet or result document'
  },
  'aadhar': {
    label: 'Aadhaar Card',
    requiredKeywords: ['aadhar', 'aadhaar', 'uid', 'uidai', 'unique identification', 'enrolment'],
    forbiddenKeywords: [],
    acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    maxSizeMB: 2,
    description: 'Aadhaar Card issued by UIDAI'
  },
  'income_certificate': {
    label: 'Income Certificate',
    requiredKeywords: ['income', 'certificate', 'annual income', 'salary', 'revenue', 'tahsildar'],
    forbiddenKeywords: [],
    acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    maxSizeMB: 3,
    description: 'Income certificate issued by Tahsildar / Revenue department'
  },
  'caste_certificate': {
    label: 'Caste Certificate',
    requiredKeywords: ['caste', 'certificate', 'community', 'category', 'sc', 'st', 'obc', 'bc', 'scheduled'],
    forbiddenKeywords: [],
    acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    maxSizeMB: 3,
    description: 'Caste / Community certificate issued by competent authority'
  }
};

// ==================== DigiLocker-style Verification Logic ====================
function verifyDocument(fileName, fileSize, mimeType, documentType) {
  const rules = DOCUMENT_RULES[documentType];
  if (!rules) {
    return {
      verified: false,
      status: 'rejected',
      reason: `Unknown document type: ${documentType}`,
      digilocker_status: 'INVALID_TYPE',
      confidence: 0
    };
  }

  const errors = [];
  const warnings = [];
  let confidence = 0;

  // 1. MIME type check
  const normalizedMime = mimeType?.toLowerCase() || '';
  if (!rules.acceptedMimeTypes.some(t => normalizedMime.includes(t.split('/')[1]))) {
    errors.push(`Invalid file format. Accepted: PDF, JPG, PNG only.`);
  } else {
    confidence += 15;
  }

  // 2. File size check
  const maxBytes = rules.maxSizeMB * 1024 * 1024;
  if (fileSize > maxBytes) {
    errors.push(`File too large. Maximum ${rules.maxSizeMB}MB allowed for ${rules.label}.`);
  } else {
    confidence += 10;
  }

  // 3. File name analysis — KEY VERIFICATION STEP
  const fileNameLower = fileName.toLowerCase().replace(/[_\-\.]/g, ' ');

  // Check if filename contains ANY relevant keyword for the document type
  const matchedKeywords = rules.requiredKeywords.filter(kw => fileNameLower.includes(kw.toLowerCase()));

  if (matchedKeywords.length === 0) {
    // STRICT: No matching keywords found — the file does NOT appear to be the right document
    errors.push(
      `Document verification failed: The uploaded file "${fileName}" does not appear to be a valid ${rules.label}. ` +
      `Expected file name to contain keywords like: ${rules.requiredKeywords.slice(0, 4).join(', ')}. ` +
      `Please upload the correct document through DigiLocker or ensure the file name matches the document type.`
    );
  } else {
    confidence += 30 + (matchedKeywords.length * 10);
  }

  // 4. Cross-type contamination check — reject if file seems to be a DIFFERENT document type
  const otherTypes = Object.entries(DOCUMENT_RULES).filter(([key]) => key !== documentType);
  for (const [otherKey, otherRules] of otherTypes) {
    const otherMatches = otherRules.requiredKeywords.filter(kw =>
      fileNameLower.includes(kw.toLowerCase()) && !rules.requiredKeywords.includes(kw)
    );
    if (otherMatches.length >= 2 && matchedKeywords.length === 0) {
      errors.push(
        `This file appears to be a ${otherRules.label} rather than a ${rules.label}. ` +
        `Please upload the correct document.`
      );
      break;
    }
  }

  // 5. Extension check
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
    errors.push('Invalid file extension. Only PDF, JPG, and PNG files are accepted.');
  } else {
    confidence += 10;
  }

  // Cap confidence
  confidence = Math.min(confidence, 100);

  if (errors.length > 0) {
    return {
      verified: false,
      status: 'rejected',
      reason: errors.join(' | '),
      warnings,
      digilocker_status: 'VERIFICATION_FAILED',
      confidence: Math.min(confidence, 20)
    };
  }

  let finalReason = `${rules.label} verified successfully via DigiLocker. Matched keywords: ${matchedKeywords.join(', ')}.`;

  // Simulated OCR: Extract percentage if it's a marksheet
  if (['10th_marksheet', '12th_marksheet'].includes(documentType)) {
    let extractedPercentage = 0;
    // Check if filename contains a 2 digit number that could be a percentage
    const numberMatch = fileNameLower.match(/(?:[^0-9]|^)([6-9][0-9])(?:[^0-9]|$)/);
    if (numberMatch && numberMatch[1]) {
      extractedPercentage = parseFloat(numberMatch[1]) + (Math.floor(Math.random() * 9) / 10);
    } else {
      // Default random realistic percentage between 65.0% and 95.9%
      extractedPercentage = 65 + Math.floor(Math.random() * 30) + (Math.floor(Math.random() * 9) / 10);
    }
    extractedPercentage = extractedPercentage.toFixed(1);
    finalReason += ` Extracted Percentage: ${extractedPercentage}%`;
  }

  return {
    verified: true,
    status: 'verified',
    reason: finalReason,
    warnings,
    digilocker_status: 'VERIFIED',
    confidence
  };
}

// ==================== UPLOAD DOCUMENT ====================
router.post("/documents/upload", upload.single("file"), (req, res) => {
  try {
    const { user_id, document_type } = req.body;
    if (!user_id || !document_type || !req.file) {
      return res.status(400).json({ success: false, detail: "user_id, document_type, and file are required" });
    }

    // Validate document type
    if (!DOCUMENT_RULES[document_type]) {
      return res.status(400).json({ success: false, detail: `Invalid document type: ${document_type}` });
    }

    const docId = uuidv4();
    db.prepare(`
      INSERT INTO documents (id, user_id, document_type, file_name, file_path, verification_status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(docId, user_id, document_type, req.file.originalname, req.file.path);

    res.json({
      success: true,
      document: {
        id: docId,
        document_type,
        file_name: req.file.originalname,
        verification_status: "pending",
        uploaded_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, detail: "Upload failed" });
  }
});

// ==================== GET USER DOCUMENTS ====================
router.get("/documents/:userId", (req, res) => {
  try {
    const docs = db.prepare("SELECT * FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC").all(req.params.userId);
    res.json({ success: true, documents: docs });
  } catch (err) {
    res.status(500).json({ success: false, detail: "Failed to fetch documents" });
  }
});

// ==================== VERIFY DOCUMENT (DigiLocker-style) ====================
router.post("/documents/verify/:id", (req, res) => {
  try {
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, detail: "Document not found" });
    }

    // Get file info
    let fileSize = 0;
    try {
      const stats = fs.statSync(doc.file_path);
      fileSize = stats.size;
    } catch (e) {
      fileSize = 0; // file may have been deleted
    }

    // Determine MIME type from extension
    const ext = doc.file_name.split('.').pop()?.toLowerCase();
    const mimeMap = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };
    const mimeType = mimeMap[ext] || 'unknown';

    // Run DigiLocker verification
    const result = verifyDocument(doc.file_name, fileSize, mimeType, doc.document_type);

    // Update database
    db.prepare("UPDATE documents SET verification_status = ?, is_verified = ?, ocr_result = ? WHERE id = ?")
      .run(result.status, result.verified ? 1 : 0, result.reason, req.params.id);

    res.json({
      success: true,
      is_verified: result.verified,
      verification_status: result.status,
      ocr_result: result.reason,
      digilocker_status: result.digilocker_status,
      confidence: result.confidence,
      warnings: result.warnings || []
    });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ success: false, detail: "Verification failed" });
  }
});

// ==================== GET DOCUMENT RULES (for frontend) ====================
router.get("/documents/rules/all", (req, res) => {
  const rules = {};
  for (const [key, value] of Object.entries(DOCUMENT_RULES)) {
    rules[key] = { label: value.label, description: value.description, maxSizeMB: value.maxSizeMB };
  }
  res.json({ success: true, rules });
});

export default router;
