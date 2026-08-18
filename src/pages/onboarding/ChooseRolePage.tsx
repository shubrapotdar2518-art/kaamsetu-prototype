import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Shield, Zap } from 'lucide-react';
import { KaamSetuLogo } from '../../components/KaamSetuLogo';
import { WorkerIllustration, EmployerIllustration } from '../../components/Illustrations';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';

export const ChooseRolePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { setUserRole } = useApp();

  const handleSelectWorker = () => {
    setUserRole('worker');
    navigate('/worker-details');
  };

  const handleSelectEmployer = () => {
    setUserRole('employer');
    navigate('/employer-dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="flex items-center justify-between max-w-4xl w-full mx-auto">
        <KaamSetuLogo size="sm" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="dropdown" />
          <button
            type="button"
            onClick={() => navigate('/basic-details')}
            className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back', 'Back')}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl w-full mx-auto my-auto py-6">
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-[#ECFDF5] text-[#15803D] border border-[#A7F3D0] mb-2">
            Step 4 of 4
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            {t('chooseYourRole', 'Choose Your Role')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {t('chooseRoleSubtitle', 'How would you like to continue?')}
          </p>
        </div>

        {/* Two Large Interactive Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Worker Card */}
          <div
            onClick={handleSelectWorker}
            className="group relative bg-white hover:bg-gradient-to-b hover:from-white hover:to-[#ECFDF5] rounded-3xl p-6 sm:p-8 border-2 border-gray-200/90 hover:border-[#15803D] shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              {/* Illustration */}
              <div className="w-full flex justify-center mb-4">
                <WorkerIllustration className="w-36 h-36 sm:w-44 sm:h-44 group-hover:scale-105 transition-transform duration-300" />
              </div>

              {/* Title & Tagline */}
              <div className="text-center mb-4">
                <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#166534] mb-2">
                  For Labor & Trades
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 group-hover:text-[#15803D] transition-colors">
                  {t('worker', 'WORKER')}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
                  {t('workerTagline', 'Find daily wage jobs & work opportunities')}
                </p>
              </div>

              {/* Benefits checklist */}
              <div className="space-y-2 mb-6 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                  <span>{t('workerBenefit1', 'Instant job alerts in your local area')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                  <span>{t('workerBenefit2', 'Direct wage deposit & government welfare access')}</span>
                </div>
              </div>
            </div>

            {/* Action button */}
            <button
              type="button"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#15803D] group-hover:bg-[#166534] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Continue as Worker</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Employer Card */}
          <div
            onClick={handleSelectEmployer}
            className="group relative bg-white hover:bg-gradient-to-b hover:from-white hover:to-[#FFF7ED] rounded-3xl p-6 sm:p-8 border-2 border-gray-200/90 hover:border-[#F97316] shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              {/* Illustration */}
              <div className="w-full flex justify-center mb-4">
                <EmployerIllustration className="w-36 h-36 sm:w-44 sm:h-44 group-hover:scale-105 transition-transform duration-300" />
              </div>

              {/* Title & Tagline */}
              <div className="text-center mb-4">
                <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#FFEDD5] text-[#9A3412] mb-2">
                  For Businesses & Individuals
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 group-hover:text-[#F97316] transition-colors">
                  {t('employer', 'EMPLOYER')}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
                  {t('employerTagline', 'Post jobs & hire skilled workers')}
                </p>
              </div>

              {/* Benefits checklist */}
              <div className="space-y-2 mb-6 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#F97316] shrink-0" />
                  <span>{t('employerBenefit1', 'Verified skilled & unskilled workers nearby')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#F97316] shrink-0" />
                  <span>{t('employerBenefit2', 'Post emergency job requirements in 60 seconds')}</span>
                </div>
              </div>
            </div>

            {/* Action button */}
            <button
              type="button"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#F97316] group-hover:bg-[#EA580C] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Continue as Employer</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-2">
        You can easily toggle between Worker and Employer modes at any time
      </footer>
    </div>
  );
};
