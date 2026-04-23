import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Shield, FileText, Search, Users, ExternalLink, RefreshCw, Layers, Award, Eye, Clock, CheckCircle, XCircle, Trash2, Plus, X, Download, Globe } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const API = `${BACKEND_URL}/api`;

function AdminDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_scholarships: 0, total_students: 0, total_applications: 0, total_views: 0 });
  const [scholarships, setScholarships] = useState([]);
  const [views, setViews] = useState([]);
  const [students, setStudents] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetailsLoading, setStudentDetailsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addingSch, setAddingSch] = useState(false);
  const [newSch, setNewSch] = useState({
    name: '',
    description: '',
    link: '',
    type: 'MERIT',
    provider: '',
    amount: '',
    deadline: ''
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (user?.role !== "ADMIN") navigate("/"); else loadData(); }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    await fetchLatest();
    setLoading(false);
  };

  const fetchLatest = async () => {
    try {
      const [statRes, schRes, viewRes, studRes, docRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/scholarships`),
        axios.get(`${API}/admin/views`),
        axios.get(`${API}/applications/admin/students`),
        axios.get(`${API}/auth/admin/verification-queue`)
      ]);
      if (statRes.data.success) setStats(statRes.data);
      if (schRes.data.success) setScholarships(schRes.data.scholarships);
      if (viewRes.data.success) setViews(viewRes.data.views);
      if (studRes.data.success) setStudents(studRes.data.students);
      if (docRes.data.success) setPendingDocs(docRes.data.students);
    } catch (err) { console.error("Admin load error", err); }
  };

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    const interval = setInterval(() => {
      fetchLatest();
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const filteredViews = views.filter(v => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (v.student_name || '').toLowerCase().includes(q) ||
           (v.student_email || '').toLowerCase().includes(q) ||
           (v.college_name || '').toLowerCase().includes(q) ||
           (v.scholarship_name || '').toLowerCase().includes(q);
  });

  const handleDeleteScholarship = async (id) => {
    if (!window.confirm("Are you sure you want to delete this scholarship?")) return;
    try {
      await axios.delete(`${API}/scholarships/${id}`);
      fetchLatest();
    } catch (err) { alert("Failed to delete"); }
  };

  const handleVerifyDocument = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this document?`)) return;
    try {
      await axios.post(`${API}/documents/admin/verify/${id}`, { status });
      fetchLatest();
    } catch (err) { alert("Failed to update verification status"); }
  };

  const handleVerifyStudent = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this student profile?`)) return;
    try {
      await axios.post(`${API}/auth/admin/verify-student/${id}`, { status });
      setSelectedStudent(null);
      fetchLatest();
    } catch (err) { alert("Failed to update student verification status"); }
  };

  const loadStudentDetails = async (id) => {
    setStudentDetailsLoading(true);
    try {
      const res = await axios.get(`${API}/applications/admin/students/${id}/details`);
      if (res.data.success) {
        setSelectedStudent(res.data);
      }
    } catch (err) { alert("Failed to load details"); }
    setStudentDetailsLoading(false);
  };

  const handleAddScholarship = async (e) => {
    e.preventDefault();
    if (!newSch.name || !newSch.description || !newSch.link) {
      alert("Please fill in Name, Overview and URL");
      return;
    }
    setAddingSch(true);
    try {
      const res = await axios.post(`${API}/scholarships`, newSch);
      if (res.data.success) {
        setIsAddModalOpen(false);
        setNewSch({ name: '', description: '', link: '', type: 'MERIT', provider: '', amount: '', deadline: '' });
        fetchLatest();
        alert("Scholarship added successfully!");
      }
    } catch (err) {
      alert("Failed to add scholarship");
    }
    setAddingSch(false);
  };

  const studentsWithPendingDocs = (pendingDocs || []).map(s => ({
    id: s.id,
    name: s.full_name,
    email: s.email,
    college: s.college_name,
    count: s.verification_requested ? 'REQUESTED' : 'PENDING'
  }));

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col relative">
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
            { id: "students", label: "Students", icon: Users },
            { id: "verifications", label: "Verifications", icon: CheckCircle },
            { id: "scholarships", label: "Scholarships", icon: Award },
            { id: "views", label: "Activity", icon: Eye },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm tracking-wide transition-all ${
                activeTab === tab.id ? "bg-emerald-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"
              }`}>
              <tab.icon className="h-4 w-4" /> {tab.label}
              {tab.id === "verifications" && pendingDocs.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{pendingDocs.length}</span>
              )}
            </button>
          ))}
        </div>

        {loading && !students.length ? (
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
                  <div className="bg-white border text-left rounded-2xl p-6 shadow-sm border-slate-200 relative overflow-hidden flex flex-col justify-between">
                     <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-50 rounded-full"></div>
                     <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-4">Verification Requests</p>
                     <p className="text-4xl font-black text-red-500">{pendingDocs.length}</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-indigo-500" /> Recent Student Activity
                  </h3>
                  {views.length === 0 ? (
                    <p className="text-slate-400 text-sm font-medium py-8 text-center">No student activity yet.</p>
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
                          <tr key={s.id} onClick={() => loadStudentDetails(s.id)} className="border-b border-slate-100 hover:bg-emerald-50 cursor-pointer transition-colors group">
                            <td className="p-4 pl-6 text-slate-400 font-bold text-sm">{i + 1}</td>
                            <td className="p-4 font-bold text-emerald-700 group-hover:text-emerald-800 text-sm flex items-center gap-2">
                                {s.full_name} <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                            </td>
                            <td className="p-4 text-slate-600 text-sm font-medium">{s.email}</td>
                            <td className="p-4 text-slate-600 text-sm font-medium">{s.phone}</td>
                            <td className="p-4 text-slate-600 text-sm font-medium">{s.college_name || '-'}</td>
                            <td className="p-4">
                              <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-black">{s.total_applications}</span>
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

            {/* Verifications Tab */}
            {activeTab === "verifications" && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500" /> Student Verification Queue
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full ml-2">{studentsWithPendingDocs.length} Students Pending</span>
                  </h3>
                   <button onClick={fetchLatest} className="text-slate-500 hover:text-emerald-600"><RefreshCw className="h-4 w-4" /></button>
                </div>
                {studentsWithPendingDocs.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50/50">
                    <CheckCircle className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">All student reports verified!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-widest">
                          <th className="p-4 pl-6">Student</th>
                          <th className="p-4">College</th>
                          <th className="p-4">Pending Docs</th>
                          <th className="p-4 text-right pr-6">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsWithPendingDocs.map((s) => (
                          <tr key={s.id} className="border-b border-slate-100 hover:bg-emerald-50/30 transition-colors">
                            <td className="p-4 pl-6">
                                <p className="font-bold text-slate-800 text-sm">{s.name}</p>
                                <p className="text-xs text-slate-500">{s.email}</p>
                            </td>
                            <td className="p-4 text-slate-600 text-sm font-medium">{s.college || '-'}</td>
                            <td className="p-4">
                                {s.count === 'REQUESTED' ? (
                                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-[10px] font-black animate-pulse">VERIFICATION REQUESTED</span>
                                ) : (
                                  <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-md text-[10px] font-black">PENDING REVIEW</span>
                                )}
                            </td>
                            <td className="p-4 text-right pr-6">
                                <button onClick={() => loadStudentDetails(s.id)} 
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2 ml-auto">
                                  <FileText className="h-3 w-3" /> View Student Report
                                </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Scholarships Listing Tab */}
            {activeTab === "scholarships" && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                   <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                     <Award className="h-5 w-5 text-indigo-500" /> Managed Scholarships
                   </h3>
                   <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                     <Plus className="h-4 w-4" /> Add Scholarship
                   </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-widest">
                        <th className="p-4 pl-6">Scholarship Name</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Provider</th>
                        <th className="p-4">Deadline</th>
                        <th className="p-4 text-right pr-6">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scholarships.map((s, i) => (
                        <tr key={s._id || s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-4 pl-6 font-bold text-slate-800">{s.name}</td>
                          <td className="p-4"><span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-black uppercase tracking-widest border border-indigo-100">{s.type}</span></td>
                          <td className="p-4 text-slate-500 font-semibold text-sm">{s.provider || '-'}</td>
                          <td className="p-4 text-slate-500 text-xs font-bold">{s.deadline ? new Date(s.deadline).toLocaleDateString() : 'None'}</td>
                          <td className="p-4 text-right pr-6">
                            <button onClick={() => handleDeleteScholarship(s._id || s.id)} className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Views Activity Tab */}
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
                      <input type="text" placeholder="Search by name, email, college..."
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:border-indigo-500 w-full md:w-80" />
                    </div>
                  </div>

                  {filteredViews.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 border border-slate-100 rounded-xl">
                      <Eye className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p className="text-slate-500 font-bold text-sm">No student activity found</p>
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
                                ) : <span className="text-slate-400 text-xs">-</span>}
                              </td>
                              <td className="p-4 text-slate-600 text-sm font-medium">{v.college_name || '-'}</td>
                              <td className="p-4">
                                <span className="text-indigo-700 font-bold text-sm">{v.scholarship_name}</span>
                              </td>
                              <td className="p-4 text-right pr-6 text-slate-500 text-xs font-bold">
                                {new Date(v.viewed_at).toLocaleDateString()}
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
          </div>
        )}
      </main>

      {/* Student Details Modal overlay */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
               <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                 <Users className="h-5 w-5 text-emerald-600" /> Student Profile
               </h2>
               <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X className="h-5 w-5" /></button>
             </div>
             
             {studentDetailsLoading ? (
                 <div className="flex justify-center py-20"><RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" /></div>
             ) : selectedStudent.student ? (
                <div className="p-6 space-y-8">
                  {/* Profile Section */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name</p>
                        <p className="font-bold text-slate-800">{selectedStudent.student.full_name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Email</p>
                        <p className="font-medium text-slate-600">{selectedStudent.student.email}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Income (Verified)</p>
                        <p className="font-bold text-emerald-700">{selectedStudent.student.annual_income ? `₹${selectedStudent.student.annual_income.toLocaleString()}` : 'Not extracted'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Marks (Verified)</p>
                        <p className="font-bold text-blue-700">{selectedStudent.student.marks_percentage ? `${selectedStudent.student.marks_percentage}%` : 'Not extracted'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Documents List */}
                    <div>
                      <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 flex justify-between items-center">
                        Uploaded Documents <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{selectedStudent.documents?.length || 0}</span>
                      </h3>
                      {selectedStudent.documents?.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No documents uploaded.</p>
                      ) : (
                        <div className="space-y-3">
                          {selectedStudent.documents.map(doc => (
                            <div key={doc.id} className="border border-slate-200 rounded-lg p-3 hover:border-emerald-300 transition-colors bg-white shadow-sm">
                               <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                    {doc.document_type.replace('_', ' ')}
                                  </span>
                                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    doc.verification_status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                                    doc.verification_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {doc.verification_status}
                                  </span>
                               </div>
                               <a href={`${BACKEND_URL}/${doc.file_path}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                 <FileText className="h-3 w-3" /> {doc.file_name}
                               </a>
                               {doc.ocr_result && <p className="text-xs text-slate-500 mt-2 truncate bg-slate-50 p-1.5 rounded">{doc.ocr_result}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Applications List */}
                    <div>
                      <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 flex justify-between items-center">
                        Applications <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{selectedStudent.applications?.length || 0}</span>
                      </h3>
                      {selectedStudent.applications?.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No applications found.</p>
                      ) : (
                        <div className="space-y-3">
                          {selectedStudent.applications.map(app => (
                            <div key={app.id} className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm">
                               <p className="font-bold text-indigo-700 text-sm mb-1">{app.scholarship_name}</p>
                               <div className="flex justify-between items-center text-xs text-slate-500">
                                  <span>{app.provider}</span>
                                  <span className="font-bold px-2 py-0.5 bg-slate-100 rounded-full">{app.status}</span>
                               </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Verification Action Bar (Visible only to Admin in Modal) */}
                  <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                     <div>
                       <p className="text-sm font-bold text-slate-800 tracking-tight">Final Verification Decision</p>
                       <p className="text-xs text-slate-500 font-medium tracking-wide">Review the entire student report above before making a decision.</p>
                     </div>
                     <div className="flex gap-3 w-full sm:w-auto">
                       <button onClick={() => handleVerifyStudent(selectedStudent.student.id, 'rejected')} 
                         className="flex-1 sm:flex-none bg-red-50 text-red-700 hover:bg-red-100 px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest border border-red-200 transition-all">
                         Reject Report
                       </button>
                       <button onClick={() => handleVerifyStudent(selectedStudent.student.id, 'verified')} 
                         className="flex-1 sm:flex-none bg-emerald-600 text-white hover:bg-emerald-700 px-8 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all">
                         Approve Student
                       </button>
                     </div>
                  </div>
                </div>
             ) : (
                <div className="p-12 text-center text-slate-400">Student not found</div>
             )}
          </div>
        </div>
      )}

      {/* Add Scholarship Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-xl w-full my-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-600" /> Create New Scholarship
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-red-500 p-2 rounded-xl transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddScholarship} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Scholarship Name</label>
                <input type="text" required value={newSch.name} onChange={(e) => setNewSch({...newSch, name: e.target.value})}
                  placeholder="e.g. HDFC Badhte Kadam Scholarship"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-medium" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Overview / Description</label>
                <textarea required rows="3" value={newSch.description} onChange={(e) => setNewSch({...newSch, description: e.target.value})}
                  placeholder="Briefly describe the scholarship goals and benefits..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-medium resize-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Scholarship Portal URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input type="url" required value={newSch.link} onChange={(e) => setNewSch({...newSch, link: e.target.value})}
                    placeholder="https://scholarship-portal.com/apply"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Type</label>
                  <select value={newSch.type} onChange={(e) => setNewSch({...newSch, type: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-medium">
                    <option value="MERIT">Merit Based</option>
                    <option value="NEED">Need Based</option>
                    <option value="GIRL_CHILD">Girls Only</option>
                    <option value="MINORITY">Minority Specific</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Provider</label>
                  <input type="text" value={newSch.provider} onChange={(e) => setNewSch({...newSch, provider: e.target.value})}
                    placeholder="e.g. Tata Trusts"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Amount / Benefit</label>
                  <input type="text" value={newSch.amount} onChange={(e) => setNewSch({...newSch, amount: e.target.value})}
                    placeholder="e.g. ₹50,000 / year"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Deadline</label>
                  <input type="date" value={newSch.deadline} onChange={(e) => setNewSch({...newSch, deadline: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-medium" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={addingSch}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 flex items-center justify-center gap-2">
                  {addingSch ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create Scholarship
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;