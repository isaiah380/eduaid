import { useState, useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import axios from 'axios';
import RoleSelect from './pages/RoleSelect';
import Login from './pages/Login';
import Register from './pages/Register';
import LanguageSelect from './pages/LanguageSelect';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Scholarships from './pages/Scholarships';
import ApplyScholarship from './pages/ApplyScholarship';
import Benefits from './pages/Benefits';
import Profile from './pages/Profile';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Chatbot from './components/Chatbot';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const API = `${BACKEND_URL}/api`;

// Protected Route Component
const ProtectedRoute = ({ user, children }) => {
  return user ? children : <Navigate to="/" replace />;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get Firebase ID token
          const idToken = await firebaseUser.getIdToken();

          // Fetch user profile from backend
          const response = await axios.get(`${API}/auth/profile`, {
            headers: { Authorization: `Bearer ${idToken}` }
          });

          if (response.data.success) {
            const userData = response.data.user;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', idToken);
            localStorage.setItem('role', userData.role);
          }
        } catch (err) {
          // User exists in Firebase but not in SQLite (needs to register profile)
          console.log('Firebase user found, no profile yet — may need to register');
          // Check if there's a saved user from localStorage (for registration flow)
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            try {
              setUser(JSON.parse(savedUser));
            } catch (e) {
              localStorage.removeItem('user');
            }
          }
        }
      } else {
        // User signed out
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('language');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Sign out error:', e);
    }
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('token');
    localStorage.removeItem('language');
  };

  // Show loading while checking Firebase auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App min-h-screen">
      <BrowserRouter>
        <Routes>
          {/* Public Routes — redirect to dashboard if already logged in */}
          <Route path="/" element={
            user ? (user.role === 'ADMIN' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/dashboard" replace />) : <RoleSelect />
          } />
          <Route path="/login" element={
            user ? (user.role === 'ADMIN' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/dashboard" replace />) : <Login onLogin={handleLogin} />
          } />
          <Route path="/register" element={
            user ? <Navigate to="/dashboard" replace /> : <Register onLogin={handleLogin} />
          } />
          <Route path="/admin/login" element={
            user ? (user.role === 'ADMIN' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/" replace />) : <AdminLogin onLogin={handleLogin} />
          } />

          {/* Post-Login Language Selection */}
          <Route path="/select-language" element={
            <ProtectedRoute user={user}><LanguageSelect /></ProtectedRoute>
          } />

          {/* Student Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute user={user}><Dashboard user={user} onLogout={handleLogout} /></ProtectedRoute>
          } />
          <Route path="/documents" element={
            <ProtectedRoute user={user}><Documents user={user} onLogout={handleLogout} /></ProtectedRoute>
          } />
          <Route path="/scholarships" element={
            <ProtectedRoute user={user}><Scholarships user={user} onLogout={handleLogout} /></ProtectedRoute>
          } />
          <Route path="/apply/:scholarshipId" element={
            <ProtectedRoute user={user}><ApplyScholarship user={user} onLogout={handleLogout} /></ProtectedRoute>
          } />
          <Route path="/benefits" element={
            <ProtectedRoute user={user}><Benefits user={user} onLogout={handleLogout} /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute user={user}><Profile user={user} onLogout={handleLogout} /></ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute user={user}><AdminDashboard user={user} onLogout={handleLogout} /></ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Chatbot />
    </div>
  );
}

export default App;
