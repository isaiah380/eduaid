import express from "express";
import db from "../db.js";

const router = express.Router();

// Keyword-based response system for the EduAid chatbot
const KNOWLEDGE_BASE = [
  {
    keywords: ["register", "sign up", "create account", "new account", "how to register"],
    response: `To register on EduAid:\n\n- Go to the home page and click "Student"\n- Click "Register here" on the login page\n- Fill in your Full Name, Email, Phone Number, College Name, Date of Birth, and 12th Exam Date\n- Create a password (minimum 6 characters)\n- Click "Create Student Account"\n\nAfter registration, you'll be redirected to your dashboard where you can start browsing scholarships!`
  },
  {
    keywords: ["login", "sign in", "log in", "cant login", "unable to login"],
    response: `To login to EduAid:\n\n- Go to the home page and select your role (Student, Admin, or Scholarship Portal)\n- Enter your registered email or phone number\n- Enter your password\n- Click "Login Securely"\n\nIf you forgot your password, please contact the admin to reset it.`
  },
  {
    keywords: ["document", "documents", "upload", "marksheet", "aadhar", "certificate", "income certificate", "caste certificate"],
    response: `Documents you can upload on EduAid:\n\n- Aadhaar Card (for identity & age verification)\n- Income Certificate (for income-based scholarships)\n- Caste Certificate (for category-based scholarships)\n- 10th Marksheet (academic records)\n- 12th Marksheet (academic records & percentage extraction)\n- Bank Passbook (for disbursement)\n- College ID (institutional verification)\n- Domicile Certificate (state residency proof)\n\nGo to the "Documents" section from your dashboard to upload. Our system uses OCR to automatically extract relevant information from your documents.`
  },
  {
    keywords: ["eligible", "eligibility", "qualify", "am i eligible", "check eligibility"],
    response: `Eligibility for scholarships is checked automatically based on your verified documents. The system considers:\n\n- Your academic percentage (from marksheets)\n- Annual family income (from income certificate)\n- Community/category (from caste certificate)\n- Age (from Aadhaar or date of birth)\n- Gender (for gender-specific scholarships)\n- Required documents specific to each scholarship\n\nMake sure all your documents are uploaded and verified to get accurate eligibility results!`
  },
  {
    keywords: ["apply", "application", "how to apply", "submit application", "apply scholarship"],
    response: `To apply for a scholarship:\n\n1. Go to "Scholarships" from your dashboard\n2. Browse available scholarships and check your eligibility\n3. Click on a scholarship you're eligible for\n4. Write a personal statement explaining why you deserve the scholarship\n5. Click "Submit Application"\n\nAfter applying, your application will be reviewed by the Scholarship Portal team and then forwarded to the college admin for final approval.`
  },
  {
    keywords: ["status", "track", "application status", "check status", "my application"],
    response: `To check your application status:\n\n- Go to "My Applications" from your dashboard\n- You'll see all your submitted applications with their current status:\n  - **Applied** — Your application has been submitted and is pending review\n  - **Approved** — Congratulations! Your application has been approved\n  - **Rejected** — Unfortunately, your application was not approved\n\nYou can also delete applications that are still in "Applied" status.`
  },
  {
    keywords: ["scholarship", "scholarships", "find scholarship", "available scholarship", "list scholarship", "engineering"],
    response: null // Will be dynamically generated with DB data
  },
  {
    keywords: ["verify", "verification", "verified", "pending verification", "not verified"],
    response: `Document verification process:\n\n1. Upload your documents in the "Documents" section\n2. Our OCR system will automatically scan and extract information\n3. Click "Request Verification" from your profile\n4. The Scholarship Portal team will review your documents\n5. You'll see the status update to "Verified" or "Rejected"\n\nYou must be verified before your scholarship applications can be approved.`
  },
  {
    keywords: ["benefit", "benefits", "discount", "student benefit", "perks"],
    response: `EduAid also lists student benefits and discounts!\n\nGo to the "Benefits" section from your dashboard to find:\n- Educational tool discounts\n- Software and technology offers\n- Book and course discounts\n- And more!\n\nThese are available to all registered students.`
  },
  {
    keywords: ["profile", "update profile", "my profile", "edit profile"],
    response: `To manage your profile:\n\n- Click "Profile" from your dashboard\n- You can update your annual income and academic marks\n- View your verification status\n- Request profile verification\n\nKeeping your profile updated ensures accurate eligibility checks for scholarships.`
  },
  {
    keywords: ["admin", "contact admin", "help", "support"],
    response: `For additional help:\n\n- Contact your college administration for scholarship-related queries\n- The Scholarship Portal team handles document verification\n- The College Admin handles final application approvals\n\nIf you're facing technical issues, try logging out and logging back in, or clearing your browser cache.`
  },
  {
    keywords: ["hello", "hi", "hey", "good morning", "good evening", "namaste"],
    response: `Hello! 👋 Welcome to EduAid Assistant!\n\nI can help you with:\n- Finding scholarships\n- Understanding the application process\n- Document upload guidance\n- Checking eligibility\n- Tracking application status\n\nWhat would you like to know?`
  },
  {
    keywords: ["thank", "thanks", "thank you", "bye", "goodbye"],
    response: `You're welcome! 😊 If you have any more questions, feel free to ask anytime. Good luck with your scholarship applications! 🎓`
  }
];

router.post("/chatbot/ask", (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, detail: "Query is required" });
    }

    const lowerQuery = query.toLowerCase().trim();
    let bestMatch = null;
    let bestScore = 0;

    // Score each knowledge base entry
    for (const entry of KNOWLEDGE_BASE) {
      let score = 0;
      for (const keyword of entry.keywords) {
        if (lowerQuery.includes(keyword)) {
          // Longer keyword matches are more valuable
          score += keyword.length;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    // Dynamic scholarship response
    if (bestMatch && bestMatch.response === null) {
      // Fetch scholarships from DB
      try {
        const scholarships = db.prepare("SELECT name, type, provider, amount, deadline FROM scholarships ORDER BY name ASC LIMIT 10").all();
        if (scholarships.length > 0) {
          let response = `Here are some available scholarships on EduAid:\n\n`;
          scholarships.forEach((s, i) => {
            response += `- **${s.name}**${s.provider ? ` by ${s.provider}` : ''}${s.amount ? ` — ${s.amount}` : ''}${s.deadline ? ` (Deadline: ${new Date(s.deadline).toLocaleDateString()})` : ''}\n`;
          });
          response += `\nGo to "Scholarships" in your dashboard to see the full list and check your eligibility!`;
          return res.json({ success: true, response });
        } else {
          return res.json({ success: true, response: "There are currently no scholarships listed. Please check back later or contact the admin." });
        }
      } catch (dbErr) {
        console.error("Chatbot DB error:", dbErr);
        return res.json({ success: true, response: "I can help you find scholarships! Please visit the Scholarships section in your dashboard to browse all available options." });
      }
    }

    if (bestMatch && bestScore > 0) {
      return res.json({ success: true, response: bestMatch.response });
    }

    // Default fallback response
    const fallbackResponse = `I'm not sure about that specific question, but here's what I can help you with:\n\n- **"How do I register?"** — Account creation steps\n- **"What documents are needed?"** — Required documents list\n- **"Find me scholarships"** — Available scholarship listings\n- **"How to apply?"** — Application process\n- **"Check my eligibility"** — Eligibility criteria\n- **"Track my application"** — Application status\n- **"What are the benefits?"** — Student benefits & discounts\n\nTry asking one of these questions!`;

    res.json({ success: true, response: fallbackResponse });
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ success: false, detail: "Chatbot processing failed" });
  }
});

export default router;
