import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Shield, FileText, Search, Users, ExternalLink, RefreshCw, Layers, Award, Eye, Clock } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const API = `${BACKEND_URL}/api`;

function AdminDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_scholarships: 0, total_students: 0, total_applications: 0, total_views: 0 });
  const [scholarships, setScholarships] = useState([]);
  const [views, setViews] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (user?.role !== "ADMIN") navigate("/"); else loadData(); }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    await fetchLatest();
    setLoading(false);
  };

  const fetchLatest = async () => {
    try {
      const [statRes, schRes, viewRes, studRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/scholarships`),
        axios.get(`${API}/admin/views`),
        axios.get(`${API}/applications/admin/students`)
      ]);
      if (statRes.data.success) setStats(statRes.data);
      if (schRes.data.success) setScholarships(schRes.data.scholarships);
      if (viewRes.data.success) setViews(viewRes.data.views);
      if (studRes.data.success) setStudents(studRes.data.students);
    } catch (err) { console.error("Admin load error", err); }
  };

  // Real-time polling: silently refresh data every 5 seconds
  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    const interval = setInterval(() => {
      fetchLatest();
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Filter views by search query
  const filteredViews = views.filter(v => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (v.student_name || '').toLowerCase().includes(q) ||
           (v.student_email || '').toLowerCase().includes(q) ||
           (v.college_name || '').toLowerCase().includes(q) ||
           (v.scholarship_name || '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Tricolor Accent Header Bar */}
      <div className="h-2 w-full flex fixed top-0 z-50">
        <div className="flex-1 bg-orange-500"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-green-600"></div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 mt-2 sticky top-2 z-40 shadow-sm relative">
        <div className="max-w-[1400px] mx-auto px-4 py-4 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2.5 rounded-xl shadow-md">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight leading-tight">Admin Dashboard</h1>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Secure College Administration</p>
            </div>
          </div>
          <button onClick={() => { onLogout(); navigate("/"); }} className="text-slate-600 font-bold hover:bg-slate-100 flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors border border-slate-200 shadow-sm">
            <ExternalLink className="h-4 w-4" /> Logout
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white p-1.5 rounded-xl w-fit border border-slate-200 shadow-sm">
          {[
            { id: "overview", label: "Overview", icon: Layers },
            { id: "views", label: "Student Activity", icon: Eye },
            { id: "scholarships", label: "Scholarships", icon: Award },
            { id: "students", label: "Students", icon: Users },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm tracking-wide transition-all ${
                activeTab === tab.id ? "bg-emerald-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"
              }`}>
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" /></div>
        ) : (
          <div>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white border text-left rounded-2xl p-6 shadow-sm border-slate-200 relative overflow-hidden">
                     <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full"></div>
                     <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-4">Total Scholarships</p>
                     <p className="text-4xl font-black text-blue-600">{stats.total_scholarships}</p>
                  </div>
                  <div className="bg-white border text-left rounded-2xl p-6 shadow-sm border-slate-200 relative overflow-hidden">
                     <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full"></div>
                     <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-4">Registered Students</p>
                     <p className="text-4xl font-black text-emerald-600">{stats.total_students}</p>
                  </div>
                  <div className="bg-white border text-left rounded-2xl p-6 shadow-sm border-slate-200 relative overflow-hidden">
                     <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full"></div>
                     <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-4">Total Applications</p>
                     <p className="text-4xl font-black text-indigo-600">{stats.total_applications}</p>
                  </div>
                  <div className="bg-white border text-left rounded-2xl p-6 shadow-sm border-slate-200 relative overflow-hidden">
                     <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-50 rounded-full"></div>
                     <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-4">Scholarship Views</p>
                     <p className="text-4xl font-black text-amber-600">{stats.total_views}</p>
                  </div>
                </div>

                {/* Recent Student Activity Preview */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-indigo-500" /> Recent Student Activity
                  </h3>
                  {views.length === 0 ? (
                    <p className="text-slate-400 text-sm font-medium py-8 text-center">No student activity yet. Students will appear here when they view scholarships.</p>
                  ) : (
                    <div className="space-y-3">
                      {views.slice(0, 5).map((v, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-4 hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="bg-indigo-100 p-2.5 rounded-lg">
                              <Users className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{v.student_name}</p>
                              <p className="text-xs text-slate-500">{v.student_email} • {v.college_name || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-indigo-700 truncate max-w-[250px]">{v.scholarship_name}</p>
                            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 justify-end">
                              <Clock className="h-3 w-3" /> {new Date(v.viewed_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {views.length > 5 && (
                    <button onClick={() => setActiveTab("views")} className="mt-4 text-sm text-indigo-600 font-bold hover:underline">
                      View all {views.length} entries →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Student Activity Tab (Views) */}
            {activeTab === "views" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Eye className="h-5 w-5 text-indigo-500" /> All Student Scholarship Views
                      <span className="bg-indigo-100 text-indigo-700 text-xs font-black px-2.5 py-1 rounded-full ml-2">{views.length}</span>
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input type="text" placeholder="Search by name, email, college, scholarship..."
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:border-indigo-500 w-full md:w-80" />
                    </div>
                  </div>

                  {filteredViews.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 border border-slate-100 rounded-xl">
                      <Eye className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p className="text-slate-500 font-bold text-sm">No student activity found</p>
                      <p className="text-slate-400 text-xs mt-1 font-medium">Students will appear here when they click on scholarships</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-widest">
                            <th className="p-4 pl-6">#</th>
                            <th className="p-4">Student Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Age</th>
                            <th className="p-4">College</th>
                            <th className="p-4">Scholarship Viewed</th>
                            <th className="p-4 text-right pr-6">Viewed At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredViews.map((v, i) => (
                            <tr key={v.id} className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">
                              <td className="p-4 pl-6 text-slate-400 font-bold text-sm">{i + 1}</td>
                              <td className="p-4 font-bold text-slate-800 text-sm">{v.student_name}</td>
                              <td className="p-4 text-slate-600 text-sm font-medium">{v.student_email}</td>
                              <td className="p-4">
                                {v.student_age ? (
                                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-black">{v.student_age} yrs</span>
                                ) : (
                                  <span className="text-slate-400 text-xs">-</span>
                                )}
                              </td>
                              <td className="p-4 text-slate-600 text-sm font-medium">{v.college_name || '-'}</td>
                              <td className="p-4">
                                <span className="text-indigo-700 font-bold text-sm">{v.scholarship_name}</span>
                                <br />
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{v.scholarship_type}</span>
                              </td>
                              <td className="p-4 text-right pr-6 text-slate-500 text-xs font-bold">
                                {new Date(v.viewed_at).toLocaleDateString()} <br />
                                <span className="text-slate-400">{new Date(v.viewed_at).toLocaleTimeString()}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Scholarships Listing */}
            {activeTab === "scholarships" && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-widest">
                        <th className="p-4 pl-6">Scholarship Name</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Provider</th>
                        <th className="p-4 text-right pr-6">Deadline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scholarships.map((s, i) => (
                        <tr key={s._id || s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-4 pl-6 font-bold text-slate-800">{s.name}</td>
                          <td className="p-4"><span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-black uppercase tracking-widest border border-indigo-100">{s.type}</span></td>
                          <td className="p-4 text-slate-500 font-semibold text-sm">{s.provider || '-'}</td>
                          <td className="p-4 text-right pr-6 text-slate-500 text-xs font-bold">{s.deadline ? new Date(s.deadline).toLocaleDateString() : 'None'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Students Tab */}
            {activeTab === "students" && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-500" /> Registered Students
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full ml-2">{students.length}</span>
                  </h3>
                </div>
                {students.length === 0 ? (
                  <div className="text-center py-16">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">No students registered yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-widest">
                          <th className="p-4 pl-6">#</th>
                          <th className="p-4">Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Phone</th>
                          <th className="p-4">College</th>
                          <th className="p-4">Applications</th>
                          <th className="p-4 text-right pr-6">Registered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s, i) => (
                          <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="p-4 pl-6 text-slate-400 font-bold text-sm">{i + 1}</td>
                            <td className="p-4 font-bold text-slate-800 text-sm">{s.full_name}</td>
                            <td className="p-4 text-slate-600 text-sm font-medium">{s.email}</td>
                            <td className="p-4 text-slate-600 text-sm font-medium">{s.phone}</td>
                            <td className="p-4 text-slate-600 text-sm font-medium">{s.college_name || '-'}</td>
                            <td className="p-4">
                              <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-black">{s.total_applications}</span>
                            </td>
                            <td className="p-4 text-right pr-6 text-slate-500 text-xs font-bold">{new Date(s.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;