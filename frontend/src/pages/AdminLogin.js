import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Phone, Lock, ArrowLeft } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const API = `${BACKEND_URL}/api`;

function AdminLogin({ onLogin }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);

    try {
      const res = await axios.post(`${API}/auth/login`, { phone, password, loginType: "ADMIN" });
      if (res.data.success) {
        onLogin(res.data.user);
        localStorage.setItem("role", res.data.user.role);
        localStorage.setItem("token", res.data.token);
        navigate("/admin/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <button onClick={() => navigate("/")} className="text-blue-300 hover:text-white mb-4 flex items-center gap-1 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to role selection
        </button>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">Admin Login</h2>
            <p className="text-blue-200 text-sm mt-1">College administration panel</p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-blue-100 text-sm flex items-center gap-1"><Phone className="h-3 w-3" />Phone Number</label>
              <input type="tel" placeholder="Admin phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-blue-300/50 focus:outline-none focus:border-indigo-400" />
            </div>
            <div className="space-y-1">
              <label className="text-blue-100 text-sm flex items-center gap-1"><Lock className="h-3 w-3" />Password</label>
              <input type="password" placeholder="Admin password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-blue-300/50 focus:outline-none focus:border-indigo-400" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold
                         hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50">
              {loading ? "Logging in..." : "Login as Admin"}
            </button>
          </form>

          <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
            <p className="text-indigo-200 text-xs text-center">
              🔑 Default admin: Phone <strong>9999999999</strong> / Password <strong>admin123</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;