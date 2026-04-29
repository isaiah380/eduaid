import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GraduationCap, LogOut, ArrowLeft, ClipboardList, CheckCircle, XCircle, Clock, ExternalLink, Trash2 } from 'lucide-react';
import { t } from '@/lib/i18n';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const API = `${BACKEND_URL}/api`;

function MyApplications({ user, onLogout }) {
  const navigate = useNavigate();
  const lang = localStorage.getItem('language') || 'en';
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`${API}/applications/${user.id}`);
      if (res.data.success) {
        setApplications(res.data.applications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleDelete = async (appId) => {
    if (!window.confirm("Are you sure you want to delete this application? This action cannot be undone.")) return;
    try {
      const res = await axios.delete(`${API}/applications/${appId}`);
      if (res.data.success) {
        setApplications(apps => apps.filter(a => a.id !== appId));
      } else {
        alert(res.data.detail || "Failed to delete");
      }
    } catch (err) {
      alert("Error deleting application.");
    }
  };

  const handleLogout = () => { if (onLogout) onLogout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Tricolor Accent Bar */}
      <div className="h-2 w-full flex fixed top-0 z-50">
        <div className="flex-1 bg-orange-500"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-green-600"></div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 mt-2 sticky top-2 z-40 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors mr-2">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-md">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">My Applications</h1>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Application Status & History</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-slate-600 font-bold hover:bg-slate-100 flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors border border-slate-200 shadow-sm">
            <LogOut className="h-4 w-4" />{t('logout', lang)}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium">Loading your applications...</div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <ClipboardList className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">No Applications Yet</h3>
              <p className="text-slate-500 font-medium mb-6">You haven't applied to any scholarships yet.</p>
              <button onClick={() => navigate('/scholarships')} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm">
                Browse Scholarships
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-widest font-black">
                    <th className="p-4 pl-6">Scholarship</th>
                    <th className="p-4">Provider</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Applied Date</th>
                    <th className="p-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <p className="font-bold text-slate-800">{app.scholarship_name}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">{app.amount || "Variable Amount"}</p>
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200">
                          {app.provider || "Government"}
                        </span>
                      </td>
                      <td className="p-4">
                        {app.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-black border border-emerald-200 shadow-sm">
                            <CheckCircle className="h-3.5 w-3.5" /> Approved
                          </span>
                        ) : app.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-black border border-red-200 shadow-sm">
                            <XCircle className="h-3.5 w-3.5" /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-black border border-amber-200 shadow-sm">
                            <Clock className="h-3.5 w-3.5" /> Under Review
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500 text-xs font-bold">
                        {new Date(app.applied_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right pr-6 flex justify-end gap-2">
                        {app.link ? (
                          <a href={app.link} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 p-2 rounded-xl transition-colors border border-blue-100 shadow-sm" title="Visit Official Portal">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null}
                        <button onClick={() => handleDelete(app.id)} className="inline-flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 p-2 rounded-xl transition-colors border border-red-100 shadow-sm" title="Delete Application">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default MyApplications;
