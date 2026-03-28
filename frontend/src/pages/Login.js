import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, Phone, Lock, ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const API = `${BACKEND_URL}/api`;

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) return 'Phone number must be exactly 10 digits';
    if (!['6', '7', '8', '9'].includes(cleaned[0])) return 'Invalid Indian mobile number';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const phoneError = validatePhone(formData.phone);
    if (phoneError) { setError(phoneError); return; }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, {
        ...formData,
        loginType: 'USER'
      });

      if (response.data.success) {
        onLogin(response.data.user);
        localStorage.setItem('role', response.data.user.role);
        localStorage.setItem('token', response.data.token);

        // If language is already set, go to dashboard, otherwise language select
        const lang = localStorage.getItem('language');
        if (lang) {
          navigate('/dashboard');
        } else {
          navigate('/select-language');
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
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
            <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
            <CardDescription className="text-blue-200">
              Login to access scholarship opportunities
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-500/20 border-red-500/50">
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-blue-100">
                  <Phone className="inline h-4 w-4 mr-2" />Phone Number
                </Label>
                <Input id="phone" type="tel" placeholder="Enter 10-digit mobile number"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, phone: value });
                    if (error && value.length === 10) setError('');
                  }}
                  required maxLength={10}
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-300/50"
                />
                {formData.phone.length > 0 && formData.phone.length < 10 && (
                  <p className="text-xs text-yellow-300">{10 - formData.phone.length} more digits required</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-blue-100">
                  <Lock className="inline h-4 w-4 mr-2" />Password
                </Label>
                <Input id="password" type="password" placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-300/50"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
              <p className="text-sm text-center text-blue-200">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-400 hover:text-blue-300 underline">Register here</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default Login;
