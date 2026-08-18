import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Globe, CheckCircle2 } from 'lucide-react';
import { KaamSetuLogo } from '../../components/KaamSetuLogo';
import { useLanguage } from '../../i18n/LanguageContext';
import { Language } from '../../i18n/translations';

export const LanguagePage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t, availableLanguages } = useLanguage();

  const handleSelectLanguage = (code: Language) => {
    setLanguage(code);
  };

  const handleContinue = () => {
    navigate('/signup-options');
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="flex items-center justify-between max-w-xl w-full mx-auto">
        <KaamSetuLogo size="sm" />
        <button
          type="button"
          onClick={() => navigate('/welcome')}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('back', 'Back')}</span>
        </button>
      </header>

      {/* Content Container */}
      <main className="max-w-xl w-full mx-auto my-auto py-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          {/* Header icon and titles */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#15803D] flex items-center justify-center mx-auto mb-3 border border-[#A7F3D0]">
              <Globe className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {t('chooseLanguage', 'Choose Language')}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {t('selectPreferredLanguage', 'Select your preferred language / अपनी पसंदीदा भाषा चुनें')}
            </p>
          </div>

          {/* Language Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {availableLanguages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`group relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-[#15803D] bg-[#ECFDF5] text-[#15803D] shadow-xs'
                      : 'border-gray-100 bg-gray-50/60 hover:border-gray-300 hover:bg-white text-gray-700'
                  }`}
                >
                  <div>
                    <span className="text-xs font-semibold text-gray-400 block mb-0.5">
                      {lang.greeting}
                    </span>
                    <h3 className="text-lg font-bold leading-tight">
                      {lang.nativeName}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">{lang.name}</p>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                      isSelected
                        ? 'border-[#15803D] bg-[#15803D] text-white scale-105'
                        : 'border-gray-300 bg-white group-hover:border-gray-400'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-4 h-4 fill-white text-[#15803D]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/welcome')}
              className="py-3.5 px-6 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-sm transition-colors order-2 sm:order-1 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('back', 'Back')}</span>
            </button>

            <button
              type="button"
              onClick={handleContinue}
              className="flex-1 py-3.5 px-6 rounded-xl bg-[#15803D] hover:bg-[#166534] active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all order-1 sm:order-2 flex items-center justify-center gap-2"
            >
              <span>{t('continue', 'Continue')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-2">
        KaamSetu multilingual platform supports 6 official Indian languages
      </footer>
    </div>
  );
};
