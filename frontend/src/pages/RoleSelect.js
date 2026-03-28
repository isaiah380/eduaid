import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, Shield } from 'lucide-react';

function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
      {/* Decorative bg elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-blue-500/25">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">EduAid</h1>
          <p className="text-blue-300 text-sm mb-1">Your Education Aid Portal</p>
          <p className="text-blue-200 text-lg">Select your role to continue</p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Card */}
          <button
            onClick={() => navigate('/login')}
            className="group bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-left
                       hover:bg-white/20 hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10
                       transition-all duration-300 cursor-pointer"
          >
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-3 rounded-xl w-fit mb-5
                            group-hover:scale-110 transition-transform duration-300">
              <Users className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Student</h3>
            <p className="text-blue-200 text-sm leading-relaxed">
              Browse scholarships, apply for opportunities, upload documents, and track your applications.
            </p>
            <div className="mt-5 flex items-center text-blue-400 text-sm font-medium group-hover:text-blue-300">
              Continue as Student
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Admin Card */}
          <button
            onClick={() => navigate('/admin/login')}
            className="group bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-left
                       hover:bg-white/20 hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/10
                       transition-all duration-300 cursor-pointer"
          >
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl w-fit mb-5
                            group-hover:scale-110 transition-transform duration-300">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Admin (College)</h3>
            <p className="text-blue-200 text-sm leading-relaxed">
              Manage scholarships, track student applications by college, and administer benefits.
            </p>
            <div className="mt-5 flex items-center text-indigo-400 text-sm font-medium group-hover:text-indigo-300">
              Continue as Admin
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoleSelect;
