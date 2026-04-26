/* eslint-disable */
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft, Award, CheckCircle, ExternalLink, FileText,
  Loader2, Send, User, ChevronRight, ChevronLeft, ShieldCheck, XCircle
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const API = `${BACKEND_URL}/api`;

const STEPS = ["Review Scholarship", "Your Application", "Confirm & Submit"];

function ApplyScholarship({ user, onLogout }) {
  const { scholarshipId } = useParams();
  const navigate = useNavigate();

  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  const [form, setForm] = useState({
    reason: "",
    goals: "",
    declaration: false,
  });

  useEffect(() => {
    loadScholarship();
    checkAlreadyApplied();
  }, [scholarshipId]);

  const loadScholarship = async () => {
    try {
      const res = await axios.get(`${API}/scholarships`);
      if (res.data.success) {
        const found = res.data.scholarships.find(
          (s) => (s._id || s.id) === scholarshipId
        );
        setScholarship(found || null);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const checkAlreadyApplied = async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`${API}/applications/${user.id}`);
      if (res.data.success) {
        const applied = res.data.applications.some(
          (a) => a.scholarship_id === scholarshipId
        );
        setAlreadyApplied(applied);
      }
    } catch (err) {}
  };

  const handleSubmit = async () => {
    if (!form.declaration) {
      setError("Please accept the declaration to proceed.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const personalStatement = `Reason for applying: ${form.reason}\n\nFuture goals: ${form.goals}`;
      const res = await axios.post(`${API}/applications`, {
        user_id: user.id,
        scholarship_id: scholarshipId,
        personal_statement: personalStatement,
        eligibility_check: { checked_at: new Date().toISOString() },
      });
      if (res.data.success) {
        setSubmitted(true);
        setTimeout(() => navigate("/scholarships"), 4000);
      } else {
        setError(res.data.detail || "Submission failed.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit application.");
    }
    setSubmitting(false);
  };

  const canNext = () => {
    if (step === 1) return form.reason.trim().length >= 20 && form.goals.trim().length >= 10;
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!scholarship) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-slate-700 font-bold text-lg">Scholarship not found</p>
          <button onClick={() => navigate("/scholarships")} className="mt-4 text-blue-600 font-bold underline">
            ← Back to Scholarships
          </button>
        </div>
      </div>
    );
  }

  // ──── SUCCESS SCREEN ────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full text-center border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-3">Application Submitted!</h2>
          <p className="text-slate-500 font-medium mb-2">
            Your application for <span className="font-bold text-indigo-700">{scholarship.name}</span> has been received.
          </p>
          <p className="text-slate-400 text-sm font-medium mb-8">
            The admin has been notified and will review your application. You can track the status in your Profile.
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 mb-8 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <p className="text-emerald-800 font-semibold text-sm text-left">
              Redirecting you back to scholarships in a few seconds…
            </p>
          </div>
          <button
            onClick={() => navigate("/scholarships")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl transition-colors shadow-lg shadow-emerald-200"
          >
            Back to Scholarships
          </button>
        </div>
      </div>
    );
  }

  // ──── ALREADY APPLIED ────
  if (alreadyApplied) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center border border-slate-200">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-800 mb-2">Already Applied</h2>
          <p className="text-slate-500 font-medium mb-6">
            You have already submitted an application for <strong>{scholarship.name}</strong>.
            Track the status in your Profile.
          </p>
          <button onClick={() => navigate("/scholarships")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl transition-colors">
            ← Back to Scholarships
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* Tricolor Bar */}
      <div className="h-1.5 w-full flex fixed top-0 z-50">
        <div className="flex-1 bg-orange-500" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-green-600" />
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 mt-1.5 sticky top-1.5 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/scholarships")}
            className="text-slate-500 hover:text-blue-600 mr-1 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="bg-blue-600 p-2 rounded-xl shadow-md">
            <Award className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-800 leading-tight">Apply for Scholarship</h1>
            <p className="text-xs text-slate-500 font-semibold truncate max-w-xs">{scholarship.name}</p>
          </div>
          {/* Official Portal Link */}
          {scholarship.link && (
            <a
              href={scholarship.link}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1.5 text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
            >
              Official Portal <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">

        {/* Step Progress */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((label, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all ${
                  i < step ? "bg-emerald-500 text-white shadow-md" :
                  i === step ? "bg-blue-600 text-white shadow-lg shadow-blue-200" :
                  "bg-slate-200 text-slate-500"
                }`}>
                  {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-xs font-bold hidden sm:block ${
                  i === step ? "text-blue-700" : i < step ? "text-emerald-600" : "text-slate-400"
                }`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 rounded-full transition-all ${i < step ? "bg-emerald-400" : "bg-slate-200"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── STEP 0: Review Scholarship ── */}
        {step === 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4 gap-4">
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border inline-block mb-3 ${
                    scholarship.type === 'MERIT' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                    scholarship.type === 'NEED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    scholarship.type === 'GIRL_CHILD' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                    'bg-violet-50 text-violet-700 border-violet-100'
                  }`}>{scholarship.type}</span>
                  <h2 className="text-2xl font-extrabold text-slate-800 leading-tight">{scholarship.name}</h2>
                  {scholarship.provider && (
                    <p className="text-sm text-slate-500 font-semibold mt-1">by {scholarship.provider}</p>
                  )}
                </div>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6">
                {scholarship.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {scholarship.amount && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Benefit</p>
                    <p className="text-emerald-800 font-black text-lg">{scholarship.amount}</p>
                  </div>
                )}
                {scholarship.deadline && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Deadline</p>
                    <p className="text-amber-800 font-bold text-sm">{new Date(scholarship.deadline).toLocaleDateString()}</p>
                  </div>
                )}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Applicant</p>
                  <p className="text-blue-800 font-bold text-sm truncate">{user?.full_name || "You"}</p>
                </div>
              </div>

              {scholarship.eligibility_criteria && (
                <div className="mt-5 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Eligibility Criteria</p>
                  <p className="text-indigo-800 text-sm font-medium whitespace-pre-wrap">{scholarship.eligibility_criteria}</p>
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
              <FileText className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 text-sm mb-1">Before You Apply</p>
                <p className="text-amber-800 text-xs font-medium leading-relaxed">
                  This is an internal application through EduAid. The admin will review your application and contact you. You may also apply directly on the official government portal.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1: Personal Statement ── */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-2.5 rounded-xl">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">Your Application</h2>
                  <p className="text-xs text-slate-500 font-medium">Tell us why you deserve this scholarship</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                    Why are you applying for this scholarship? *
                    <span className="text-slate-400 font-medium ml-2 normal-case tracking-normal">(min. 20 characters)</span>
                  </label>
                  <textarea
                    rows={5}
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    placeholder="Describe your financial situation, academic background, and why you need this scholarship..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 resize-none transition-shadow"
                  />
                  <p className={`text-xs font-semibold mt-1 text-right ${form.reason.length >= 20 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {form.reason.length} / 20 min
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                    Your future goals & how this scholarship helps *
                    <span className="text-slate-400 font-medium ml-2 normal-case tracking-normal">(min. 10 characters)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={form.goals}
                    onChange={(e) => setForm({ ...form, goals: e.target.value })}
                    placeholder="What do you plan to study or achieve? How will this scholarship support your goals?"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 resize-none transition-shadow"
                  />
                  <p className={`text-xs font-semibold mt-1 text-right ${form.goals.length >= 10 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {form.goals.length} / 10 min
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Confirm & Submit ── */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-slate-800 mb-5 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" /> Review & Confirm
              </h2>

              {/* Application Summary */}
              <div className="space-y-4 mb-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Applying For</p>
                  <p className="font-bold text-indigo-700">{scholarship.name}</p>
                  {scholarship.provider && <p className="text-xs text-slate-500 mt-0.5">by {scholarship.provider}</p>}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Applicant</p>
                  <p className="font-bold text-slate-800">{user?.full_name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Statement</p>
                  <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                    {form.reason}
                  </p>
                  {form.goals && (
                    <>
                      <hr className="my-3 border-slate-200" />
                      <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">{form.goals}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Declaration checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.declaration}
                  onChange={(e) => { setForm({ ...form, declaration: e.target.checked }); setError(""); }}
                  className="w-4 h-4 mt-0.5 accent-emerald-600 flex-shrink-0"
                />
                <span className="text-sm text-slate-600 font-medium leading-relaxed group-hover:text-slate-800 transition-colors">
                  I hereby declare that all the information provided in this application is true and correct to the best of my knowledge. I understand that any false information may result in disqualification.
                </span>
              </label>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm font-semibold">{error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 gap-4">
          <button
            onClick={() => step === 0 ? navigate("/scholarships") : setStep(step - 1)}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            {step === 0 ? "Back to Scholarships" : "Previous"}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black text-sm transition-all shadow-md ${
                canNext()
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              }`}
            >
              Next Step <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
              ) : (
                <><Send className="h-4 w-4" /> Submit Application</>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default ApplyScholarship;
