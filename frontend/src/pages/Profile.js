import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GraduationCap, FileText, Briefcase, LogOut, User, Award, ArrowLeft, Shield } from 'lucide-react';
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

  const getExtractedPercentage = (ocrResult) => {
    if (!ocrResult) return null;
    const match = ocrResult.match(/Extracted Percentage:\s*([0-9.]+)%/i);
    return match ? match[1] : null;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Tricolor Accent Bar */}
      <div className="h-2 w-full flex fixed top-0 z-50">
        <div className="flex-1 bg-orange-500"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-green-600"></div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 mt-2 sticky top-2 z-40 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center relative z-10">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-blue-600 mr-2 font-medium transition-colors">
               ← {t('back', lang)}
            </button>
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-md">
              <User className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">{t('profile', lang)}</h1>
          </div>
          <button onClick={() => { onLogout(); navigate('/'); }} className="text-red-600 font-bold hover:bg-red-50 flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors border border-red-100 shadow-sm">
            <LogOut className="h-4 w-4" />{t('logout', lang)}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Stats Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
            <div className="bg-indigo-100 border-4 border-white shadow-md p-5 rounded-3xl mt-2">
              <User className="h-14 w-14 text-indigo-600" />
            </div>
            <div className="flex-1 w-full text-center md:text-left">
              <h2 className="text-3xl font-extrabold text-slate-800 mb-1">{user?.full_name || 'Student'}</h2>
              <p className="text-slate-500 font-medium mb-6">{user?.email} • {user?.phone}</p>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center">
                  <div className="text-3xl font-black text-slate-700">{applications.length}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Applications</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col items-center">
                  <div className="text-3xl font-black text-emerald-700">{verifiedDocs}</div>
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Verified Docs</div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col items-center">
                  <div className="text-3xl font-black text-blue-700">{documents.length}</div>
                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Total Docs</div>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col items-center justify-center">
                  {user?.college_name ? (
                     <div className="text-indigo-800 font-bold text-sm text-center line-clamp-2 leading-tight">{user.college_name}</div>
                  ) : (
                     <div className="text-3xl font-black text-indigo-700">−</div>
                  )}
                  <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">{t('college_name', lang)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Track Applications */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-indigo-500" /> Track Applications
            </h3>
            
            {applications.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-slate-500 font-medium text-sm">No applications submitted yet.</p>
                <button onClick={() => navigate('/scholarships')} className="mt-3 px-4 py-2 bg-indigo-100 text-indigo-700 font-bold text-xs uppercase tracking-wide rounded-lg hover:bg-indigo-200 transition-colors">
                  Browse Scholarships
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="bg-slate-50 border border-slate-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-slate-800 leading-tight pr-4">{app.scholarship_name}</div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shrink-0
                        ${app.status === 'applied' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                          app.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                          'bg-red-100 text-red-800 border-red-200'}`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-4">{app.provider} • {app.amount}</div>
                    
                    {app.link && (
                      <a href={app.link} target="_blank" rel="noopener noreferrer"
                         className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wide bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                        Visit Scholarship Portal <ArrowLeft className="h-3 w-3 ml-1 rotate-[135deg]" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents Status Minimal */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" /> Documents & Verification
            </h3>
            
            {documents.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 border border-slate-100 rounded-xl">
                <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium text-sm mb-4">No documents uploaded yet to verify identity.</p>
                <button onClick={() => navigate('/documents')}
                        className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs uppercase tracking-wide rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
                  Upload Documents
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${doc.verification_status === 'verified' ? 'bg-emerald-100 text-emerald-600' : doc.verification_status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-slate-700 font-bold text-sm tracking-wide flex items-center gap-2 uppercase">
                           {doc.document_type.replace(/_/g, ' ')}
                           {doc.verification_status === 'verified' && getExtractedPercentage(doc.ocr_result) && (
                           <span className="bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded text-[10px] font-black tracking-widest shrink-0">
                              {getExtractedPercentage(doc.ocr_result)}%
                           </span>
                           )}
                        </div>
                        <div className="text-slate-400 text-xs font-semibold truncate max-w-[150px]">{doc.file_name}</div>
                      </div>
                    </div>
                    
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shrink-0
                      ${doc.verification_status === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        doc.verification_status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {doc.verification_status}
                    </span>
                  </div>
                ))}
                
                <div className="pt-4 mt-2">
                  <button onClick={() => navigate('/documents')} className="w-full py-3 bg-white border border-slate-200 text-slate-600 font-bold uppercase tracking-wide rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors text-xs shadow-sm">
                    Manage Documents
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;
