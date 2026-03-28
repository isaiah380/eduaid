import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, ChevronRight } from 'lucide-react';

// ==================== EduAid Chatbot Knowledge Base ====================
const KNOWLEDGE_BASE = [
  // Greetings
  { patterns: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'namaste', 'hola'],
    response: "Hello! 👋 Welcome to EduAid. I'm here to help you navigate the portal. You can ask me about scholarships, document upload, eligibility, or how to use any feature. What would you like to know?",
    category: 'greeting' },

  // What is EduAid
  { patterns: ['what is eduaid', 'about eduaid', 'what does this portal do', 'what is this', 'about this portal'],
    response: "🎓 **EduAid** is a comprehensive scholarship and education aid portal for Indian college students. It helps you:\n\n• Browse **55+ scholarships** with eligibility filters\n• Upload and verify documents via **DigiLocker**\n• Track your scholarship **applications**\n• Access **25+ student benefits** and offers\n• Support for **8 Indian languages**",
    category: 'about' },

  // How to register
  { patterns: ['how to register', 'create account', 'sign up', 'new account', 'registration', 'how to sign up'],
    response: "📝 **How to Register:**\n\n1. Go to the **home page** and click **\"Student\"**\n2. Click **\"Register here\"** on the login page\n3. Fill in your details (name, email, phone, college, password)\n4. Enter your **12th grade exam date** (must be ≤ Feb 2026)\n5. Click **\"Send OTP\"** — an OTP is sent to your email\n6. Enter the **6-digit OTP** to verify your email\n7. Select your **preferred language** and you're in! 🎉\n\n💡 *Tip: Check the backend terminal for the OTP code during testing.*",
    category: 'registration' },

  // How to login
  { patterns: ['how to login', 'login', 'sign in', 'cant login', 'login not working', 'forgot password'],
    response: "🔐 **How to Login:**\n\n1. Go to the home page → Click **\"Student\"** or **\"Admin\"**\n2. Enter your **phone number** and **password**\n3. Click **Login**\n\n**Admin credentials:** Phone `9999999999`, Password `admin123`\n\n⚠️ If login fails, make sure you've registered first and have the correct phone/password.",
    category: 'login' },

  // Scholarships
  { patterns: ['scholarships', 'how to find scholarship', 'browse scholarship', 'search scholarship', 'available scholarship', 'which scholarship'],
    response: "🎯 **Finding Scholarships:**\n\n1. Go to **Dashboard** → Click **\"Browse Scholarships\"**\n2. Use **filters** to narrow by:\n   - 📚 Education level (UG/PG/Doctorate)\n   - 👥 Community (General/OBC/SC-ST/Minority)\n   - 🏷️ Type (Merit/Need/Minority/Girl Child)\n3. Click **\"View Information\"** to see eligibility criteria\n4. Click **\"Apply & Track\"** to submit an application\n\nWe have **55+ real Indian scholarships** with official portal links!",
    category: 'scholarships' },

  // Eligibility
  { patterns: ['eligibility', 'am i eligible', 'eligibility criteria', 'who can apply', 'qualification', 'requirements'],
    response: "📋 **Eligibility Criteria:**\n\nEach scholarship has different criteria including:\n- **Education level** (UG, PG, Doctorate)\n- **Min percentage** (e.g., 60% or 75%)\n- **Annual income limit** (e.g., ₹2.5L, ₹5L, ₹8L)\n- **Community** (General, OBC, SC/ST, Minority)\n- **Age range** (e.g., 17-25 years)\n\n👉 Click **\"View Information\"** on any scholarship to see its full criteria.\n\n**Prerequisite:** You must have passed 12th grade on or before Feb 2026.",
    category: 'eligibility' },

  // Document upload
  { patterns: ['document', 'upload document', 'how to upload', 'digilocker', 'verify document', 'verification'],
    response: "📄 **Document Upload & DigiLocker Verification:**\n\n1. Go to **Dashboard** → **\"Upload Documents\"**\n2. Select the document type (10th/12th marksheet, Aadhaar, etc.)\n3. **Important:** Name your file correctly!\n   - 12th marksheet → `12th_marksheet_result.pdf`\n   - Aadhaar → `aadhaar_card.pdf`\n4. Upload and click **\"Verify via DigiLocker\"**\n\n⚠️ **DigiLocker will reject** files that don't match the selected type. Random files uploaded as marksheets WILL be rejected.",
    category: 'documents' },

  // Benefits
  { patterns: ['benefits', 'student benefits', 'offers', 'discounts', 'student offers', 'free stuff'],
    response: "🎁 **Student Benefits:**\n\n25+ benefits across categories:\n- 🎵 **Entertainment** (Spotify, YouTube Premium)\n- 💻 **Tech** (GitHub, JetBrains)\n- 📚 **Learning** (Coursera, Udemy)\n- 🍔 **Food** (Zomato, Swiggy discounts)\n- ✈️ **Travel** (student rail/bus passes)\n\nGo to **Dashboard** → **\"Explore Student Benefits\"** to browse and claim!",
    category: 'benefits' },

  // Admin
  { patterns: ['admin', 'admin dashboard', 'college admin', 'admin login', 'admin features', 'admin panel'],
    response: "🏫 **Admin (College) Dashboard:**\n\n**Login:** Phone `9999999999`, Password `admin123`\n\nFeatures:\n- 📊 **Overview** — Total scholarships, students, applications\n- 🔍 **Track by College** — Search applications by college name\n- 📋 **Manage Scholarships** — Add or delete scholarships\n- 👥 **View Students** — See all registered students\n\nAdmins can track which scholarships students from their college have availed.",
    category: 'admin' },

  // Profile
  { patterns: ['profile', 'my profile', 'track application', 'application status', 'my applications'],
    response: "👤 **Your Profile:**\n\nGo to **Dashboard** → **\"View Profile\"** to:\n- See your personal details\n- Track all submitted **applications** and their status\n- View your **verified documents**\n- Check **eligibility** for different scholarships",
    category: 'profile' },

  // Language
  { patterns: ['language', 'change language', 'hindi', 'tamil', 'multilingual', 'translate'],
    response: "🌐 **Language Support:**\n\nEduAid supports 8 Indian languages:\n🇬🇧 English | 🇮🇳 Hindi | தமிழ் Tamil | తెలుగు Telugu\nಕನ್ನಡ Kannada | मराठी Marathi | বাংলা Bengali | ગુજરાતી Gujarati\n\nYou can choose your language right after login. All core UI elements are translated.",
    category: 'language' },

  // Navigation
  { patterns: ['navigate', 'where is', 'how to go', 'find', 'menu', 'pages', 'sections'],
    response: "🧭 **Portal Navigation:**\n\n**From Dashboard you can access:**\n- 📚 **Scholarships** — Browse & apply\n- 🎁 **Benefits** — Student offers\n- 📄 **Documents** — Upload & verify\n- 👤 **Profile** — Track applications\n\n**Quick tips:**\n- Use the ← **Back** button to return\n- **Logout** button is in the top-right corner\n- The role selection page is at the root `/`",
    category: 'navigation' },

  // Technical / Help
  { patterns: ['help', 'support', 'problem', 'issue', 'bug', 'not working', 'error', 'stuck'],
    response: "🛠️ **Need Help?**\n\nCommon solutions:\n1. **Login issues** → Make sure you've registered first\n2. **Document rejected** → Name your file to match the doc type (e.g., `12th_marksheet.pdf`)\n3. **OTP not received** → Check the backend terminal console\n4. **Page not loading** → Ensure both frontend (port 3000) and backend (port 5000) are running\n\nIf you're still stuck, try refreshing the page or clearing localStorage.",
    category: 'help' },

  // Thanks / Bye
  { patterns: ['thank', 'thanks', 'bye', 'goodbye', 'see you', 'ok thanks'],
    response: "You're welcome! 😊 Good luck with your scholarship applications. Feel free to ask anytime you need help. All the best! 🎓✨",
    category: 'farewell' },
];

const QUICK_QUESTIONS = [
  "How do I register?",
  "How to upload documents?",
  "What scholarships are available?",
  "How does DigiLocker work?",
  "Admin login credentials?",
];

function findAnswer(question) {
  const q = question.toLowerCase().trim();
  
  // Find best matching pattern
  let bestMatch = null;
  let bestScore = 0;
  
  for (const entry of KNOWLEDGE_BASE) {
    for (const pattern of entry.patterns) {
      const patternLower = pattern.toLowerCase();
      // Exact or near-exact match
      if (q === patternLower || q.includes(patternLower) || patternLower.includes(q)) {
        const score = patternLower.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = entry;
        }
      }
      // Word overlap
      const patternWords = patternLower.split(/\s+/);
      const questionWords = q.split(/\s+/);
      const overlap = patternWords.filter(w => questionWords.some(qw => qw.includes(w) || w.includes(qw))).length;
      const overlapScore = (overlap / patternWords.length) * patternLower.length;
      if (overlapScore > bestScore && overlap >= 1) {
        bestScore = overlapScore;
        bestMatch = entry;
      }
    }
  }

  if (bestMatch) return bestMatch.response;

  return "🤔 I'm not sure about that. Here are some things I can help with:\n\n• **Register/Login** — How to create an account or sign in\n• **Scholarships** — Browse, filter, and apply\n• **Documents** — Upload and DigiLocker verification\n• **Benefits** — Student offers and discounts\n• **Admin** — College administration features\n• **Navigation** — Finding pages and features\n\nTry asking about any of these topics!";
}

// ==================== Chatbot Component ====================
function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! 👋 I'm EduAid Assistant. Ask me anything about the portal — scholarships, registration, document upload, eligibility, or navigation.", time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg, time: new Date() }]);

    // Simulate typing delay
    setIsTyping(true);
    setTimeout(() => {
      const answer = findAnswer(userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: answer, time: new Date() }]);
      setIsTyping(false);
    }, 500 + Math.random() * 800);
  };

  const handleQuickQuestion = (q) => {
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q, time: new Date() }]);
    setIsTyping(true);
    setTimeout(() => {
      const answer = findAnswer(q);
      setMessages(prev => [...prev, { role: 'bot', text: answer, time: new Date() }]);
      setIsTyping(false);
    }, 500 + Math.random() * 800);
  };

  const formatMessage = (text) => {
    // Simple markdown-like formatting
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code class="bg-white/10 px-1 rounded text-blue-300">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-full shadow-2xl 
                     hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 hover:scale-110 group"
          aria-label="Open EduAid Assistant">
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            AI
          </span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[600px] bg-slate-900 border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ animation: 'slideUp 0.3s ease-out' }}>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">EduAid Assistant</h3>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-blue-200 text-xs">Always online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white p-1" aria-label="Close chat">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ maxHeight: '380px' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                    msg.role === 'user' ? 'bg-blue-500' : 'bg-indigo-500/30'
                  }`}>
                    {msg.role === 'user' ? <User className="h-3.5 w-3.5 text-white" /> : <Bot className="h-3.5 w-3.5 text-indigo-300" />}
                  </div>
                  <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-tr-sm'
                      : 'bg-white/10 text-blue-100 rounded-tl-sm border border-white/10'
                  }`}
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/30 flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-indigo-300" />
                  </div>
                  <div className="bg-white/10 rounded-2xl px-4 py-3 rounded-tl-sm border border-white/10">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 2 && (
            <div className="px-3 pb-2 flex-shrink-0">
              <p className="text-blue-400 text-xs mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map((q, i) => (
                  <button key={i} onClick={() => handleQuickQuestion(q)}
                    className="text-xs bg-white/5 border border-white/10 text-blue-300 px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-1">
                    <ChevronRight className="h-3 w-3" />{q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-white/10 px-3 py-2.5 flex gap-2 flex-shrink-0">
            <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-blue-400/50 focus:outline-none focus:border-blue-500" />
            <button onClick={handleSend} disabled={!input.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-30 text-white p-2 rounded-xl transition-colors"
              aria-label="Send message">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

export default Chatbot;
