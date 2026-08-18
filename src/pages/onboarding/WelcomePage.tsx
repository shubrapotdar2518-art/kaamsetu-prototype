import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Users } from 'lucide-react';
import { KaamSetuLogo } from '../../components/KaamSetuLogo';
import { WelcomeBannerIllustration } from '../../components/Illustrations';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useLanguage } from '../../i18n/LanguageContext';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-4xl w-full mx-auto">
        <KaamSetuLogo size="md" />
        <LanguageSwitcher variant="dropdown" />
      </header>

      {/* Main Container */}
      <main className="max-w-xl w-full mx-auto my-auto py-8 text-center flex flex-col items-center">
        {/* Banner Illustration */}
        <div className="w-full mb-8 flex justify-center">
          <WelcomeBannerIllustration className="w-full max-w-sm sm:max-w-md h-52 sm:h-60" />
        </div>

        {/* Tagline & Headings */}
        <div className="space-y-3 mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#ECFDF5] text-[#15803D] border border-[#A7F3D0]">
            ⚡ Bharat's Direct Wage Platform
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            {t('tagline', 'Connecting Hands, Building Futures')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto leading-relaxed">
            {t('heroDescription', 'KaamSetu connects daily-wage workers with verified local employers and helps you find instant jobs with guaranteed daily wage payouts.')}
          </p>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-md mb-8">
          <div className="p-3 rounded-2xl bg-white border border-gray-100 shadow-2xs text-center">
            <ShieldCheck className="w-5 h-5 mx-auto text-[#15803D] mb-1" />
            <p className="text-[11px] font-bold text-gray-800">Verified Work</p>
            <p className="text-[9px] text-gray-400">100% Safe Jobs</p>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-gray-100 shadow-2xs text-center">
            <Zap className="w-5 h-5 mx-auto text-[#F97316] mb-1" />
            <p className="text-[11px] font-bold text-gray-800">Fast Payouts</p>
            <p className="text-[9px] text-gray-400">Daily by 7 PM</p>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-gray-100 shadow-2xs text-center">
            <Users className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-[11px] font-bold text-gray-800">Welfare Cover</p>
            <p className="text-[9px] text-gray-400">Govt. Schemes</p>
          </div>
        </div>

        {/* Get Started Button */}
        <button
          type="button"
          onClick={() => navigate('/language')}
          className="w-full max-w-sm py-4 px-8 rounded-2xl bg-[#15803D] hover:bg-[#166534] active:scale-[0.99] text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer group"
        >
          <span>{t('getStarted', 'Get Started')}</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-2">
        KaamSetu &copy; 2026 • Dedicated to the dignity and prosperity of every skilled worker
      </footer>
    </div>
  );
};
