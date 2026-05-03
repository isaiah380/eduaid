import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, ArrowLeft, Mail, User, Phone, Building, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const API = `${BACKEND_URL}/api`;

function AdminRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', password: '', confirm_password: '',
    college_name: 'FCRIT', role: 'ADMIN'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setCreatedUser(null);

    if (!formData.full_name.trim()) { setError('Please enter full name'); return; }
    if (!formData.email.trim()) { setError('Please enter email address'); return; }
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) { setError('Phone number must be exactly 10 digits'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (formData.password !== formData.confirm_password) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/admin/register-user`, {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        college_name: formData.college_name,
        role: formData.role
      });

      if (res.data.success) {
        setCreatedUser(res.data.user);
        setSuccess('Account created successfully! You can now login with these credentials.');
        setFormData({
          full_name: '', email: '', phone: '', password: '', confirm_password: '',
          college_name: 'FCRIT', role: 'ADMIN'
        });
      }
    } catch (err) {
      if (err.response?.data?.detail) {
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
          <button onClick={() => navigate('/admin/login')} className="text-emerald-600 hover:text-emerald-800 mb-6 flex items-center gap-1 text-sm font-bold tracking-wide uppercase transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Admin Login
          </button>

          <Card className="bg-white border-slate-200 shadow-xl shadow-slate-200/50">
            <CardHeader className="space-y-1 text-center bg-slate-50/50 border-b border-slate-100 pb-6 pt-6">
              <div className="flex justify-center mb-4">
                <div className="bg-emerald-600 p-4 rounded-2xl shadow-md">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-extrabold text-slate-800 tracking-tight">Register New User</CardTitle>
              <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-xs">Firebase Auth + Real-Time Credentials</CardDescription>
            </CardHeader>

            <form onSubmit={handleRegister} className="pt-6">
              <CardContent className="space-y-4">
                {error && <Alert variant="destructive" className="bg-red-50 border-red-200"><AlertDescription className="text-red-600 font-bold">{error}</AlertDescription></Alert>}
                
                {success && createdUser && (
                  <Alert className="bg-emerald-50 border-emerald-200">
                    <AlertDescription className="text-emerald-700 font-bold space-y-3">
                      <div className="flex items-center gap-2 tracking-wide">
                        <CheckCircle className="h-5 w-5"/> {success}
                      </div>
                      <div className="bg-white border border-emerald-100 rounded-lg p-3 space-y-1 mt-2">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Login Credentials</p>
                        <p className="text-sm font-bold text-slate-800">Name: {createdUser.full_name}</p>
                        <p className="text-sm font-medium text-slate-600">Email: <span className="font-bold text-indigo-700">{createdUser.email}</span></p>
                        <p className="text-sm font-medium text-slate-600">Password: <span className="font-bold text-indigo-700">{createdUser.password_hint}</span></p>
                        <p className="text-sm font-medium text-slate-600">College: {createdUser.college_name}</p>
                        <p className="text-sm font-medium text-slate-600">Role: <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">{createdUser.role}</span></p>
                      </div>
                      <p className="text-[10px] text-emerald-600 font-bold mt-1">⚠️ Save these credentials — they won't be shown again</p>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider pl-1"><User className="inline h-3.5 w-3.5 mr-1 text-slate-500" />Full Name</Label>
                  <Input type="text" placeholder="Enter full name" value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required
                    className="bg-white font-medium border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500 py-6" />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider pl-1"><Mail className="inline h-3.5 w-3.5 mr-1 text-slate-500" />Email Address</Label>
                  <Input type="email" placeholder="user@example.com" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })} required
                    className="bg-white font-medium border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500 py-6" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider pl-1"><Phone className="inline h-3.5 w-3.5 mr-1 text-slate-500" />Phone Number</Label>
                    <Input type="tel" placeholder="10-digit number" value={formData.phone}
                      onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setFormData({ ...formData, phone: v }); }}
                      required maxLength={10}
                      className="bg-white font-medium border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500 py-6" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider pl-1"><Building className="inline h-3.5 w-3.5 mr-1 text-slate-500" />College Name</Label>
                    <Input type="text" placeholder="FCRIT" value={formData.college_name}
                      onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                      className="bg-white font-medium border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500 py-6" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider pl-1">Account Role</Label>
                  <select value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none">
                    <option value="USER">Student</option>
                    <option value="CLERK">Scholarship Portal (Clerk)</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider pl-1"><Lock className="inline h-3.5 w-3.5 mr-1 text-slate-500" />Password</Label>
                    <Input type="password" placeholder="Min 6 chars" value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6}
                      className="bg-white font-medium border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500 py-6" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider pl-1"><Lock className="inline h-3.5 w-3.5 mr-1 text-slate-500" />Confirm</Label>
                    <Input type="password" placeholder="Re-enter" value={formData.confirm_password}
                      onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })} required minLength={6}
                      className="bg-white font-medium border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500 py-6" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pb-8">
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-colors py-6 text-sm font-bold tracking-widest uppercase" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Register User'}
                </Button>
                <p className="text-sm text-center text-slate-500 font-medium pt-2">
                  Already have credentials? <Link to="/admin/login" className="text-emerald-600 hover:text-emerald-800 font-bold tracking-wide">Login here</Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AdminRegister;
