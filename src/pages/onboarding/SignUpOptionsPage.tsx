import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { KaamSetuLogo } from '../../components/KaamSetuLogo';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useLanguage } from '../../i18n/LanguageContext';

export const SignUpOptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedMethod, setSelectedMethod] = useState<'mobile' | 'email'>('email');

  const handleContinue = () => {
    navigate('/create-account', { state: { method: selectedMethod } });
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="flex items-center justify-between max-w-xl w-full mx-auto">
        <KaamSetuLogo size="sm" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="dropdown" />
          <button
            type="button"
            onClick={() => navigate('/language')}
            className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back', 'Back')}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl w-full mx-auto my-auto py-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {t('chooseHowToContinue', 'Choose how you want to continue')}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {t('signUpSubtitle', 'Quick access to thousands of daily jobs and reliable workers')}
            </p>
          </div>

          {/* Method Selection Cards */}
          <div className="space-y-4 mb-8">
            {/* Email Option (Default) */}
            <div
              onClick={() => setSelectedMethod('email')}
              className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                selectedMethod === 'email'
                  ? 'border-[#15803D] bg-[#ECFDF5] shadow-xs'
                  : 'border-gray-100 bg-gray-50/70 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    selectedMethod === 'email'
                      ? 'bg-[#15803D] text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                      {t('signUpWithEmail', 'Sign up with Email')}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#15803D]/10 text-[#15803D]">
                      Default
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t('signUpWithEmailDesc', 'Fast signup with verification email')}
                  </p>
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                  selectedMethod === 'email'
                    ? 'border-[#15803D] bg-[#15803D] text-white'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {selectedMethod === 'email' && <CheckCircle2 className="w-4 h-4 fill-white text-[#15803D]" />}
              </div>
            </div>

            {/* Mobile Option */}
            <div
              onClick={() => setSelectedMethod('mobile')}
              className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                selectedMethod === 'mobile'
                  ? 'border-[#15803D] bg-[#ECFDF5] shadow-xs'
                  : 'border-gray-100 bg-gray-50/70 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    selectedMethod === 'mobile'
                      ? 'bg-[#15803D] text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                    {t('signUpWithMobile', 'Sign up with Mobile Number')}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t('signUpWithMobileDesc', 'Instant login with simple OTP verification')}
                  </p>
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                  selectedMethod === 'mobile'
                    ? 'border-[#15803D] bg-[#15803D] text-white'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {selectedMethod === 'mobile' && <CheckCircle2 className="w-4 h-4 fill-white text-[#15803D]" />}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleContinue}
              className="w-full py-4 px-6 rounded-2xl bg-[#15803D] hover:bg-[#166534] active:scale-[0.99] text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t('continue', 'Continue')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Already have an account link */}
            <p className="text-center text-xs text-gray-600 font-medium">
              {t('alreadyHaveAccount', 'Already have an account?')}{' '}
              <button
                type="button"
                onClick={() => navigate('/create-account')}
                className="text-[#15803D] font-bold hover:underline"
              >
                {t('login', 'Login')}
              </button>
            </p>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-2">
        Safe &amp; Secure Authentication • KaamSetu
      </footer>
    </div>
  );
};
