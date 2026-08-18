import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { Language } from '../i18n/translations';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full' | 'dropdown';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  className = '',
}) => {
  const { language, setLanguage, currentLanguageInfo, availableLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'full') {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${className}`}>
        {availableLanguages.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-[#15803D] bg-[#ECFDF5] text-[#15803D] shadow-sm font-semibold'
                  : 'border-gray-200 bg-white hover:border-[#15803D]/40 text-gray-700'
              }`}
            >
              <div>
                <p className="text-base font-bold leading-none mb-1">{lang.nativeName}</p>
                <p className="text-xs text-gray-500">{lang.name}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                  isSelected ? 'border-[#15803D] bg-[#15803D] text-white' : 'border-gray-300 bg-white'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700 bg-white border border-gray-200 shadow-xs hover:bg-gray-50 hover:border-gray-300 focus:outline-none transition-all"
        aria-label="Change language"
      >
        <Globe className="w-3.5 h-3.5 text-[#15803D]" />
        <span>{currentLanguageInfo.nativeName}</span>
        <span className="text-[10px] text-gray-400 font-normal">({currentLanguageInfo.code.toUpperCase()})</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in-50 duration-150 border border-gray-100">
          <div className="px-2 py-1.5 mb-1 text-[11px] font-semibold tracking-wider uppercase text-gray-400 border-b border-gray-100">
            Select Language / भाषा
          </div>
          <div className="space-y-1">
            {availableLanguages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors ${
                    isSelected
                      ? 'bg-[#ECFDF5] text-[#15803D] font-bold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{lang.nativeName}</span>
                    <span className="text-[11px] text-gray-400">({lang.name})</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
