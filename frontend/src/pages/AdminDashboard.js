import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GraduationCap, LogOut, Trash2, PlusCircle, Users, Search, BarChart3, Award } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const API = `${BACKEND_URL}/api`;

function AdminDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const [scholarships, setScholarships] = useState([]);
  const [students, setStudents] = useState([]);
  const [collegeApps, setCollegeApps] = useState([]);
  const [collegeSearch, setCollegeSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [formData, setFormData] = useState({
    name: "", description: "", type: "MERIT", education_qualifications: [],
    communities: [], incomeLimit: "", minPercentage: "", deadline: "",
    minAge: "", maxAge: "", benefits: "", link: "", eligibility_criteria: "", provider: "", amount: ""
  });

  const [showEduDropdown, setShowEduDropdown] = useState(false);
  const [showCommDropdown, setShowCommDropdown] = useState(false);

  useEffect(() => { fetchScholarships(); fetchStudents(); }, []);

  const fetchScholarships = async () => {
    try {
      const res = await axios.get(`${API}/scholarships`);
      if (res.data.success) setScholarships(res.data.scholarships);
    } catch (err) { console.error(err); }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API}/applications/admin/students`);
      if (res.data.success) setStudents(res.data.students);
    } catch (err) { console.error(err); }
  };

  const searchCollege = async () => {
    if (!collegeSearch.trim()) return;
    try {
      const res = await axios.get(`${API}/applications/admin/college/${encodeURIComponent(collegeSearch)}`);
      if (res.data.success) setCollegeApps(res.data.applications);
    } catch (err) { console.error(err); }
  };

  const handleAddScholarship = async () => {
    try {
      await axios.post(`${API}/scholarships`, formData);
      fetchScholarships();
      setFormData({ name: "", description: "", type: "MERIT", education_qualifications: [],
        communities: [], incomeLimit: "", minPercentage: "", deadline: "",
        minAge: "", maxAge: "", benefits: "", link: "", eligibility_criteria: "", provider: "", amount: "" });
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this scholarship?")) return;
    await axios.delete(`${API}/scholarships/${id}`);
    fetchScholarships();
  };

  const handleLogout = () => { onLogout(); navigate("/"); };

  if (role !== "ADMIN") return <div className="p-10 text-center text-xl">Access Denied 🚫</div>;

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "scholarships", label: "Scholarships", icon: Award },
    { id: "students", label: "Students", icon: Users },
    { id: "add", label: "Add New", icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="text-blue-300 hover:text-white flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors
                ${activeTab === tab.id ? 'bg-blue-500 text-white' : 'bg-white/10 text-blue-300 hover:bg-white/20'}`}>
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                <div className="text-blue-300 text-sm mb-1">Total Scholarships</div>
                <div className="text-3xl font-bold text-white">{scholarships.length}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                <div className="text-blue-300 text-sm mb-1">Registered Students</div>
                <div className="text-3xl font-bold text-white">{students.length}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                <div className="text-blue-300 text-sm mb-1">Total Applications</div>
                <div className="text-3xl font-bold text-white">{students.reduce((sum, s) => sum + (s.total_applications || 0), 0)}</div>
              </div>
            </div>

            {/* College Search */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Search className="h-5 w-5 text-blue-400" /> Track by College</h3>
              <div className="flex gap-3">
                <input type="text" placeholder="Enter college name..." value={collegeSearch} onChange={(e) => setCollegeSearch(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-blue-300/50 focus:outline-none focus:border-blue-400" />
                <button onClick={searchCollege} className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">Search</button>
              </div>

              {collegeApps.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-blue-300 text-sm">{collegeApps.length} application(s) found</h4>
                  {collegeApps.map((app, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-3 flex justify-between items-center">
                      <div>
                        <div className="text-white font-medium text-sm">{app.student_name}</div>
                        <div className="text-blue-300 text-xs">{app.scholarship_name} • {app.college_name}</div>
                      </div>
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs">{app.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCHOLARSHIPS */}
        {activeTab === "scholarships" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {scholarships.map((s) => (
              <div key={s._id || s.id} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-1">{s.name}</h3>
                <p className="text-blue-300 text-sm mb-2 line-clamp-2">{s.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{s.type}</span>
                  {s.amount && <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">{s.amount}</span>}
                </div>
                <button onClick={() => handleDelete(s._id || s.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg text-sm hover:bg-red-500/30">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* STUDENTS */}
        {activeTab === "students" && (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4">Registered Students ({students.length})</h3>
            <div className="space-y-2">
              {students.map((s) => (
                <div key={s.id} className="bg-white/5 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <div className="text-white font-medium">{s.full_name}</div>
                    <div className="text-blue-300 text-sm">{s.email} • {s.college_name || 'No college'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{s.total_applications}</div>
                    <div className="text-blue-300 text-xs">applications</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADD NEW */}
        {activeTab === "add" && (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2"><PlusCircle className="h-5 w-5" /> Add Scholarship</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "name", label: "Name", type: "text", placeholder: "Scholarship name" },
                { key: "provider", label: "Provider", type: "text", placeholder: "Provider organization" },
                { key: "amount", label: "Amount", type: "text", placeholder: "e.g. ₹50,000/year" },
                { key: "deadline", label: "Deadline", type: "date" },
                { key: "minPercentage", label: "Min %", type: "number", placeholder: "e.g. 60" },
                { key: "incomeLimit", label: "Income Limit", type: "number", placeholder: "e.g. 500000" },
                { key: "minAge", label: "Min Age", type: "number", placeholder: "e.g. 17" },
                { key: "maxAge", label: "Max Age", type: "number", placeholder: "e.g. 25" },
              ].map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-blue-300 text-sm">{field.label}</label>
                  <input type={field.type} placeholder={field.placeholder || ''} value={formData[field.key]}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-blue-300/50 focus:outline-none focus:border-blue-400" />
                </div>
              ))}

              <div className="space-y-1">
                <label className="text-blue-300 text-sm">Type</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400">
                  <option value="MERIT" className="bg-slate-800">Merit-Based</option>
                  <option value="NEED" className="bg-slate-800">Need-Based</option>
                  <option value="MINORITY" className="bg-slate-800">Minority</option>
                  <option value="GIRL_CHILD" className="bg-slate-800">Girl Child</option>
                </select>
              </div>

              <div className="space-y-1 relative">
                <label className="text-blue-300 text-sm">Education Levels</label>
                <div onClick={() => setShowEduDropdown(!showEduDropdown)}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white cursor-pointer text-sm">
                  {formData.education_qualifications.length > 0 ? formData.education_qualifications.join(", ") : "Select..."}
                </div>
                {showEduDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-slate-700 border border-white/20 rounded-xl p-2 space-y-1">
                    {["Undergraduate", "Postgraduate", "Doctorate"].map(l => (
                      <label key={l} className="flex items-center gap-2 text-white text-sm cursor-pointer p-1 rounded hover:bg-white/10">
                        <input type="checkbox" checked={formData.education_qualifications.includes(l)}
                          onChange={() => {
                            const updated = formData.education_qualifications.includes(l)
                              ? formData.education_qualifications.filter(x => x !== l) : [...formData.education_qualifications, l];
                            setFormData({ ...formData, education_qualifications: updated });
                          }} />
                        {l}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1 relative">
                <label className="text-blue-300 text-sm">Communities</label>
                <div onClick={() => setShowCommDropdown(!showCommDropdown)}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white cursor-pointer text-sm">
                  {formData.communities.length > 0 ? formData.communities.join(", ") : "Select..."}
                </div>
                {showCommDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-slate-700 border border-white/20 rounded-xl p-2 space-y-1">
                    {["General", "OBC", "SC/ST", "Minority"].map(c => (
                      <label key={c} className="flex items-center gap-2 text-white text-sm cursor-pointer p-1 rounded hover:bg-white/10">
                        <input type="checkbox" checked={formData.communities.includes(c)}
                          onChange={() => {
                            const updated = formData.communities.includes(c)
                              ? formData.communities.filter(x => x !== c) : [...formData.communities, c];
                            setFormData({ ...formData, communities: updated });
                          }} />
                        {c}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {[
                { key: "description", label: "Description" },
                { key: "eligibility_criteria", label: "Eligibility Criteria" },
                { key: "benefits", label: "Benefits" },
              ].map(f => (
                <div key={f.key} className="md:col-span-2 space-y-1">
                  <label className="text-blue-300 text-sm">{f.label}</label>
                  <textarea value={formData[f.key]} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-blue-300/50 focus:outline-none focus:border-blue-400 h-20"
                    placeholder={f.label} />
                </div>
              ))}

              <div className="md:col-span-2 space-y-1">
                <label className="text-blue-300 text-sm">Application Link</label>
                <input type="url" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-blue-300/50 focus:outline-none focus:border-blue-400"
                  placeholder="https://..." />
              </div>
            </div>

            <button onClick={handleAddScholarship}
              className="mt-6 px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700">
              Add Scholarship
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;