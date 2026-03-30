import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Shield, FileText, Search, Users, ExternalLink, RefreshCw, Layers, Award } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const API = `${BACKEND_URL}/api`;

function AdminDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_scholarships: 0, total_students: 0, total_applications: 0 });
  const [scholarships, setScholarships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => { if (user?.role !== "ADMIN") navigate("/"); else loadData(); }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statRes, schRes, appRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/scholarships`),
        axios.get(`${API}/admin/applications`)
      ]);
      if (statRes.data.success) setStats(statRes.data);
      if (schRes.data.success) setScholarships(schRes.data.scholarships);
      if (appRes.data.success) setApplications(appRes.data.applications);
    } catch (err) { console.error("Admin load error", err); }
    setLoading(false);
  };

  const handleStatusUpdate = async (appId, newStatus) => {
    if (!window.confirm("Update status to " + newStatus + "?")) return;
    try {
      const res = await axios.post(`${API}/admin/applications/${appId}/status`, { status: newStatus });
      if (res.data.success) loadData();
    } catch (err) { alert("Failed to update status"); }
  };

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
            { id: "scholarships", label: "Scholarships", icon: Award },
            { id: "users", label: "Students", icon: Users },
            { id: "add", label: "Add New", icon: FileText }
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                </div>

                <div className="bg-white border text-left rounded-2xl p-6 shadow-sm border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Search className="h-5 w-5 text-indigo-500" /> Track Applications by College
                  </h3>
                  <div className="flex gap-4">
                    <input type="text" placeholder="Enter full college name..."
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 font-medium focus:outline-none focus:border-indigo-500" />
                    <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold tracking-wide shadow-md hover:bg-indigo-700 transition-colors">Search</button>
                  </div>
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

            {/* Add placeholder for other tabs */}
            {(activeTab === "users" || activeTab === "add") && (
              <div className="bg-white border text-left rounded-2xl p-16 shadow-sm border-slate-200 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                 <h2 className="text-xl font-bold text-slate-700 mb-2">Administrative Console</h2>
                 <p className="text-slate-500 font-medium">This module is locked for your current demo credential level.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;