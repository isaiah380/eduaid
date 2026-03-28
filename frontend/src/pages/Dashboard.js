import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GraduationCap, FileText, BookOpen, LogOut, User, Award, Briefcase } from 'lucide-react';
import { t } from '@/lib/i18n';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const API = `${BACKEND_URL}/api`;

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const lang = localStorage.getItem('language') || 'en';

  const [stats, setStats] = useState({ total_scholarships: 0, communities: [], education_levels: [] });
  const [documents, setDocuments] = useState([]);
  const [applications, setApplications] = useState([]);

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

  const handleLogout = () => { if (onLogout) onLogout(); navigate('/'); };
  const verifiedDocs = documents.filter(d => d.is_verified).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{t('scholarship_portal', lang)}</h1>
                <p className="text-sm text-blue-300">{t('welcome', lang)}, {user?.full_name}!</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-blue-300 hover:text-white flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <LogOut className="h-4 w-4" />{t('logout', lang)}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          {[
            { label: t('total_scholarships', lang), value: stats.total_scholarships, icon: Award, color: 'from-blue-500 to-cyan-500' },
            { label: t('applied', lang), value: applications.length, icon: Briefcase, color: 'from-indigo-500 to-purple-500' },
            { label: t('verified_docs', lang), value: `${verifiedDocs}/${documents.length}`, icon: FileText, color: 'from-green-500 to-emerald-500' },
            { label: t('pending', lang), value: documents.filter(d => d.verification_status === 'pending').length, icon: FileText, color: 'from-yellow-500 to-orange-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm text-blue-200">{stat.label}</span>
                <div className={`bg-gradient-to-br ${stat.color} p-2 rounded-lg`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            { title: t('browse_scholarships', lang), desc: 'Explore 55+ scholarships', icon: BookOpen, color: 'from-blue-500 to-cyan-500', path: '/scholarships' },
            { title: t('explore_benefits', lang), desc: '25+ student offers & tools', icon: Award, color: 'from-indigo-500 to-purple-500', path: '/benefits' },
            { title: t('upload_documents', lang), desc: 'Upload & verify docs via OCR', icon: FileText, color: 'from-green-500 to-emerald-500', path: '/documents' },
            { title: t('view_profile', lang), desc: 'Track applications & eligibility', icon: User, color: 'from-orange-500 to-red-500', path: '/profile' },
          ].map((item, i) => (
            <button key={i} onClick={() => navigate(item.path)}
              className="group bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-left
                         hover:bg-white/20 hover:border-blue-400/50 transition-all duration-300">
              <div className={`bg-gradient-to-br ${item.color} p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform`}>
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-1">{item.title}</h3>
              <p className="text-blue-300 text-sm">{item.desc}</p>
            </button>
          ))}
        </div>

        {/* Recent Applications */}
        {applications.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-400" /> Recent Applications
            </h3>
            <div className="space-y-3">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id} className="bg-white/5 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <div className="text-white font-medium">{app.scholarship_name}</div>
                    <div className="text-blue-300 text-sm">{app.provider} • {app.amount}</div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300">
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complete Profile Prompt */}
        {documents.length === 0 && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-2">
              <User className="h-5 w-5" /> {t('complete_profile', lang)}
            </h3>
            <p className="text-blue-200 text-sm mb-4">Upload your documents to get personalized scholarship recommendations.</p>
            <button onClick={() => navigate('/documents')}
              className="px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700">
              {t('upload_documents', lang)}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;