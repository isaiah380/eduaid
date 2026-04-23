import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, Lock, ArrowLeft, Mail, Phone } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const API = `${BACKEND_URL}/api`;

function Login({ onLogin }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Detect if the input is an email or phone number
  const isEmail = (value) => value.includes('@');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);

    try {
      let emailToUse = identifier;

      // If user entered a phone number, look up their email first
      if (!isEmail(identifier)) {
        try {
          const lookupRes = await axios.post(`${API}/auth/lookup-email`, { phone: identifier });
          if (lookupRes.data.success && lookupRes.data.email) {
            emailToUse = lookupRes.data.email;
          } else {
            setError('No account found with this phone number.');
            setLoading(false);
            return;
          }
        } catch (err) {
          setError(err.response?.data?.detail || 'No account found with this phone number.');
          setLoading(false);
          return;
        }
      }

      // Sign in with Firebase using the email
      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
      const idToken = await userCredential.user.getIdToken();

      // Fetch profile from backend
      const response = await axios.get(`${API}/auth/profile`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (response.data.success) {
        const userData = response.data.user;
        onLogin(userData);
        localStorage.setItem('token', idToken);
        localStorage.setItem('role', userData.role);
        navigate(userData.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
      }
    } catch (err) {
      // Handle Firebase errors
      const firebaseCode = err?.code;
      if (firebaseCode === 'auth/user-not-found' || firebaseCode === 'auth/invalid-credential') {
        setError('Invalid credentials. Please check your email/phone and password.');
      } else if (firebaseCode === 'auth/wrong-password') {
        setError('Wrong password. Please try again.');
      } else if (firebaseCode === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Tricolor Header Bar */}
      <div className="h-2 w-full flex">
        <div className="flex-1 bg-orange-500"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-green-600"></div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative py-12">
        <div className="relative z-10 w-full max-w-md">
          <button onClick={() => navigate('/')} className="text-blue-600 hover:text-blue-800 mb-6 flex items-center gap-1 text-sm font-medium transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to role selection
          </button>

          <Card className="bg-white border-slate-200 shadow-xl shadow-slate-200/50">
            <CardHeader className="space-y-2 text-center border-b border-slate-100 pb-6 pt-8 bg-slate-50/50">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-600 p-4 rounded-2xl shadow-md">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-extrabold text-slate-800 tracking-tight">Student Login</CardTitle>
              <CardDescription className="text-slate-500 font-medium">Access your scholarship dashboard</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin} className="pt-6">
              <CardContent className="space-y-5">
                {error && <Alert variant="destructive" className="bg-red-50 border-red-200"><AlertDescription className="text-red-700 font-medium">{error}</AlertDescription></Alert>}

                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">
                    {isEmail(identifier) ? (
                      <><Mail className="inline h-4 w-4 mr-2 text-slate-400" />Email Address</>
                    ) : identifier.length > 0 ? (
                      <><Phone className="inline h-4 w-4 mr-2 text-slate-400" />Phone Number</>
                    ) : (
                      <><Mail className="inline h-4 w-4 mr-2 text-slate-400" />Email or Phone Number</>
                    )}
                  </Label>
                  <Input type="text" placeholder="Enter email or phone number" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:ring-blue-500 py-6" />
                  <p className="text-[10px] text-slate-400 font-medium pl-1">
                    {isEmail(identifier) ? '📧 Logging in with email' : identifier.length > 0 ? '📱 Logging in with phone number — we\'ll look up your email' : 'Accepts both email and mobile number'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold"><Lock className="inline h-4 w-4 mr-2 text-slate-400" />Password</Label>
                  <Input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:ring-blue-500 py-6" />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pb-8">
                <Button type="submit" className="w-full bg-blue-600 text-white font-bold py-6 shadow-md hover:bg-blue-700 transition-colors uppercase tracking-widest" disabled={loading}>
                  {loading ? 'Authenticating...' : 'Login Securely'}
                </Button>
                <div className="text-sm text-center text-slate-500 font-medium mt-4">
                  Don't have an account? <Link to="/register" className="text-blue-600 hover:text-blue-800 font-bold">Register here</Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Login;
