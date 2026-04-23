import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GraduationCap, FileText, BookOpen, LogOut, User, Award, Briefcase, Bell, X } from 'lucide-react';
import { t } from '@/lib/i18n';
import { auth, messaging } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const API = `${BACKEND_URL}/api`;

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const lang = localStorage.getItem('language') || 'en';

  const [stats, setStats] = useState({ total_scholarships: 0, communities: [], education_levels: [] });
  const [documents, setDocuments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notification, setNotification] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/scholarships/stats`);
      if (res.data.success) setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchDocuments = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`${API}/documents/${user.id}`);
      if (res.data.success) setDocuments(res.data.documents);
    } catch (err) { console.error(err); }
  }, [user?.id]);

  const fetchApplications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`${API}/applications/${user.id}`);
      if (res.data.success) setApplications(res.data.applications);
    } catch (err) { console.error(err); }
  }, [user?.id]);

  useEffect(() => {
    fetchStats();
    fetchDocuments();
    fetchApplications();
  }, [fetchDocuments, fetchApplications]);

  // ===== Firebase Cloud Messaging Setup =====
  useEffect(() => {
    async function setupFCM() {
      try {
        if (!messaging) return;

        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('🔕 Notification permission denied');
          return;
        }

        // Get FCM token
        const fcmToken = await getToken(messaging, {
          vapidKey: undefined // Will use default; generate VAPID key in Firebase Console for production
        });

        if (fcmToken) {
          console.log('🔔 FCM Token obtained');

          // Send token to backend
          const idToken = await auth.currentUser?.getIdToken();
          if (idToken) {
            await axios.post(`${API}/auth/fcm-token`, { token: fcmToken }, {
              headers: { Authorization: `Bearer ${idToken}` }
            });
            console.log('✅ FCM token saved to backend');
          }
        }

        // Listen for foreground messages
        onMessage(messaging, (payload) => {
          console.log('📩 Foreground notification:', payload);
          setNotification({
            title: payload.notification?.title || 'New Notification',
            body: payload.notification?.body || '',
          });

          // Auto-dismiss after 8 seconds
          setTimeout(() => setNotification(null), 8000);

          // Refresh data when notification arrives
          fetchDocuments();
          fetchApplications();
        });
      } catch (err) {
        console.log('⚠️ FCM setup skipped:', err.message);
      }
    }

    setupFCM();
  }, [fetchDocuments, fetchApplications]);

  const handleLogout = () => { if (onLogout) onLogout(); navigate('/'); };
  const verifiedDocs = documents.filter(d => d.is_verified).length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Push Notification Toast */}
      {notification && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-right-5 duration-300 max-w-sm">
          <div className="bg-white border border-blue-200 shadow-2xl rounded-2xl p-5 flex items-start gap-4">
            <div className="bg-blue-100 p-2.5 rounded-xl flex-shrink-0">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 font-bold text-sm">{notification.title}</p>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">{notification.body}</p>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tricolor Accent Bar */}
      <div className="h-2 w-full flex fixed top-0 z-50">
        <div className="flex-1 bg-orange-500"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-green-600"></div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 mt-2 sticky top-2 z-40 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2.5 rounded-xl shadow-md">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">{t('scholarship_portal', lang)}</h1>
                <p className="text-sm font-medium text-slate-500">
                  {t('welcome', lang)}, <span className="text-blue-600 font-bold">{user?.full_name}</span>!
                  {user?.dob && (
                    <span className="ml-2 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold uppercase border border-emerald-200">
                      Age: {new Date().getFullYear() - new Date(user.dob).getFullYear()}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-600 font-bold hover:bg-slate-100 flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors border border-slate-200 shadow-sm">
              <LogOut className="h-4 w-4" />{t('logout', lang)}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {[
            { label: t('total_scholarships', lang), value: stats.total_scholarships, icon: Award, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { label: t('verified_docs', lang), value: `${verifiedDocs}/${documents.length}`, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { label: t('pending', lang), value: documents.filter(d => d.verification_status === 'pending').length, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          ].map((stat, i) => (
            <div key={i} className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-colors`}>
              <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-50 ${stat.bg} pointer-events-none transition-transform group-hover:scale-110`}></div>
              <div className="flex justify-between items-start mb-3 relative z-10">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                <div className={`${stat.bg} p-2 rounded-lg`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <div className="text-4xl font-black text-slate-800 tracking-tighter relative z-10">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: t('browse_scholarships', lang), desc: t('explore_scholarships_desc', lang), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', hover: 'hover:border-blue-300 hover:shadow-blue-500/10', path: '/scholarships' },
            { title: t('explore_benefits', lang), desc: t('student_offers_desc', lang), icon: Award, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100', hover: 'hover:border-indigo-300 hover:shadow-indigo-500/10', path: '/benefits' },
            { title: t('upload_documents', lang), desc: t('upload_verify_desc', lang), icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', hover: 'hover:border-emerald-300 hover:shadow-emerald-500/10', path: '/documents' },
            { title: t('view_profile', lang), desc: t('track_eligibility_desc', lang), icon: User, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', hover: 'hover:border-amber-300 hover:shadow-amber-500/10', path: '/profile' },
          ].map((action, i) => (
            <div key={i} onClick={() => navigate(action.path)}
              className={`bg-white border text-left rounded-2xl p-6 shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${action.hover} border-slate-200`}>
              <div className={`${action.bg} p-3 rounded-xl w-fit mb-4`}>
                <action.icon className={`h-6 w-6 ${action.color}`} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{action.title}</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">{action.desc}</p>
            </div>
          ))}
        </div>

        {/* Eligibility & Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2 relative z-10">
              <BookOpen className="h-5 w-5 text-emerald-500" /> {t('eligibility', lang)}
            </h3>
            <p className="text-slate-600 mb-6 font-medium leading-relaxed max-w-md relative z-10">
              Complete your profile and upload verified documents to unlock more scholarship opportunities instantly.
            </p>
            <div className="space-y-4 relative z-10">
              <div className="flex items-center text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className={`h-2.5 w-2.5 rounded-full mr-3 ${documents.length > 0 ? "bg-emerald-500" : "bg-red-500"}`}></span>
                <span className="font-bold text-sm">Target Documents Uploaded</span>
              </div>
              <div className="flex items-center text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className={`h-2.5 w-2.5 rounded-full mr-3 ${verifiedDocs > 0 ? "bg-emerald-500" : "bg-red-500"}`}></span>
                <span className="font-bold text-sm">Identity Verified by DigiLocker</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 shadow-md text-white relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <h3 className="text-2xl font-extrabold mb-3 tracking-tight relative z-10">Need Assistance?</h3>
            <p className="text-blue-100 font-medium mb-6 relative z-10 leading-relaxed">
              Our AI Assistant is available 24/7 to help you find the right scholarships and guide you through the application process.
            </p>
            <button className="bg-white text-blue-700 px-6 py-3 rounded-xl text-sm font-bold shadow-sm hover:scale-105 transition-transform uppercase tracking-widest relative z-10">
              Open Chat Support
            </button>
          </div>
        </div>

        <div className="mt-8 text-center border-t border-slate-200 pt-6">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                A Government of India Initiative Simulator • Secure & Verified
            </p>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;