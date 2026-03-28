import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LANGUAGES } from '@/lib/i18n';
import { GraduationCap, Globe, Check } from 'lucide-react';

function LanguageSelect() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('en');

  const handleContinue = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.language = selected;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('language', selected);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg">
              <Globe className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Select Your Language</h1>
          <p className="text-blue-200">अपनी भाषा चुनें • உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          <div className="grid grid-cols-2 gap-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelected(lang.code)}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200
                  ${selected === lang.code
                    ? 'bg-blue-500/20 border-blue-400 text-white'
                    : 'bg-white/5 border-white/10 text-blue-100 hover:bg-white/10 hover:border-white/20'
                  }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-sm">{lang.nativeName}</div>
                  <div className="text-xs opacity-70">{lang.name}</div>
                </div>
                {selected === lang.code && (
                  <Check className="h-5 w-5 text-blue-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleContinue}
            className="w-full mt-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold
                       hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/25"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}

export default LanguageSelect;
