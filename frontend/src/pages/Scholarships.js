import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { t } from "@/lib/i18n";
import { translateScholarshipName, translateDescription } from "@/lib/scholarshipTranslations";
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
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* Tricolor Accent Bar */}
      <div className="h-2 w-full flex fixed top-0 z-50">
        <div className="flex-1 bg-orange-500"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-green-600"></div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 mt-2 sticky top-2 z-40 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="text-slate-500 hover:text-blue-600 mr-2 font-medium transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-md">
               <Award className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">{t("scholarships", lang)} <span className="text-slate-400 font-medium ml-1 text-base">({filtered.length})</span></h1>
          </div>
          <button onClick={() => { onLogout(); navigate("/"); }} className="text-slate-600 font-bold hover:bg-slate-100 flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors border border-slate-200 shadow-sm">
             {t('logout', lang)}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
              <input type="text" placeholder={t('search_scholarships', lang)} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={eduFilter} onChange={(e) => setEduFilter(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-blue-500">
              <option value="">{t('all_education', lang)}</option>
              <option value="10th">10th Pass</option><option value="12th">12th Pass</option><option value="UG">Undergraduate</option><option value="PG">Postgraduate</option>
            </select>
            <select value={commFilter} onChange={(e) => setCommFilter(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-blue-500">
              <option value="">{t('all_communities', lang)}</option>
              <option value="SC">SC</option><option value="ST">ST</option><option value="OBC">OBC</option><option value="General">General</option>
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-blue-500">
              <option value="">{t('all_types', lang)}</option>
              <option value="MERIT">Merit Based</option><option value="MEANS">Means Based</option><option value="SPORTS">Sports</option><option value="GIRLS">Girls Only</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((s) => {
              const applied = appliedIds.has(s._id || s.id);
              const expired = isExpired(s.deadline);
              const nameTranslated = translateScholarshipName(s.name, lang);
              const descTranslated = translateDescription(s.description, lang);

              return (
                <div key={s._id || s.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group cursor-pointer relative" onClick={() => setSelected(s)}>
                  <div className="mb-4 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border
                        ${s.type === 'MERIT' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                          s.type === 'MEANS' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        {s.type}
                      </span>
                      {applied ? (
                        <span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md font-black uppercase tracking-widest border border-emerald-200"><CheckCircle className="h-3 w-3"/> Applied</span>
                      ) : expired ? (
                        <span className="flex items-center gap-1 text-[10px] bg-red-50 text-red-700 px-2 py-1 rounded-md font-black uppercase tracking-widest border border-red-200"><XCircle className="h-3 w-3"/> Expired</span>
                      ) : null}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight group-hover:text-blue-600 transition-colors">{nameTranslated}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 font-medium leading-relaxed">{descTranslated}</p>
                    <div className="mt-4 space-y-2">
                       {s.provider && <p className="text-xs text-slate-500 font-semibold flex"><span className="w-20 text-slate-400">Provider:</span> <span className="text-slate-800 truncate">{s.provider}</span></p>}
                       {s.amount && <p className="text-xs text-slate-500 font-semibold flex"><span className="w-20 text-slate-400">Amount:</span> <span className="text-emerald-700 font-bold">{s.amount}</span></p>}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="text-xs text-slate-500 font-bold">
                       {s.deadline ? `Due ${new Date(s.deadline).toLocaleDateString()}` : 'No Deadline'}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setSelected(s); }} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
                      {t('apply_now', lang)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {selected && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
              <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-extrabold text-slate-800 pr-8 leading-tight">{translateScholarshipName(selected.name, lang)}</h2>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 p-2 rounded-xl transition-colors">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-slate-800 font-bold mb-2 uppercase tracking-wide text-xs">Description</h4>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium bg-slate-50 p-4 rounded-xl border border-slate-100">{translateDescription(selected.description, lang)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                    <h4 className="text-emerald-800 font-bold mb-1 uppercase tracking-wide text-xs">Financial Benefit</h4>
                    <p className="text-emerald-700 font-black text-lg">{selected.amount || 'Variable'}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                     <h4 className="text-blue-800 font-bold mb-1 uppercase tracking-wide text-xs">Provider</h4>
                     <p className="text-blue-700 font-bold">{selected.provider || 'State Government'}</p>
                  </div>
                </div>

                {selected.eligibility_criteria && (
                  <div>
                    <h4 className="text-slate-800 font-bold mb-2 uppercase tracking-wide text-xs flex items-center gap-2"><Award className="h-4 w-4 text-amber-500"/> Eligibility Criteria</h4>
                    <p className="text-slate-600 text-sm whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">{selected.eligibility_criteria}</p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 pt-2">
                  {selected.education_qualifications && (() => {
                      let arr = [];
                      try { arr = Array.isArray(selected.education_qualifications) ? selected.education_qualifications : JSON.parse(selected.education_qualifications || "[]"); } catch(e){}
                      return arr;
                  })().map((q, i) => (
                    <span key={i} className="bg-indigo-50 text-indigo-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-indigo-100">{q}</span>
                  ))}
                  {selected.communities && (() => {
                      let arr = [];
                      try { arr = Array.isArray(selected.communities) ? selected.communities : JSON.parse(selected.communities || "[]"); } catch(e){}
                      return arr;
                  })().map((c, i) => (
                    <span key={i} className="bg-amber-50 text-amber-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-amber-100">{c}</span>
                  ))}
                </div>

              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3 flex-wrap">
                {selected.link && (
                  <a href={selected.link} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm tracking-wide uppercase hover:bg-slate-200 transition-colors flex items-center gap-2 border border-slate-200">
                    Official Portal <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                {appliedIds.has(selected._id || selected.id) ? (
                  <button disabled className="px-6 py-2.5 bg-emerald-100 text-emerald-800 rounded-xl font-black text-sm tracking-widest uppercase border border-emerald-200 flex items-center gap-2">
                     <CheckCircle className="h-4 w-4"/> Already Applied
                  </button>
                ) : isExpired(selected.deadline) ? (
                   <button disabled className="px-6 py-2.5 bg-red-100 text-red-800 rounded-xl font-black text-sm tracking-widest uppercase border border-red-200 flex items-center gap-2">
                      <XCircle className="h-4 w-4"/> Deadline Passed
                   </button>
                ) : (
                  <button onClick={() => handleApply(selected)} disabled={applying} className="px-6 py-2.5 bg-blue-600 text-white shadow-md rounded-xl font-black text-sm tracking-widest uppercase hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                    {applying ? "Processing..." : "Apply Instantly"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Scholarships;