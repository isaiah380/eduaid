import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { t } from "@/lib/i18n";
import { ArrowLeft, Gift, ExternalLink, Search } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const API = `${BACKEND_URL}/api`;

function Benefits({ user, onLogout }) {
  const navigate = useNavigate();
  const lang = localStorage.getItem("language") || "en";

  const [benefits, setBenefits] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => { loadBenefits(); }, []);

  const loadBenefits = async () => {
    try {
      const res = await axios.get(`${API}/benefits`);
      if (res.data.success) { setBenefits(res.data.benefits); setFiltered(res.data.benefits); }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    let result = [...benefits];
    if (categoryFilter) result = result.filter(b => b.category === categoryFilter);
    if (searchQuery) result = result.filter(b => b.name?.toLowerCase().includes(searchQuery.toLowerCase()) || b.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    setFiltered(result);
  }, [categoryFilter, searchQuery, benefits]);

  const categories = [...new Set(benefits.map(b => b.category).filter(Boolean))];

  const categoryColors = {
    Entertainment: "from-pink-500 to-rose-500",
    Tech: "from-blue-500 to-cyan-500",
    Software: "from-purple-500 to-violet-500",
    Developer: "from-green-500 to-emerald-500",
    Learning: "from-yellow-500 to-orange-500",
    Shopping: "from-red-500 to-pink-500",
    Food: "from-orange-500 to-amber-500",
    Travel: "from-teal-500 to-cyan-500",
    "Health & Wellness": "from-indigo-500 to-blue-500",
    General: "from-gray-500 to-slate-500",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="text-blue-300 hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
            <Gift className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-white">{t("benefits", lang)} ({filtered.length})</h1>
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
              <input type="text" placeholder="Search benefits..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-blue-300/50 focus:outline-none focus:border-blue-400" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCategoryFilter("")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                ${!categoryFilter ? 'bg-blue-500 text-white' : 'bg-white/10 text-blue-300 hover:bg-white/20'}`}>
              {t("all", lang)}
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                  ${categoryFilter === cat ? 'bg-blue-500 text-white' : 'bg-white/10 text-blue-300 hover:bg-white/20'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b) => (
            <div key={b._id || b.id} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 hover:bg-white/15 transition-colors">
              <div className="flex items-start gap-3 mb-3">
                <div className={`bg-gradient-to-br ${categoryColors[b.category] || 'from-gray-500 to-slate-500'} p-2 rounded-xl flex-shrink-0`}>
                  <Gift className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">{b.name}</h3>
                  <span className="text-xs text-blue-300">{b.brand || b.category}</span>
                </div>
              </div>

              <p className="text-blue-200 text-sm mb-3 line-clamp-2">{b.description}</p>

              {b.discount && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-1.5 mb-3">
                  <span className="text-green-300 text-sm font-medium">{b.discount}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setSelected(b)}
                  className="flex-1 py-2 bg-indigo-500/20 text-indigo-300 rounded-xl text-sm font-medium hover:bg-indigo-500/30">
                  View Details
                </button>
                {b.link && (
                  <a href={b.link} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-2 bg-white/10 text-white rounded-xl text-sm flex items-center gap-1 hover:bg-white/20">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-slate-800 border border-white/20 w-full max-w-md rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="float-right text-gray-400 hover:text-white text-xl">✕</button>
            <div className="flex items-center gap-3 mb-4">
              <div className={`bg-gradient-to-br ${categoryColors[selected.category] || 'from-gray-500 to-slate-500'} p-3 rounded-xl`}>
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                <span className="text-blue-400 text-sm">{selected.category}</span>
              </div>
            </div>

            <p className="text-blue-200 mb-4">{selected.description}</p>

            {selected.discount && <p className="text-green-300 mb-2"><strong>💸 Discount:</strong> {selected.discount}</p>}
            {selected.eligibility && <p className="text-blue-200 mb-4"><strong>📋 Eligibility:</strong> {selected.eligibility}</p>}

            {selected.link && (
              <a href={selected.link} target="_blank" rel="noopener noreferrer"
                className="block w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium text-center hover:from-green-600 hover:to-emerald-700">
                🎁 {t("claim_benefit", lang)}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Benefits;