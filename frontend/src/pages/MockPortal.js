import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { CheckCircle, ShieldCheck, FileText, Loader2, IndianRupee } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const API = `${BACKEND_URL}/api`;

function MockPortal({ user }) {
  const { scholarshipId } = useParams();
  const navigate = useNavigate();

  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    aadharNumber: "",
    bankAccount: "",
    ifscCode: "",
    declaration: false,
  });

  const [isIfscVerified, setIsIfscVerified] = useState(false);
  const [ifscDetails, setIfscDetails] = useState(null);
  const [ifscError, setIfscError] = useState("");
  const [verifyingIfsc, setVerifyingIfsc] = useState(false);

  const verifyIfsc = async () => {
    setIfscError("");
    setIfscDetails(null);
    setIsIfscVerified(false);
    
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    const code = form.ifscCode.trim().toUpperCase();
    if (!ifscRegex.test(code)) {
      setIfscError("Invalid IFSC format. Must be 4 letters, a '0', and 6 alphanumeric characters.");
      return;
    }

    setVerifyingIfsc(true);
    // Use simulated API to avoid external CORS/timeout issues
    setTimeout(() => {
      let bankName = "National Bank";
      if (code.startsWith("SBIN")) bankName = "State Bank of India";
      else if (code.startsWith("HDFC")) bankName = "HDFC Bank";
      else if (code.startsWith("ICIC")) bankName = "ICICI Bank";
      else if (code.startsWith("UTIB")) bankName = "Axis Bank";
      else if (code.startsWith("PUNB")) bankName = "Punjab National Bank";
      else if (code.startsWith("BKID")) bankName = "Bank of India";
      
      setIfscDetails(`${bankName}, Central Branch`);
      setIsIfscVerified(true);
      setVerifyingIfsc(false);
    }, 800);
  };

  useEffect(() => {
    const fetchScholarship = async () => {
      try {
        const res = await axios.get(`${API}/scholarships`);
        if (res.data.success) {
          const found = res.data.scholarships.find(s => (s._id || s.id) === scholarshipId);
          setScholarship(found || null);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchScholarship();
  }, [scholarshipId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const aadharRegex = /^\d{12}$/;
    if (!aadharRegex.test(form.aadharNumber.trim())) {
      alert("Invalid Aadhar Number! Please enter exactly 12 digits.");
      return;
    }

    const bankAccountRegex = /^\d{9,18}$/;
    if (!bankAccountRegex.test(form.bankAccount.trim())) {
      alert("Invalid Bank Account Number! It should contain 9 to 18 digits.");
      return;
    }

    if (!isIfscVerified) {
      alert("Please verify your Bank IFSC Code before submitting.");
      return;
    }

    if (!form.declaration) {
      alert("Please accept the declaration to proceed.");
      return;
    }
    
    setSubmitting(true);
    try {
      const personalStatement = `Aadhar: ${form.aadharNumber}\nBank Account: ${form.bankAccount}\nIFSC: ${form.ifscCode}`;
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
        alert(res.data.detail || "Submission failed.");
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to submit application.");
    }
    setSubmitting(false);
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
          <p className="text-slate-700 font-bold text-lg">Scholarship not found</p>
          <button onClick={() => navigate("/scholarships")} className="mt-4 text-blue-600 font-bold underline">
            Return to Scholarships
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full text-center border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-3">Application Submitted!</h2>
          <p className="text-slate-500 font-medium mb-2">
            Your application for <span className="font-bold text-indigo-700">{scholarship.name}</span> has been successfully submitted to the National Scholarship Portal demo.
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 mt-8 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <p className="text-emerald-800 font-semibold text-sm text-left">
              Redirecting you back to EduAid in a few seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-16">
      {/* Mock Government Header */}
      <header className="bg-blue-900 border-b-4 border-yellow-500 shadow-md">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-full">
              <IndianRupee className="h-8 w-8 text-blue-900" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-wide">National Scholarship Portal</h1>
              <p className="text-blue-200 text-sm font-semibold tracking-widest uppercase">Government of India</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-blue-100 text-xs font-medium">Demo Purpose Only</p>
            <p className="text-white text-sm font-bold">Scholarship Application Form</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white shadow-xl rounded-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Applying for: {scholarship.name}</h2>
            <p className="text-slate-500 text-sm">Fill in the details below to complete your application process.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-blue-800 text-sm font-medium leading-relaxed">
                  Please keep your Aadhar Card, Bank Passbook, and necessary documents ready. The information provided must match your official records.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Aadhar Number *</label>
                <input 
                  type="text" 
                  required
                  placeholder="12-digit Aadhar Number"
                  value={form.aadharNumber}
                  onChange={(e) => setForm({...form, aadharNumber: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Applicant Full Name *</label>
                <input 
                  type="text" 
                  required
                  readOnly
                  value={user?.full_name || ""}
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-300 rounded text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Bank Account Number *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Account Number"
                  value={form.bankAccount}
                  onChange={(e) => setForm({...form, bankAccount: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Bank IFSC Code *</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. SBIN0001234"
                    value={form.ifscCode}
                    onChange={(e) => {
                      setForm({...form, ifscCode: e.target.value.toUpperCase()});
                      setIsIfscVerified(false);
                      setIfscDetails(null);
                      setIfscError("");
                    }}
                    className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 uppercase"
                  />
                  <button type="button" onClick={verifyIfsc} disabled={verifyingIfsc} className="px-4 bg-slate-800 text-white font-bold rounded hover:bg-slate-900 transition-colors whitespace-nowrap text-sm disabled:opacity-50">
                    {verifyingIfsc ? "Checking..." : "Verify"}
                  </button>
                </div>
                {ifscError && <p className="text-red-500 text-xs font-bold mt-1">{ifscError}</p>}
                {isIfscVerified && ifscDetails && (
                  <p className="text-emerald-600 text-xs font-bold mt-1 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> {ifscDetails}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  required
                  checked={form.declaration}
                  onChange={(e) => setForm({...form, declaration: e.target.checked})}
                  className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600">
                  I hereby declare that the details furnished above are true and correct to the best of my knowledge and belief. I understand that if any information is found to be false, my application will be rejected.
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button 
                type="button"
                onClick={() => navigate("/scholarships")}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 font-bold rounded hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={submitting}
                className="px-8 py-2.5 bg-blue-700 text-white font-bold rounded hover:bg-blue-800 transition-colors shadow-md flex items-center gap-2"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                ) : (
                  "Final Submit"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default MockPortal;
