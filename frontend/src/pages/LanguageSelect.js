import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowRight } from 'lucide-react';
import { t } from '@/lib/i18n';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' }
];

function LanguageSelect() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(localStorage.getItem('language') || 'en');

  const handleContinue = () => {
    localStorage.setItem('language', selected);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans relative overflow-hidden">
      {/* Tricolor Accent Header Bar */}
      <div className="absolute top-0 left-0 right-0 h-2 w-full flex z-50">
        <div className="flex-1 bg-orange-500"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-green-600"></div>
      </div>

      <div className="relative z-10 w-full max-w-xl py-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-600 p-4 rounded-full shadow-md">
                <Globe className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Select Language</h1>
            <p className="text-slate-500 font-medium tracking-wide uppercase text-sm">Choose your preferred language</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelected(lang.code)}
                className={`p-4 rounded-2xl border-2 text-center transition-all duration-200 ${
                  selected === lang.code
                    ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-500/10'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <div className={`text-xl font-bold mb-1 ${selected === lang.code ? 'text-blue-700' : 'text-slate-800'}`}>
                  {lang.native}
                </div>
                <div className={`text-sm font-medium ${selected === lang.code ? 'text-blue-600' : 'text-slate-500'}`}>
                  {lang.name}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-md group tracking-widest uppercase"
          >
            {t('continue', selected)} 
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 font-bold tracking-wide uppercase">
                A Government of India Initiative Simulator
            </p>
        </div>
      </div>
    </div>
  );
}

export default LanguageSelect;
