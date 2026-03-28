import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, Phone, Lock, User, Mail, Key, ArrowLeft, Calendar, Building } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const API = `${BACKEND_URL}/api`;

function Register({ onLogin }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', password: '', confirm_password: '',
    otp: '', dob: '', college_name: '', last_exam_date: ''
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

  const handleSendOtp = async (e) => {
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
      const response = await axios.post(`${API}/auth/send-otp`, { email: formData.email });
      if (response.data.success) {
        setSuccess(`OTP sent to ${response.data.email_masked}. Check your email or backend console.`);
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP.');
    } finally { setLoading(false); }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);

    try {
      // Verify OTP
      const verifyRes = await axios.post(`${API}/auth/verify-otp`, { email: formData.email, otp: formData.otp });
      if (!verifyRes.data.success) { setError('Invalid OTP'); setLoading(false); return; }

      // Register
      const registerRes = await axios.post(`${API}/auth/register`, {
        full_name: formData.full_name, email: formData.email, phone: formData.phone,
        password: formData.password, dob: formData.dob || null,
        college_name: formData.college_name, last_exam_date: formData.last_exam_date || null
      });

      if (registerRes.data.success) {
        onLogin(registerRes.data.user);
        localStorage.setItem('token', registerRes.data.token);
        localStorage.setItem('role', registerRes.data.user.role);
        navigate('/select-language');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <button onClick={() => navigate('/')} className="text-blue-300 hover:text-white mb-4 flex items-center gap-1 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to role selection
        </button>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">Create Account</CardTitle>
            <CardDescription className="text-blue-200">Register to find scholarships</CardDescription>
            {/* Step indicators */}
            <div className="flex justify-center mt-3">
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-blue-500' : 'bg-white/20'}`} />
                <div className={`h-2 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-blue-500' : 'bg-white/20'}`} />
              </div>
            </div>
          </CardHeader>

          {/* Step 1: User Details */}
          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              <CardContent className="space-y-3">
                {error && <Alert variant="destructive" className="bg-red-500/20 border-red-500/50"><AlertDescription className="text-red-200">{error}</AlertDescription></Alert>}

                <div className="space-y-1">
                  <Label className="text-blue-100 text-sm"><User className="inline h-3 w-3 mr-1" />Full Name</Label>
                  <Input type="text" placeholder="Enter your full name" value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-300/50" />
                </div>

                <div className="space-y-1">
                  <Label className="text-blue-100 text-sm"><Mail className="inline h-3 w-3 mr-1" />Email Address</Label>
                  <Input type="email" placeholder="your.email@example.com" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })} required
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-300/50" />
                  <p className="text-xs text-blue-300/70">OTP will be sent to this email</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-blue-100 text-sm"><Phone className="inline h-3 w-3 mr-1" />Phone Number</Label>
                  <Input type="tel" placeholder="10-digit mobile number" value={formData.phone}
                    onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setFormData({ ...formData, phone: v }); }}
                    required maxLength={10}
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-300/50" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-blue-100 text-sm"><Calendar className="inline h-3 w-3 mr-1" />Date of Birth</Label>
                    <Input type="date" value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="bg-white/10 border-white/20 text-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-blue-100 text-sm"><Calendar className="inline h-3 w-3 mr-1" />12th Exam Date</Label>
                    <Input type="date" value={formData.last_exam_date}
                      onChange={(e) => setFormData({ ...formData, last_exam_date: e.target.value })}
                      className="bg-white/10 border-white/20 text-white" max="2026-02-28" />
                    <p className="text-xs text-yellow-300/70">Must be ≤ Feb 2026</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-blue-100 text-sm"><Building className="inline h-3 w-3 mr-1" />College Name</Label>
                  <Input type="text" placeholder="Your college name" value={formData.college_name}
                    onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-300/50" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-blue-100 text-sm"><Lock className="inline h-3 w-3 mr-1" />Password</Label>
                    <Input type="password" placeholder="Min 6 chars" value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6}
                      className="bg-white/10 border-white/20 text-white placeholder:text-blue-300/50" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-blue-100 text-sm"><Lock className="inline h-3 w-3 mr-1" />Confirm</Label>
                    <Input type="password" placeholder="Re-enter" value={formData.confirm_password}
                      onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })} required minLength={6}
                      className="bg-white/10 border-white/20 text-white placeholder:text-blue-300/50" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-3">
                <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700" disabled={loading}>
                  {loading ? 'Sending OTP...' : 'Send OTP to Email'}
                </Button>
                <p className="text-sm text-center text-blue-200">
                  Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300 underline">Login here</Link>
                </p>
              </CardFooter>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyAndRegister}>
              <CardContent className="space-y-4">
                {error && <Alert variant="destructive" className="bg-red-500/20 border-red-500/50"><AlertDescription className="text-red-200">{error}</AlertDescription></Alert>}
                {success && <Alert className="bg-green-500/20 border-green-500/50"><AlertDescription className="text-green-200">{success}</AlertDescription></Alert>}

                <div className="space-y-2">
                  <Label className="text-blue-100"><Key className="inline h-4 w-4 mr-2" />Enter OTP</Label>
                  <Input type="text" placeholder="Enter 6-digit OTP" value={formData.otp}
                    onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setFormData({ ...formData, otp: v }); }}
                    required maxLength={6}
                    className="bg-white/10 border-white/20 text-white text-center text-2xl tracking-widest placeholder:text-blue-300/50 placeholder:text-base placeholder:tracking-normal" />
                  <p className="text-xs text-blue-300">OTP sent to {formData.email.substring(0, 3)}****@{formData.email.split('@')[1]}</p>
                  <p className="text-xs text-yellow-300">💡 Check backend console for the OTP</p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-3">
                <Button type="submit" className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  disabled={loading || formData.otp.length !== 6}>
                  {loading ? 'Verifying...' : 'Verify OTP & Register'}
                </Button>
                <Button type="button" variant="outline" className="w-full border-white/20 text-blue-200 hover:bg-white/10"
                  onClick={() => setStep(1)}>
                  ← Back to Form
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export default Register;
