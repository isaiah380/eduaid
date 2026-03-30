import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, Shield, ArrowRight } from 'lucide-react';
import { t } from '@/lib/i18n';

function RoleSelect() {
  const navigate = useNavigate();
  const lang = localStorage.getItem('language') || 'en';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans relative overflow-hidden">
      {/* Tricolor Accent Header Bar */}
      <div className="absolute top-0 left-0 right-0 h-2 w-full flex z-50">
        <div className="flex-1 bg-orange-500"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-green-600"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-full shadow-lg">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight mb-3">EduAid</h1>
          <p className="text-slate-600 font-medium mb-1 uppercase tracking-widest text-sm">{t('your_education_portal', lang)}</p>
          <div className="h-1 w-16 bg-blue-500 mx-auto rounded-full mb-4 mt-4"></div>
          <p className="text-slate-500 text-lg">{t('select_role_continue', lang)}</p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Student Card */}
          <button
            onClick={() => navigate('/login')}
            className="group bg-white border border-slate-200 rounded-2xl p-8 text-left
                       hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1
                       transition-all duration-300 cursor-pointer w-full relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="bg-blue-50 p-4 rounded-2xl w-fit mb-6 text-blue-600">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">{t('student', lang)}</h3>
            <p className="text-slate-500 leading-relaxed mb-6 font-medium">
              Browse available scholarships, apply securely, and track your application status.
            </p>
            <div className="flex items-center text-blue-600 font-bold group-hover:text-blue-700">
              {t('continue_student', lang)}
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Admin Card */}
          <button
            onClick={() => navigate('/admin/login')}
            className="group bg-white border border-slate-200 rounded-2xl p-8 text-left
                       hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1
                       transition-all duration-300 cursor-pointer w-full relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="bg-emerald-50 p-4 rounded-2xl w-fit mb-6 text-emerald-600">
              <Shield className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">{t('admin', lang)}</h3>
            <p className="text-slate-500 leading-relaxed mb-6 font-medium">
              Manage scholarship listings, review student applications, and track college metrics.
            </p>
            <div className="flex items-center text-emerald-600 font-bold group-hover:text-emerald-700">
              {t('continue_admin', lang)}
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
        
        <div className="mt-12 text-center">
            <p className="text-xs text-slate-400 font-semibold tracking-wide">
                A Government of India Initiative Simulator • Secure & Verified
            </p>
        </div>
      </div>
    </div>
  );
}

export default RoleSelect;
