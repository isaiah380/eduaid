import { useState, useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RoleSelect from './pages/RoleSelect';
import Login from './pages/Login';
import Register from './pages/Register';
import LanguageSelect from './pages/LanguageSelect';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Scholarships from './pages/Scholarships';
import Benefits from './pages/Benefits';
import Profile from './pages/Profile';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Chatbot from './components/Chatbot';

// Protected Route Component
const ProtectedRoute = ({ user, children }) => {
  return user ? children : <Navigate to="/" replace />;
};

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('token');
    localStorage.removeItem('language');
  };

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
