import React from 'react';
import { Landmark, ArrowLeft, ShieldCheck, CheckCircle2, HeartHandshake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { WelfareSchemeCard, SCHEMES_LIST } from '../../components/WelfareSchemeCard';
import { useLanguage } from '../../i18n/LanguageContext';

export const WelfareSchemesPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <DashboardLayout type="worker">
      <div className="space-y-6">
        <div>
          <button
            type="button"
            onClick={() => navigate('/worker-dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-[#15803D]" />
            <span>{t('welfareSchemes', 'Welfare Schemes for Workers')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            {t('welfareSchemesSubtitle', 'Government benefits & safety subsidies for daily workers')}
          </p>
        </div>

        {/* Hero banner for schemes */}
        <div className="bg-gradient-to-r from-[#15803D] to-[#166534] rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-white/20 text-emerald-100">
              Direct Benefit Transfer (DBT) Ready
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold">
              100% Free Government Benefit Enrollment
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
              KaamSetu assists all daily wage workers with registration for PM-SYM Pension, Ayushman Bharat health card, and state welfare board cards at zero service charge.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 bg-white/10 rounded-2xl text-center">
              <span className="block text-2xl font-extrabold">₹5.2L</span>
              <span className="text-[10px] text-emerald-200">Max Family Cover</span>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl text-center">
              <span className="block text-2xl font-extrabold">₹3,000</span>
              <span className="text-[10px] text-emerald-200">Monthly Pension</span>
            </div>
          </div>
        </div>

        {/* Schemes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCHEMES_LIST.map((scheme) => (
            <WelfareSchemeCard key={scheme.id} scheme={scheme} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};
