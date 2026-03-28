import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GraduationCap, FileText, BookOpen, LogOut, User, Award, Briefcase, Clock } from 'lucide-react';
import { t } from '@/lib/i18n';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const API = `${BACKEND_URL}/api`;

function Profile({ user, onLogout }) {
  const navigate = useNavigate();
  const lang = localStorage.getItem('language') || 'en';
  const [applications, setApplications] = useState([]);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetchApplications();
      fetchDocuments();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      const res = await axios.get(`${API}/applications/${user.id}`);
      if (res.data.success) setApplications(res.data.applications);
    } catch (err) { console.error(err); }
  };

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API}/documents/${user.id}`);
      if (res.data.success) setDocuments(res.data.documents);
    } catch (err) { console.error(err); }
  };

  const verifiedDocs = documents.filter(d => d.is_verified).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate('/dashboard')} className="text-blue-300 hover:text-white mr-2">← Back</button>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
              <User className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">{t('profile', lang)}</h1>
          </div>
          <button onClick={() => { onLogout(); navigate('/'); }} className="text-blue-300 hover:text-white flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10">
            <LogOut className="h-4 w-4" />{t('logout', lang)}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl">
              <User className="h-10 w-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{user?.full_name || 'Student'}</h2>
              <p className="text-blue-300 mb-4">{user?.email} • {user?.phone}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-white">{applications.length}</div>
                  <div className="text-xs text-blue-300">{t('applied', lang)}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-white">{verifiedDocs}</div>
                  <div className="text-xs text-blue-300">{t('verified_docs', lang)}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-white">{documents.length}</div>
                  <div className="text-xs text-blue-300">{t('documents', lang)}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-white">{user?.college_name ? '✓' : '−'}</div>
                  <div className="text-xs text-blue-300">{t('college_name', lang)}</div>
                </div>
              </div>
              {user?.college_name && (
                <p className="text-blue-200 mt-3 text-sm">🏫 {user.college_name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Applied Scholarships */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-400" /> {t('track_applications', lang)}
          </h3>
          {applications.length === 0 ? (
            <p className="text-blue-300 text-sm">No applications yet. Browse scholarships to apply!</p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="bg-white/5 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <div className="text-white font-semibold">{app.scholarship_name}</div>
                    <div className="text-blue-300 text-sm">{app.provider} • {app.amount}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium
                      ${app.status === 'applied' ? 'bg-yellow-500/20 text-yellow-300' :
                        app.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                        'bg-red-500/20 text-red-300'}`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                    {app.link && (
                      <a href={app.link} target="_blank" rel="noopener noreferrer"
                         className="text-blue-400 hover:text-blue-300 text-xs underline">
                        Portal →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents Status */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-400" /> {t('documents', lang)}
          </h3>
          {documents.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-blue-300 text-sm mb-3">No documents uploaded yet</p>
              <button onClick={() => navigate('/documents')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
                {t('upload_documents', lang)}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white/5 rounded-lg p-3 flex justify-between items-center">
                  <div className="text-white text-sm">{doc.document_type.replace(/_/g, ' ').toUpperCase()}</div>
                  <span className={`px-2 py-1 rounded-full text-xs
                    ${doc.verification_status === 'verified' ? 'bg-green-500/20 text-green-300' :
                      doc.verification_status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                      'bg-yellow-500/20 text-yellow-300'}`}>
                    {doc.verification_status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Profile;
