import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { t } from "@/lib/i18n";
import { translateScholarshipName, translateDescription } from "@/lib/scholarshipTranslations";
import { ArrowLeft, Search, Ticket, ExternalLink, Tag, X, Info, CheckCircle2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const API = `${BACKEND_URL}/api`;

function Benefits({ user, onLogout }) {
  const navigate = useNavigate();
  const lang = localStorage.getItem("language") || "en";

  const [benefits, setBenefits] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [selectedBenefit, setSelectedBenefit] = useState(null);

  useEffect(() => { loadBenefits(); }, []);

  const loadBenefits = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/benefits`);
      if (res.data.success) {
        setBenefits(res.data.benefits);
        setFiltered(res.data.benefits);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    let result = [...benefits];
    if (searchQuery) result = result.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.brand?.toLowerCase().includes(searchQuery.toLowerCase()));
    if (catFilter) result = result.filter(b => b.category === catFilter);
    setFiltered(result);
  }, [searchQuery, catFilter, benefits]);

  const categories = [...new Set(benefits.map(b => b.category).filter(Boolean))];

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
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-md">
               <Ticket className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">{t("explore_benefits", lang)} <span className="text-slate-400 font-medium ml-1 text-base">({filtered.length})</span></h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mb-8 shadow-sm">
           <div className="flex items-start gap-4">
              <div className="bg-indigo-100 p-3 rounded-full mt-0.5">
                 <Tag className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                 <h3 className="text-indigo-900 font-bold mb-1 text-lg">Student Discounts & Offers</h3>
                 <p className="text-indigo-800 text-sm font-medium">Use your verified student identity to unlock exclusive software, hardware, and lifestyle discounts from top brands globally.</p>
              </div>
           </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
              <input type="text" placeholder="Search brands or offers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 font-medium focus:outline-none focus:border-indigo-500 transition-shadow" />
            </div>
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="md:w-64 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-indigo-500">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((b) => (
              <div key={b.id} onClick={() => setSelectedBenefit(b)} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group cursor-pointer relative">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 text-[10px] uppercase font-black tracking-widest rounded-md border border-indigo-100">{b.category}</span>
                  {b.discount && <span className="bg-emerald-50 text-emerald-700 font-black text-xs px-2.5 py-1 rounded-md border border-emerald-100 uppercase tracking-widest">{b.discount}</span>}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1 leading-tight">{translateScholarshipName(b.brand || b.name, lang)}</h3>
                <h4 className="text-sm font-semibold text-slate-500 mb-3">{translateScholarshipName(b.name, lang)}</h4>
                
                <p className="text-sm text-slate-600 line-clamp-3 font-medium flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed mb-4">
                  {translateDescription(b.description, lang)}
                </p>

                <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center">
                  <div className="text-xs text-amber-600 font-bold max-w-[50%] truncate">
                    {b.eligibility ? `Req: ${b.eligibility}` : 'Standard Verify'}
                  </div>
                  {b.link && (
                    <a href={b.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors uppercase tracking-wide">
                      Claim <ExternalLink className="h-3 w-3 ml-1.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Benefit Preview Modal */}
      {selectedBenefit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedBenefit(null)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-indigo-600 p-6 text-white relative">
              <button 
                onClick={() => setSelectedBenefit(null)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white/30 backdrop-blur-md">
                {selectedBenefit.category || "Benefit"}
              </div>
              <h2 className="text-2xl font-black mb-1 leading-tight">{translateScholarshipName(selectedBenefit.brand || selectedBenefit.name, lang)}</h2>
              {(selectedBenefit.brand && selectedBenefit.name !== selectedBenefit.brand) && (
                <h3 className="text-indigo-100 font-medium">{translateScholarshipName(selectedBenefit.name, lang)}</h3>
              )}
            </div>
            
            {/* Body */}
            <div className="p-6">
              <div className="mb-6">
                 <h4 className="flex items-center text-sm font-bold text-slate-800 mb-2 uppercase tracking-wide">
                   <Info className="h-4 w-4 mr-2 text-indigo-600" /> Details
                 </h4>
                 <div className="text-slate-600 bg-slate-50 border border-slate-100 p-4 rounded-xl leading-relaxed text-sm font-medium">
                   {translateDescription(selectedBenefit.description || "No description available.", lang)}
                 </div>
              </div>

              <div className="mb-8">
                 <h4 className="flex items-center text-sm font-bold text-slate-800 mb-2 uppercase tracking-wide">
                   <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" /> Eligibility
                 </h4>
                 <div className="text-slate-600 bg-emerald-50 border border-emerald-100 p-4 rounded-xl leading-relaxed text-sm font-medium">
                   {selectedBenefit.eligibility || "Standard student verification required."}
                 </div>
              </div>

              {/* Action */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setSelectedBenefit(null)}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
                {selectedBenefit.link ? (
                  <a 
                    href={selectedBenefit.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors"
                  >
                    Go to Website <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                ) : (
                  <button disabled className="px-6 py-2.5 bg-slate-300 text-slate-500 font-bold rounded-xl cursor-not-allowed">
                    No Link Available
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Benefits;