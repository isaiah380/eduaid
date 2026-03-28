import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { t } from "@/lib/i18n";
import { ArrowLeft, Search, ExternalLink, Award, CheckCircle, XCircle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const API = `${BACKEND_URL}/api`;

function Scholarships({ user, onLogout }) {
  const navigate = useNavigate();
  const lang = localStorage.getItem("language") || "en";

  const [scholarships, setScholarships] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [eduFilter, setEduFilter] = useState("");
  const [commFilter, setCommFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [applying, setApplying] = useState(false);
  const [appliedIds, setAppliedIds] = useState(new Set());

  useEffect(() => { loadScholarships(); loadApplications(); }, []);

  const loadScholarships = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/scholarships`);
      if (res.data.success) { setScholarships(res.data.scholarships); setFiltered(res.data.scholarships); }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const loadApplications = async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`${API}/applications/${user.id}`);
      if (res.data.success) {
        setAppliedIds(new Set(res.data.applications.map(a => a.scholarship_id)));
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    let result = [...scholarships];
    if (searchQuery) result = result.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    if (eduFilter) result = result.filter(s => s.education_qualifications?.includes(eduFilter));
    if (commFilter) result = result.filter(s => s.communities?.includes(commFilter));
    if (typeFilter) result = result.filter(s => s.type === typeFilter);
    setFiltered(result);
  }, [searchQuery, eduFilter, commFilter, typeFilter, scholarships]);

  const handleApply = async (scholarship) => {
    if (!user?.id) return;
    setApplying(true);
    try {
      const res = await axios.post(`${API}/applications`, {
        user_id: user.id,
        scholarship_id: scholarship._id || scholarship.id,
        eligibility_check: { checked_at: new Date().toISOString() }
      });
      if (res.data.success) {
        setAppliedIds(prev => new Set([...prev, scholarship._id || scholarship.id]));
        alert("Application submitted! Track it in your profile.");
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to apply");
    }
    setApplying(false);
  };

  const isExpired = (deadline) => deadline && new Date() > new Date(deadline);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="text-blue-300 hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
            <Award className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-bold text-white">{t("scholarships", lang)} ({filtered.length})</h1>
          </div>
          <button onClick={() => { onLogout(); navigate("/"); }} className="text-blue-300 hover:text-white px-3 py-2 bg-white/10 rounded-lg text-sm">Logout</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 mb-6">
          <div className="flex gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-blue-300" />
              <input type="text" placeholder="Search scholarships..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-blue-300/50 focus:outline-none focus:border-blue-400" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { value: eduFilter, setValue: setEduFilter, options: [["", "All Education"], ["Undergraduate", "Undergraduate"], ["Postgraduate", "Postgraduate"], ["Doctorate", "Doctorate"]] },
              { value: commFilter, setValue: setCommFilter, options: [["", "All Communities"], ["General", "General"], ["OBC", "OBC"], ["SC/ST", "SC/ST"], ["Minority", "Minority"]] },
              { value: typeFilter, setValue: setTypeFilter, options: [["", "All Types"], ["MERIT", "Merit-Based"], ["NEED", "Need-Based"], ["MINORITY", "Minority"], ["GIRL_CHILD", "Girl Child"]] },
            ].map((filter, i) => (
              <select key={i} value={filter.value} onChange={(e) => filter.setValue(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-blue-400">
                {filter.options.map(([val, label]) => <option key={val} value={val} className="bg-slate-800">{label}</option>)}
              </select>
            ))}
          </div>
        </div>

        {/* Scholarship Grid */}
        {loading ? (
          <div className="text-center text-blue-300 py-20">{t("loading", lang)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-blue-300 py-20">{t("no_results", lang)}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((s) => (
              <div key={s._id || s.id} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 hover:bg-white/15 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-bold text-base leading-tight flex-1 mr-3">{s.name}</h3>
                  {s.amount && <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full whitespace-nowrap">{s.amount}</span>}
                </div>
                <p className="text-blue-300 text-sm mb-3 line-clamp-2">{s.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {s.education_qualifications?.map(q => <span key={q} className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{q}</span>)}
                  {s.communities?.map(c => <span key={c} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">{c}</span>)}
                  {s.type && <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">{s.type}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelected(s)}
                    className="flex-1 py-2 bg-blue-500/20 text-blue-300 rounded-xl text-sm font-medium hover:bg-blue-500/30 transition-colors">
                    {t("view_info", lang)}
                  </button>
                  {s.link && (
                    <a href={s.link} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-2 bg-white/10 text-white rounded-xl text-sm flex items-center gap-1 hover:bg-white/20">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-slate-800 border border-white/20 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
            <h2 className="text-xl font-bold text-white mb-1">{selected.name}</h2>
            {selected.provider && <p className="text-blue-400 text-sm mb-4">{selected.provider}</p>}

            <div className="space-y-3 text-sm mb-6">
              {selected.amount && <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3"><span className="text-green-300 font-medium">💰 Amount:</span> <span className="text-green-200">{selected.amount}</span></div>}
              <p className="text-blue-200">{selected.description}</p>

              {selected.eligibility_criteria && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                  <span className="text-blue-300 font-medium">📋 {t("eligibility_criteria", lang)}:</span>
                  <p className="text-blue-200 mt-1">{selected.eligibility_criteria}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {selected.min_percentage && <div className="bg-white/5 rounded-lg p-2"><span className="text-blue-300 text-xs">Min %</span><div className="text-white font-bold">{selected.min_percentage}%</div></div>}
                {selected.income_limit && <div className="bg-white/5 rounded-lg p-2"><span className="text-blue-300 text-xs">Income Limit</span><div className="text-white font-bold">₹{selected.income_limit.toLocaleString()}</div></div>}
                {selected.deadline && <div className="bg-white/5 rounded-lg p-2"><span className="text-blue-300 text-xs">{t("deadline", lang)}</span><div className={`font-bold ${isExpired(selected.deadline) ? 'text-red-400' : 'text-white'}`}>{new Date(selected.deadline).toLocaleDateString()}</div></div>}
                {(selected.min_age || selected.max_age) && <div className="bg-white/5 rounded-lg p-2"><span className="text-blue-300 text-xs">Age Range</span><div className="text-white font-bold">{selected.min_age || '−'}—{selected.max_age || '−'} yrs</div></div>}
              </div>

              <div className="flex flex-wrap gap-1">
                {selected.education_qualifications?.map(q => <span key={q} className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{q}</span>)}
                {selected.communities?.map(c => <span key={c} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">{c}</span>)}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {isExpired(selected.deadline) ? (
                <div className="text-center py-2 bg-red-500/20 text-red-300 rounded-xl font-medium">
                  <XCircle className="inline h-4 w-4 mr-1" /> Scholarship Closed
                </div>
              ) : appliedIds.has(selected._id || selected.id) ? (
                <div className="text-center py-2 bg-green-500/20 text-green-300 rounded-xl font-medium">
                  <CheckCircle className="inline h-4 w-4 mr-1" /> Already Applied
                </div>
              ) : (
                <button onClick={() => handleApply(selected)} disabled={applying}
                  className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 disabled:opacity-50">
                  {applying ? "Applying..." : "📝 Apply & Track"}
                </button>
              )}

              {selected.link && (
                <a href={selected.link} target="_blank" rel="noopener noreferrer"
                  className="block w-full py-2 bg-blue-500/20 text-blue-300 rounded-xl font-medium text-center hover:bg-blue-500/30">
                  🔗 Visit Official Portal
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Scholarships;