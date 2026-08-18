import React, { useState } from 'react';
import { HeartPulse, GraduationCap, Coins, Shield, Check, ExternalLink, ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useApp } from '../context/AppContext';

export interface SchemeData {
  id: string;
  titleKey: string;
  defaultTitle: string;
  descKey: string;
  defaultDesc: string;
  type: 'health' | 'education' | 'pension' | 'accident';
  benefitAmount: string;
  eligibility: string;
}

export const SCHEMES_LIST: SchemeData[] = [
  {
    id: 'scheme-1',
    titleKey: 'healthInsuranceScheme',
    defaultTitle: 'Ayushman Shramik Health Cover',
    descKey: 'healthInsuranceDesc',
    defaultDesc: 'Up to ₹5,00,000 cash-free hospitalization coverage for worker families.',
    type: 'health',
    benefitAmount: '₹5,00,000 Free Cover',
    eligibility: 'All registered construction, carpentry, plumbing, and daily workers',
  },
  {
    id: 'scheme-2',
    titleKey: 'educationSupport',
    defaultTitle: 'Shramik Children Scholarship',
    descKey: 'educationSupportDesc',
    defaultDesc: 'Annual educational assistance up to ₹15,000 for school/college going kids.',
    type: 'education',
    benefitAmount: '₹15,000 / Year',
    eligibility: 'Children of active daily wage workers enrolled in std 1-12 or ITI/diploma',
  },
  {
    id: 'scheme-3',
    titleKey: 'pensionScheme',
    defaultTitle: 'Pradhan Mantri Shram Yogi Maandhan',
    descKey: 'pensionSchemeDesc',
    defaultDesc: 'Guaranteed pension of ₹3,000/month after 60 years of age for unorganized workers.',
    type: 'pension',
    benefitAmount: '₹3,000 / Month Pension',
    eligibility: 'Unorganized workers aged 18-40 years with monthly income under ₹15,000',
  },
  {
    id: 'scheme-4',
    titleKey: 'accidentCover',
    defaultTitle: 'PMAY Accident & Disability Cover',
    descKey: 'accidentCoverDesc',
    defaultDesc: 'Accidental death/permanent disability cover of ₹2,00,000 with nominal premium.',
    type: 'accident',
    benefitAmount: '₹2,00,000 Accident Cover',
    eligibility: 'Age 18-70 with Aadhaar linked bank account',
  },
];

export const WelfareSchemeCard: React.FC<{ scheme: SchemeData; compact?: boolean }> = ({
  scheme,
  compact = false,
}) => {
  const { t } = useLanguage();
  const { showToast } = useApp();
  const [enrolled, setEnrolled] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const getIcon = () => {
    switch (scheme.type) {
      case 'health':
        return <HeartPulse className="w-5 h-5 text-emerald-600" />;
      case 'education':
        return <GraduationCap className="w-5 h-5 text-blue-600" />;
      case 'pension':
        return <Coins className="w-5 h-5 text-amber-600" />;
      default:
        return <Shield className="w-5 h-5 text-purple-600" />;
    }
  };

  const getIconBg = () => {
    switch (scheme.type) {
      case 'health':
        return 'bg-emerald-50 border-emerald-200';
      case 'education':
        return 'bg-blue-50 border-blue-200';
      case 'pension':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-purple-50 border-purple-200';
    }
  };

  const handleEnroll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEnrolled(true);
    showToast(`Eligibility verified for ${t(scheme.titleKey, scheme.defaultTitle)}! Application initiated.`);
  };

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="flex flex-col justify-between p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-2xs hover:shadow-md hover:border-[#15803D]/40 transition-all cursor-pointer group"
      >
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${getIconBg()} shrink-0`}>
              {getIcon()}
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#ECFDF5] text-[#15803D] border border-emerald-200">
              {scheme.benefitAmount}
            </span>
          </div>

          <h4 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-[#15803D] transition-colors leading-snug mb-1.5">
            {t(scheme.titleKey, scheme.defaultTitle)}
          </h4>

          <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-2">
            {t(scheme.descKey, scheme.defaultDesc)}
          </p>
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 mt-auto">
          <span className="text-[11px] font-semibold text-gray-400">Govt. Certified</span>
          <button
            type="button"
            onClick={handleEnroll}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              enrolled
                ? 'bg-emerald-50 text-[#15803D] border border-emerald-200'
                : 'bg-gray-100 hover:bg-[#15803D] hover:text-white text-gray-700'
            }`}
          >
            {enrolled ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Enrolled</span>
              </>
            ) : (
              <>
                <span>Check Eligibility</span>
                <ArrowRight className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${getIconBg()}`}>
                  {getIcon()}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 leading-tight">
                    {t(scheme.titleKey, scheme.defaultTitle)}
                  </h3>
                  <span className="text-xs font-bold text-[#15803D]">{scheme.benefitAmount}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-700 mb-5">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <h5 className="font-bold text-gray-900 mb-1">Description:</h5>
                <p className="leading-relaxed">{t(scheme.descKey, scheme.defaultDesc)}</p>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <h5 className="font-bold text-emerald-900 mb-1">Eligibility Criteria:</h5>
                <p className="text-emerald-800 leading-relaxed">{scheme.eligibility}</p>
              </div>

              <div className="p-3 bg-orange-50/50 rounded-2xl border border-orange-100">
                <h5 className="font-bold text-orange-900 mb-1">Required Documents:</h5>
                <p className="text-orange-800">Aadhaar Card, e-Shram Card / KaamSetu Verified Worker ID, Bank Passbook</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 font-bold text-xs text-gray-700 hover:bg-gray-50"
              >
                {t('cancel', 'Close')}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  handleEnroll(e);
                  setShowModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                Apply with KaamSetu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
