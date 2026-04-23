import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, Phone, Lock, User, Mail, ArrowLeft, Calendar, Building, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const API = `${BACKEND_URL}/api`;

function Register({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', password: '', confirm_password: '',
    dob: '', college_name: '', last_exam_date: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) return 'Phone number must be exactly 10 digits';
    if (!['6', '7', '8', '9'].includes(cleaned[0])) return 'Invalid Indian mobile number';
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!formData.full_name.trim()) { setError('Please enter your full name'); return; }
    if (!validateEmail(formData.email)) { setError('Please enter a valid email address'); return; }
    const phoneError = validatePhone(formData.phone);
    if (phoneError) { setError(phoneError); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (formData.password !== formData.confirm_password) { setError('Passwords do not match'); return; }

    // Validate 12th exam date
    if (formData.last_exam_date) {
      const examDate = new Date(formData.last_exam_date);
      const cutoff = new Date('2026-02-28');
      if (examDate > cutoff) {
        setError('Only students who passed 12th grade exam on or before February 2026 are eligible.');
        return;
      }
    }

    setLoading(true);

    try {
      // Step 1: Create Firebase account
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const idToken = await userCredential.user.getIdToken();

      // Step 2: Create profile in backend (SQLite)
      const registerRes = await axios.post(`${API}/auth/register`, {
        full_name: formData.full_name,
        phone: formData.phone,
        dob: formData.dob || null,
        college_name: formData.college_name,
        last_exam_date: formData.last_exam_date || null
      }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (registerRes.data.success) {
        setSuccess('Registration successful! Redirecting...');
        localStorage.setItem('token', idToken);
        localStorage.setItem('role', registerRes.data.user.role);

        setTimeout(() => {
          onLogin(registerRes.data.user);
          navigate('/select-language');
        }, 1500);
      }
    } catch (err) {
      // Handle Firebase errors
      const firebaseCode = err?.code;
      if (firebaseCode === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.');
      } else if (firebaseCode === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Registration failed. Please try again.');
      }
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
        <div className="absolute top-0 w-full h-64 bg-slate-100 border-b border-slate-200"></div>

        <div className="relative z-10 w-full max-w-xl">
          <button onClick={() => navigate('/login')} className="text-blue-600 hover:text-blue-800 mb-6 flex items-center gap-1 text-sm font-bold tracking-wide uppercase transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to login
          </button>

          <Card className="bg-white border-slate-200 shadow-xl shadow-slate-200/50">
            <CardHeader className="space-y-1 text-center bg-slate-50/50 border-b border-slate-100 pb-6 pt-6">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-600 p-4 rounded-2xl shadow-md">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-extrabold text-slate-800 tracking-tight">Create Account</CardTitle>
              <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[#000000_10px]">Secure Registration</CardDescription>
            </CardHeader>

            <form onSubmit={handleRegister} className="pt-8">
              <CardContent className="space-y-4">
                {error && <Alert variant="destructive" className="bg-red-50 border-red-200"><AlertDescription className="text-red-600 font-bold">{error}</AlertDescription></Alert>}
                {success && <Alert className="bg-emerald-50 border-emerald-200"><AlertDescription className="text-emerald-700 font-bold flex items-center gap-2 tracking-wide"><CheckCircle className="h-5 w-5"/> {success}</AlertDescription></Alert>}

                <div className="space-y-1.5 border border-slate-200 bg-slate-50 p-4 rounded-xl">
                   <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 text-center text-blue-600">🔥 Firebase Secured Registration</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider pl-1"><User className="inline h-3.5 w-3.5 mr-1 text-slate-500" />Full Name</Label>
                  <Input type="text" placeholder="Enter your full name" value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required
                    className="bg-white font-medium border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 py-6" />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider pl-1"><Mail className="inline h-3.5 w-3.5 mr-1 text-slate-500" />Email Address</Label>
                  <Input type="email" placeholder="your.email@example.com" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })} required
                    className="bg-white font-medium border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 py-6" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider pl-1"><Phone className="inline h-3.5 w-3.5 mr-1 text-slate-500" />Phone Number</Label>
                    <Input type="tel" placeholder="10-digit mobile number" value={formData.phone}
                      onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setFormData({ ...formData, phone: v }); }}
                      required maxLength={10}
                      className="bg-white font-medium border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 py-6" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider pl-1"><Building className="inline h-3.5 w-3.5 mr-1 text-slate-500" />College Name</Label>
                    <Input type="text" placeholder="Your college name" value={formData.college_name}
                      onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                      className="bg-white font-medium border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 py-6" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider pl-1"><Calendar className="inline h-3.5 w-3.5 mr-1 text-slate-500" />Date of Birth</Label>
                    <Input type="date" value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })} required
                      className="bg-white font-medium border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-500 py-6" />
                    {formData.dob && (
                      <p className={`text-[10px] font-bold uppercase pl-1 tracking-wider ${new Date().getFullYear() - new Date(formData.dob).getFullYear() > 40 ? 'text-red-500' : 'text-emerald-500'}`}>
                        Calculated Age: {new Date().getFullYear() - new Date(formData.dob).getFullYear()} Years
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider pl-1"><Calendar className="inline h-3.5 w-3.5 mr-1 text-slate-500" />12th Exam Date</Label>
                    <Input type="date" value={formData.last_exam_date}
                      onChange={(e) => setFormData({ ...formData, last_exam_date: e.target.value })}
                      className="bg-white font-medium border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-500 py-6" max="2026-02-28" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase pl-1 tracking-wider">Must be ≤ Feb 2026</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider pl-1"><Lock className="inline h-3.5 w-3.5 mr-1 text-slate-500" />Password</Label>
                    <Input type="password" placeholder="Min 6 chars" value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6}
                      className="bg-white font-medium border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 py-6" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider pl-1"><Lock className="inline h-3.5 w-3.5 mr-1 text-slate-500" />Confirm</Label>
                    <Input type="password" placeholder="Re-enter" value={formData.confirm_password}
                      onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })} required minLength={6}
                      className="bg-white font-medium border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 py-6" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pb-8">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors py-6 text-sm font-bold tracking-widest uppercase" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Student Account'}
                </Button>
                <p className="text-sm text-center text-slate-500 font-medium pt-2">
                  Already have an account? <Link to="/login" className="text-blue-600 hover:text-blue-800 font-bold tracking-wide">Login here</Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Register;
