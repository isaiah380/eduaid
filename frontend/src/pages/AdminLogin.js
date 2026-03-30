import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Phone, Lock, ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const API = `${BACKEND_URL}/api`;

function AdminLogin({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, { phone, password, loginType: 'ADMIN' });
      if (response.data.success) {
        onLogin(response.data.user);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.user.role);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Invalid admin credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Tricolor Header Bar */}
      <div className="h-2 w-full flex fixed top-0 z-50">
        <div className="flex-1 bg-orange-500"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-green-600"></div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative py-12">
        <div className="relative z-10 w-full max-w-md">
          <button onClick={() => navigate('/')} className="text-emerald-600 hover:text-emerald-800 mb-6 flex items-center gap-1 text-sm font-bold tracking-wide uppercase transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to role selection
          </button>

          <Card className="bg-white border-slate-200 shadow-xl shadow-slate-200/50">
            <CardHeader className="space-y-2 text-center border-b border-slate-100 pb-6 pt-8 bg-slate-50/50">
              <div className="flex justify-center mb-4">
                <div className="bg-emerald-600 p-4 rounded-2xl shadow-md">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-extrabold text-slate-800 tracking-tight">Admin Portal</CardTitle>
              <CardDescription className="text-slate-500 font-bold tracking-widest uppercase">College & Provider Access</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin} className="pt-6">
              <CardContent className="space-y-5">
                {error && <Alert variant="destructive" className="bg-red-50 border-red-200"><AlertDescription className="text-red-700 font-medium">{error}</AlertDescription></Alert>}

                <div className="space-y-1.5 border-2 border-slate-100 bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                     <Shield className="h-4 w-4 text-emerald-600"/>
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Administrator Credentials</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">Username: <strong className="text-slate-900">9999999999</strong></p>
                  <p className="text-xs text-slate-700 font-medium">Password: <strong className="text-slate-900">admin123</strong></p>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold uppercase text-xs tracking-wider pl-1"><Phone className="inline h-3.5 w-3.5 mr-1 text-emerald-600" />Admin Phone</Label>
                  <Input type="tel" placeholder="10-digit mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} required
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-300 focus:border-emerald-500 focus:ring-emerald-500 font-medium py-6" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold uppercase text-xs tracking-wider pl-1"><Lock className="inline h-3.5 w-3.5 mr-1 text-emerald-600" />Password</Label>
                  <Input type="password" placeholder="Enter admin password" value={password} onChange={(e) => setPassword(e.target.value)} required
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-300 focus:border-emerald-500 focus:ring-emerald-500 font-medium py-6" />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pb-8">
                <Button type="submit" className="w-full bg-emerald-600 text-white font-bold py-6 text-sm tracking-widest uppercase shadow-md hover:bg-emerald-700 transition-colors" disabled={loading}>
                  {loading ? 'Authenticating...' : 'Secure Login'}
                </Button>
                <div className="text-sm text-center text-slate-500 font-medium mt-4">
                  Not an admin? <Link to="/login" className="text-emerald-600 hover:text-emerald-800 font-bold tracking-wide">Student Login</Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;