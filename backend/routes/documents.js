import express from "express";
import db from "../db.js";
import { v4 as uuidv4 } from "uuid";
import { upload } from "../middleware/upload.js";
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import Tesseract from "tesseract.js";
import { notifyDocumentVerified } from "../utils/notifications.js";

const require = createRequire(import.meta.url);
const pdfParseModule = require("pdf-parse");
const PDFParse = pdfParseModule.PDFParse || pdfParseModule;

const router = express.Router();

// ==================== Document Verification Rules ====================
// Each document type now has CONTENT keywords that must be found INSIDE the document,
// not just in the filename. This prevents fake documents from passing.
const DOCUMENT_RULES = {
  '10th_marksheet': {
    label: '10th Marksheet',
    filenameKeywords: ['marksheet', 'mark', 'result', '10th', 'ssc', 'tenth', 'secondary', 'board', 'class x', 'class-x', 'matric'],
    contentKeywords: {
      required: ['mark', 'subject', 'board', 'गुणपत्रिका', 'विषय', 'मंडळ'],
      strong: ['marksheet', 'statement of marks', 'secondary', 'examination', 'roll no', 'seat no', 'total', 'result', 'grade', 'pass', 'division', 'board of secondary', 'ssc', 'cbse', 'icse', 'state board', 'maharashtra', 'certificate',
        // Marathi
        'गुणपत्रिका', 'माध्यमिक', 'परीक्षा', 'गुण', 'एकूण', 'उत्तीर्ण', 'अनुत्तीर्ण', 'श्रेणी', 'विभाग', 'बैठक क्रमांक', 'अनुक्रमांक', 'प्रमाणपत्र', 'महाराष्ट्र राज्य', 'शिक्षण'],
      governmentMarkers: ['government', 'board of', 'ministry', 'education', 'controller of examination', 'registration', 'seal', 'secretary', 'chairman', 'director',
        'शासन', 'मंडळ', 'शिक्षण विभाग', 'सचिव', 'अध्यक्ष', 'संचालक', 'महाराष्ट्र'],
      minRequiredMatches: 2,
      minStrongMatches: 3,
      minGovtMatches: 1
    },
    acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    maxSizeMB: 5,
    description: 'Class 10 / SSC / Matriculation marksheet or result document'
  },
  '12th_marksheet': {
    label: '12th Marksheet',
    filenameKeywords: ['marksheet', 'mark', 'result', '12th', 'hsc', 'twelfth', 'senior secondary', 'intermediate', 'board', 'class xii', 'class-xii', 'plus two'],
    contentKeywords: {
      required: ['mark', 'subject', 'board', 'गुणपत्रिका', 'विषय', 'मंडळ'],
      strong: ['marksheet', 'statement of marks', 'senior secondary', 'higher secondary', 'examination', 'roll no', 'seat no', 'total', 'result', 'grade', 'pass', 'division', 'hsc', 'cbse', 'icse', 'intermediate', 'certificate', '12th', 'xii',
        'गुणपत्रिका', 'उच्च माध्यमिक', 'परीक्षा', 'गुण', 'एकूण', 'उत्तीर्ण', 'श्रेणी', 'प्रमाणपत्र', 'महाराष्ट्र राज्य'],
      governmentMarkers: ['government', 'board of', 'ministry', 'education', 'controller of examination', 'registration', 'seal', 'secretary', 'chairman', 'director',
        'शासन', 'मंडळ', 'शिक्षण विभाग', 'सचिव', 'महाराष्ट्र'],
      minRequiredMatches: 2,
      minStrongMatches: 3,
      minGovtMatches: 1
    },
    acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    maxSizeMB: 5,
    description: 'Class 12 / HSC / Intermediate marksheet or result document'
  },
  'aadhar': {
    label: 'Aadhaar Card',
    filenameKeywords: ['aadhar', 'aadhaar', 'uid', 'uidai', 'unique identification', 'enrolment'],
    contentKeywords: {
      required: ['aadhaar', 'government of india', 'आधार', 'भारत सरकार'],
      strong: ['aadhaar', 'aadhar', 'unique identification', 'uidai', 'government of india', 'date of birth', 'dob', 'male', 'female', 'address', 'vid', 'enrolment',
        'आधार', 'भारत सरकार', 'जन्म तारीख', 'पुरुष', 'स्त्री', 'महिला', 'पत्ता'],
      governmentMarkers: ['government of india', 'uidai', 'unique identification authority', 'help@uidai', 'aadhaar',
        'भारत सरकार', 'आधार'],
      minRequiredMatches: 1,
      minStrongMatches: 3,
      minGovtMatches: 1
    },
    acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    maxSizeMB: 2,
    description: 'Aadhaar Card issued by UIDAI'
  },
  'income_certificate': {
    label: 'Income Certificate',
    filenameKeywords: ['income', 'certificate', 'annual income', 'salary', 'revenue', 'tahsildar', 'utpanna', 'dakhla'],
    contentKeywords: {
      required: ['income', 'certificate', 'उत्पन्न', 'दाखला', 'प्रमाणपत्र'],
      strong: ['income certificate', 'annual income', 'family income', 'tahsildar', 'revenue', 'district', 'taluka', 'certified', 'certify', 'hereby', 'per annum', 'annual', 'rupees', 'rs', 'lakh', 'salary', 'earning',
        // Marathi
        'उत्पन्न', 'उत्पन्नाचा दाखला', 'दाखला', 'प्रमाणपत्र', 'वार्षिक उत्पन्न', 'कौटुंबिक उत्पन्न', 'तहसीलदार', 'तलाठी', 'महसूल', 'जिल्हा', 'तालुका', 'प्रमाणित', 'रुपये', 'रु', 'लाख', 'वार्षिक', 'कुटुंब', 'मासिक',
        // Hindi
        'आय प्रमाण पत्र', 'आय', 'वार्षिक आय', 'तहसीलदार', 'जिला', 'प्रमाणित'],
      governmentMarkers: ['government', 'revenue department', 'tahsildar', 'collector', 'district', 'office of', 'state government', 'seal', 'signature', 'authority', 'competent authority', 'certified copy', 'tehsildar', 'sub-divisional', 'magistrate',
        // Marathi
        'शासन', 'महसूल विभाग', 'तहसीलदार', 'जिल्हाधिकारी', 'जिल्हा', 'कार्यालय', 'महाराष्ट्र शासन', 'शिक्का', 'सही', 'प्राधिकारी', 'सक्षम अधिकारी', 'उपविभागीय अधिकारी', 'नायब तहसीलदार', 'मंडळ अधिकारी',
        'सरकार', 'राज्य सरकार'],
      minRequiredMatches: 1,
      minStrongMatches: 2,
      minGovtMatches: 1
    },
    acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    maxSizeMB: 3,
    description: 'Income certificate issued by Tahsildar / Revenue department'
  },
  'caste_certificate': {
    label: 'Caste Certificate',
    filenameKeywords: ['caste', 'certificate', 'community', 'category', 'sc', 'st', 'obc', 'bc', 'scheduled', 'jati', 'dakhla'],
    contentKeywords: {
      required: ['caste', 'certificate', 'जात', 'जाती', 'दाखला', 'प्रमाणपत्र'],
      strong: ['caste certificate', 'community certificate', 'scheduled caste', 'scheduled tribe', 'obc', 'other backward', 'category', 'belongs to', 'hereby certify', 'certified', 'community', 'sc', 'st', 'bc',
        // Marathi
        'जात', 'जाती', 'जातीचा दाखला', 'दाखला', 'प्रमाणपत्र', 'अनुसूचित जाती', 'अनुसूचित जमाती', 'इतर मागास वर्ग', 'मागास', 'प्रवर्ग', 'समाज', 'प्रमाणित', 'जात पडताळणी',
        // Hindi
        'जाति प्रमाण पत्र', 'जाति', 'अनुसूचित जाति', 'अनुसूचित जनजाति', 'अन्य पिछड़ा वर्ग'],
      governmentMarkers: ['government', 'district', 'collector', 'tahsildar', 'office', 'competent authority', 'seal', 'state government', 'sub-divisional', 'magistrate', 'certificate number',
        // Marathi
        'शासन', 'जिल्हा', 'जिल्हाधिकारी', 'तहसीलदार', 'कार्यालय', 'सक्षम अधिकारी', 'महाराष्ट्र शासन', 'उपविभागीय अधिकारी', 'दाखला क्रमांक', 'शिक्का',
        'सरकार', 'राज्य सरकार'],
      minRequiredMatches: 1,
      minStrongMatches: 2,
      minGovtMatches: 1
    },
    acceptedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    maxSizeMB: 3,
    description: 'Caste / Community certificate issued by competent authority'
  }
};

// ==================== Extract text from any document (PDF or Image) ====================
async function extractDocumentText(filePath, mimeType) {
  let extractedText = '';

  if (!fs.existsSync(filePath)) {
    return { text: '', method: 'none', error: 'File not found on disk' };
  }

  // PDF: use pdf-parse
  if (mimeType === 'application/pdf') {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParseModule(dataBuffer);
      extractedText = pdfData.text || '';
      
      if (extractedText.trim().length > 10) {
        return { text: extractedText, method: 'pdf-parse' };
      }
      // If PDF has no embedded text (scanned PDF), we return what we have (Tesseract cannot read PDFs)
      return { text: extractedText, method: 'pdf-parse-limited' };
    } catch (e) {
      console.error("PDF parse failed:", e.message);
      // For PDFs that fail parsing, return empty — Tesseract cannot handle PDFs
      return { text: '', method: 'pdf-parse-failed', error: e.message };
    }
  }

  // Image ONLY: use Tesseract OCR with English + Marathi + Hindi
  if (mimeType.startsWith('image/')) {
    try {
      console.log(`🔍 Running OCR (eng+mar+hin) on image: ${filePath}`);
      const { data } = await Tesseract.recognize(filePath, 'eng+mar+hin', {
        logger: () => {} // silent
      });
      extractedText = data.text || '';
      return { text: extractedText, method: 'tesseract-ocr', confidence: data.confidence };
    } catch (e) {
      console.error("Tesseract OCR failed:", e.message);
      return { text: '', method: 'ocr-failed', error: e.message };
    }
  }

  return { text: extractedText, method: 'pdf-parse' };
}

// ==================== Content-Based Verification Logic ====================
function verifyDocumentContent(fileName, fileSize, mimeType, documentType, contentText) {
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

  // ---- STEP 1: Basic file checks (MIME, size, extension) ----
  const normalizedMime = mimeType?.toLowerCase() || '';
  if (!rules.acceptedMimeTypes.some(t => normalizedMime.includes(t.split('/')[1]))) {
    errors.push(`Invalid file format. Accepted: PDF, JPG, PNG only.`);
  } else {
    confidence += 5;
  }

  const maxBytes = rules.maxSizeMB * 1024 * 1024;
  if (fileSize > maxBytes) {
    errors.push(`File too large. Maximum ${rules.maxSizeMB}MB allowed for ${rules.label}.`);
  } else {
    confidence += 5;
  }

  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
    errors.push('Invalid file extension. Only PDF, JPG, and PNG files are accepted.');
  }

  // ---- STEP 2: CONTENT ANALYSIS (the critical part) ----
  const contentLower = (contentText || '').toLowerCase();
  const contentRules = rules.contentKeywords;

  // Check if we got any text at all
  if (contentLower.trim().length < 20) {
    warnings.push(
      `Content verification incomplete: Could not extract readable text from the document. ` +
      `This often happens with scanned PDFs or blurry images. ` +
      `Your document has been sent to the admin for manual verification.`
    );
    return {
      verified: false,
      status: 'pending',
      reason: `Could not extract text. Sent for manual verification.`,
      warnings,
      digilocker_status: 'MANUAL_VERIFICATION_REQUIRED',
      confidence: 0
    };
  }

  // 2a. Required keyword matches
  const requiredMatches = contentRules.required.filter(kw => contentLower.includes(kw.toLowerCase()));
  const requiredScore = requiredMatches.length;

  // 2b. Strong keyword matches
  const strongMatches = contentRules.strong.filter(kw => contentLower.includes(kw.toLowerCase()));
  const strongScore = strongMatches.length;

  // 2c. Government/official markers
  const govtMatches = contentRules.governmentMarkers.filter(kw => contentLower.includes(kw.toLowerCase()));
  const govtScore = govtMatches.length;

  console.log(`\n📄 Content Analysis for ${rules.label}:`);
  console.log(`   Required keyword hits: ${requiredScore}/${contentRules.minRequiredMatches} (${requiredMatches.join(', ')})`);
  console.log(`   Strong keyword hits: ${strongScore}/${contentRules.minStrongMatches} (${strongMatches.join(', ')})`);
  console.log(`   Govt marker hits: ${govtScore}/${contentRules.minGovtMatches} (${govtMatches.join(', ')})`);

  // Evaluate content match
  const passedRequired = requiredScore >= contentRules.minRequiredMatches;
  const passedStrong = strongScore >= contentRules.minStrongMatches;
  const passedGovt = govtScore >= contentRules.minGovtMatches;

  if (!passedRequired) {
    errors.push(
      `Content verification failed: The document content does not match a ${rules.label}. ` +
      `Expected to find keywords like: ${contentRules.required.join(', ')}. ` +
      `Found only: ${requiredMatches.length > 0 ? requiredMatches.join(', ') : 'none'}. ` +
      `Please upload an authentic ${rules.label}.`
    );
  }

  if (!passedStrong) {
    errors.push(
      `Document authenticity check failed: Insufficient matching content for ${rules.label}. ` +
      `The document does not contain enough indicators of a genuine ${rules.label} ` +
      `(found ${strongScore} of minimum ${contentRules.minStrongMatches} required indicators).`
    );
  }

  if (!passedGovt) {
    warnings.push(
      `Warning: No government/official authority markers found. ` +
      `Authentic ${rules.label} documents should contain references to issuing government authority.`
    );
    // This is a warning, not a hard error — but it lowers confidence significantly
    if (!passedRequired || !passedStrong) {
      errors.push(`No official government markers detected in document content.`);
    }
  }

  // Calculate confidence based on content matches
  confidence += Math.min(requiredScore * 15, 30);   // up to 30
  confidence += Math.min(strongScore * 5, 30);       // up to 30
  confidence += Math.min(govtScore * 10, 20);        // up to 20
  confidence = Math.min(confidence, 100);

  // If content checks failed, reject
  if (errors.length > 0) {
    return {
      verified: false,
      status: 'rejected',
      reason: errors.join(' | '),
      warnings,
      digilocker_status: 'CONTENT_VERIFICATION_FAILED',
      confidence: Math.min(confidence, 25)
    };
  }

  // ---- STEP 3: Extract additional data from verified documents ----
  let finalReason = `${rules.label} VERIFIED — Content analysis passed. ` +
    `Matched: ${requiredMatches.join(', ')} | Official markers: ${govtMatches.join(', ')}.`;

  const extractedData = {};

  // Extract percentage from marksheets
  if (['10th_marksheet', '12th_marksheet'].includes(documentType)) {
    let extractedPercentage = 0;
    let foundRealPct = false;

    if (contentText) {
      // 1. Look for direct percentage
      const kwMatch = contentText.match(/(?:percentage|percent|aggregate|total percent)[\s:a-zA-Z\-]{0,20}?([0-9]{2,3}(?:\.[0-9]+)?)(?!\d)/i);
      const pctSymbolMatch = contentText.match(/([0-9]{2,3}(?:\.[0-9]+)?)\s*%/i);
      
      // 2. Look for obtained/total marks
      const obtainedMatch = contentText.match(/(?:obtained|marks obtained|total marks obtained|score|grand total)[\s:a-zA-Z\-]{0,20}?(\d{3})/i);
      const totalMatch = contentText.match(/(?:out of|total marks|maximum marks|max marks)[\s:a-zA-Z\-]{0,20}?(\d{3})/i);
      
      // 3. Look for fraction like 540/600
      const fractionMatch = contentText.match(/([0-9]{2,4})\s*\/\s*([0-9]{3,4})/);
      
      // 4. Look for CGPA
      const cgpaMatch = contentText.match(/(?:cgpa|sgpa|gpa|point average)[\s:a-zA-Z\-]{0,10}?([0-9](?:\.[0-9]+)?)/i);

      let rawVal = null;
      if (kwMatch && kwMatch[1]) {
        rawVal = parseFloat(kwMatch[1]);
      } else if (pctSymbolMatch && pctSymbolMatch[1]) {
        rawVal = parseFloat(pctSymbolMatch[1]);
      } else if (fractionMatch && parseFloat(fractionMatch[2]) > 0) {
        const obtained = parseFloat(fractionMatch[1]);
        const max = parseFloat(fractionMatch[2]);
        if (obtained <= max) rawVal = (obtained / max) * 100;
      } else if (obtainedMatch && totalMatch) {
        const obtained = parseFloat(obtainedMatch[1]);
        const max = parseFloat(totalMatch[1]);
        if (obtained <= max && max > 0) rawVal = (obtained / max) * 100;
      } else if (cgpaMatch && parseFloat(cgpaMatch[1]) <= 10) {
        rawVal = parseFloat(cgpaMatch[1]) * 9.5;
      }

      if (rawVal !== null && rawVal > 0 && rawVal <= 100) {
        extractedPercentage = rawVal;
        foundRealPct = true;
      }
    }

    if (foundRealPct) {
      extractedPercentage = parseFloat(extractedPercentage.toFixed(2));
      extractedData.percentage = extractedPercentage;
      finalReason += ` Extracted Percentage: ${extractedPercentage}%`;
    } else {
      finalReason += ` Extracted Percentage: Could not extract from content.`;
    }

    // Try to extract board
    const boardMatch = contentText.match(/(?:board of|secondary education|state board|cbse|icse)[\s:a-zA-Z]*?([a-zA-Z\s]{4,30})/i);
    if (boardMatch) extractedData.board = boardMatch[1].trim();
  }

  // Extract UID pattern from Aadhaar
  if (documentType === 'aadhar') {
    const uidMatch = contentText.match(/(\d{4}\s?\d{4}\s?\d{4})/);
    if (uidMatch) {
      const masked = 'XXXX-XXXX-' + uidMatch[1].replace(/\s/g, '').slice(-4);
      extractedData.uid_last4 = masked;
      finalReason += ` UID: ${masked}`;
    }
    const dobMatch = contentText.match(/(?:dob|date of birth|birth|जन्म)[\s:]*(\d{2}[\/-]\d{2}[\/-]\d{4})/i);
    if (dobMatch) {
      extractedData.dob = dobMatch[1];
      finalReason += ` | DOB: ${dobMatch[1]}`;
    }
  }

  // Extract Income
  if (documentType === 'income_certificate') {
    const incomeMatch = contentText.match(/(?:income|amount|rupees|rs\.?|एकूण उत्पन्न)[\s:a-zA-Z\-]{0,20}?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i);
    if (incomeMatch) {
      extractedData.income_amount = incomeMatch[1].replace(/,/g, '');
      finalReason += ` | Income: ${extractedData.income_amount}`;
    }
  }

  return {
    verified: true,
    status: 'verified',
    reason: finalReason,
    warnings,
    digilocker_status: 'VERIFIED',
    confidence,
    extractedData,
    matchedPatterns: [...new Set([...requiredMatches, ...strongMatches, ...govtMatches])]
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

// ==================== DELETE DOCUMENT ====================
router.delete("/documents/:id", (req, res) => {
  try {
    const docId = req.params.id;
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);

    if (!doc) {
      return res.status(404).json({ success: false, detail: "Document not found" });
    }

    // Try to remove from filesystem if exists
    try {
      if (fs.existsSync(doc.file_path)) {
        fs.unlinkSync(doc.file_path);
      }
    } catch (e) {
      console.error("Failed to delete file from disk:", e);
    }

    // Remove from DB
    db.prepare("DELETE FROM documents WHERE id = ?").run(docId);

    res.json({ success: true, detail: "Document deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false, detail: "Failed to delete document" });
  }
});

// ==================== VERIFY DOCUMENT (Content-Based Analysis) ====================
router.post("/documents/verify/:id", async (req, res) => {
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
      fileSize = 0;
    }

    // Determine MIME type from extension
    const ext = doc.file_name.split('.').pop()?.toLowerCase();
    const mimeMap = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };
    const mimeType = mimeMap[ext] || 'unknown';

    // STEP 1: Extract text from document (PDF text extraction + Tesseract OCR for images)
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 VERIFYING: ${doc.file_name} (type: ${doc.document_type})`);
    const extraction = await extractDocumentText(doc.file_path, mimeType);
    console.log(`📝 Extraction method: ${extraction.method}`);
    console.log(`📝 Extracted ${extraction.text.length} characters of text`);
    if (extraction.text.length > 0) {
      console.log(`📝 Preview: "${extraction.text.substring(0, 200).replace(/\n/g, ' ')}..."`);
    }

    // STEP 2: Run content-based verification
    const result = verifyDocumentContent(doc.file_name, fileSize, mimeType, doc.document_type, extraction.text);
    console.log(`✅ Result: ${result.status} (confidence: ${result.confidence}%)`);
    console.log(`${'='.repeat(60)}\n`);

    // Update database for document
    db.prepare("UPDATE documents SET verification_status = ?, is_verified = ?, ocr_result = ? WHERE id = ?")
      .run(result.status, result.verified ? 1 : 0, result.reason, req.params.id);

    // If verified, update user profile data
    if (result.verified && result.extractedData) {
      const data = result.extractedData;
      if (doc.document_type === 'income_certificate' && data.income_amount) {
        db.prepare("UPDATE users SET annual_income = ? WHERE id = ?").run(data.income_amount, doc.user_id);
      }
      if (doc.document_type === '10th_marksheet' && data.percentage) {
        db.prepare("UPDATE users SET marks_10th = ?, marks_percentage = ? WHERE id = ?").run(data.percentage, data.percentage, doc.user_id);
      }
      if (doc.document_type === '12th_marksheet' && data.percentage) {
        db.prepare("UPDATE users SET marks_12th = ?, marks_percentage = ? WHERE id = ?").run(data.percentage, data.percentage, doc.user_id);
      }
      if (doc.document_type === 'aadhar' && data.dob) {
        db.prepare("UPDATE users SET dob = ? WHERE id = ?").run(data.dob, doc.user_id);
      }
    }

    res.json({
      success: true,
      is_verified: result.verified,
      verification_status: result.status,
      ocr_result: result.reason,
      digilocker_status: result.digilocker_status,
      confidence: result.confidence,
      warnings: result.warnings || [],
      extraction_method: extraction.method,
      extractedData: result.extractedData
    });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ success: false, detail: "Verification failed" });
  }
});

// ==================== ADMIN: GET PENDING DOCUMENTS ====================
router.get("/documents/admin/pending", (req, res) => {
  try {
    const docs = db.prepare(`
      SELECT d.*, u.full_name as student_name, u.email as student_email, u.college_name 
      FROM documents d 
      JOIN users u ON d.user_id = u.id 
      WHERE d.verification_status = 'pending' 
      ORDER BY d.uploaded_at ASC
    `).all();
    res.json({ success: true, documents: docs });
  } catch (err) {
    res.status(500).json({ success: false, detail: "Failed to fetch pending documents" });
  }
});

// ==================== ADMIN: MANUAL VERIFY DOCUMENT ====================
router.post("/documents/admin/verify/:id", async (req, res) => {
  try {
    const { status } = req.body; // 'verified' or 'rejected'
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, detail: "Invalid status. Use 'verified' or 'rejected'." });
    }

    const docId = req.params.id;
    const isVerified = status === 'verified' ? 1 : 0;
    
    let ocrSuffix = '';
    if (status === 'rejected') {
       ocrSuffix = " | Admin Rejected: Invalid or incorrect document.";
    } else {
       ocrSuffix = " | Admin Approved.";
    }

    // Get document info before updating (for notification)
    const doc = db.prepare("SELECT user_id, document_type FROM documents WHERE id = ?").get(docId);

    db.prepare(`
      UPDATE documents 
      SET verification_status = ?, is_verified = ?, 
          ocr_result = COALESCE(ocr_result, '') || ? 
      WHERE id = ?
    `).run(status, isVerified, ocrSuffix, docId);

    // Send push notification to the student
    if (doc) {
      notifyDocumentVerified(doc.user_id, doc.document_type, status).catch(() => {});
    }

    res.json({ success: true, message: `Document ${status} successfully` });
  } catch (err) {
    console.error("Admin verify error:", err);
    res.status(500).json({ success: false, detail: "Failed to update document status" });
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
