import React, { useState } from 'react';
import { MapPin, Clock, ShieldCheck, Sparkles, Check, Briefcase } from 'lucide-react';
import { JobItem, useApp } from '../context/AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import confetti from 'canvas-confetti';

interface JobCardProps {
  job: JobItem;
  compact?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({ job, compact = false }) => {
  const { applyToJob } = useApp();
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);

  const translatedTitle = t(job.titleKey, job.defaultTitle);
  const isApplied = !!job.applied;

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isApplied) {
      applyToJob(job.id);
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#15803D', '#F97316', '#86EFAC'],
        });
      } catch {
        // ignore
      }
    }
  };

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="group relative flex flex-col justify-between p-4 sm:p-5 bg-white rounded-2xl border border-gray-100/80 shadow-xs hover:shadow-md hover:border-[#15803D]/40 transition-all cursor-pointer"
      >
        {/* Top Badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {job.matchPercentage && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#15803D] border border-[#A7F3D0]">
                <Sparkles className="w-3 h-3 text-[#15803D]" />
                {job.matchPercentage}% {t('matchBadge', 'Match')}
              </span>
            )}
            {job.badge === 'New' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {t('newBadge', 'New')}
              </span>
            )}
            {job.badge === 'Urgent' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 animate-pulse">
                ⚡ {t('urgentBadge', 'Urgent')}
              </span>
            )}
          </div>

          <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3" />
            {job.postedTime}
          </span>
        </div>

        {/* Job Title & Employer */}
        <div className="mb-3">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#15803D] transition-colors leading-snug">
            {translatedTitle}
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-gray-400" />
            {job.employerName}
          </p>
        </div>

        {!compact && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
            {job.description}
          </p>
        )}

        {/* Location and Wage Row */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 mt-auto">
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
              <span className="truncate max-w-[150px] sm:max-w-[180px]">{job.location}</span>
            </div>
            <p className="text-[10px] text-gray-400 ml-4 font-normal">{job.distance}</p>
          </div>

          <div className="text-right shrink-0">
            <div className="flex items-baseline justify-end gap-0.5">
              <span className="text-lg sm:text-xl font-extrabold text-[#15803D]">
                ₹{job.wage}
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                {t('dayWageUnit', '/day')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-3">
          <button
            type="button"
            onClick={handleApply}
            disabled={isApplied}
            className={`w-full py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              isApplied
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200'
                : 'bg-[#15803D] hover:bg-[#166534] active:scale-[0.98] text-white shadow-xs hover:shadow'
            }`}
          >
            {isApplied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                {t('applied', 'Applied')}
              </>
            ) : (
              t('apply', 'Apply Now')
            )}
          </button>
        </div>
      </div>

      {/* Details Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#15803D] mb-1.5">
                  {job.category}
                </span>
                <h2 className="text-xl font-extrabold text-gray-900">{translatedTitle}</h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Posted by {job.employerName}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Match info */}
            {job.matchPercentage && (
              <div className="flex items-center gap-2 p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl mb-4 text-xs font-medium text-[#15803D]">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  <strong>{job.matchPercentage}% Profile Match:</strong> Based on your registered skill and location.
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 font-medium block mb-0.5">{t('dailyWageExpectation', 'Daily Pay')}</span>
                <span className="text-base font-extrabold text-[#15803D]">₹{job.wage} {t('perDay', 'per day')}</span>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 font-medium block mb-0.5">{t('jobLocation', 'Location')}</span>
                <span className="text-xs font-bold text-gray-800 line-clamp-1">{job.location}</span>
                <span className="text-[10px] text-gray-400">{job.distance}</span>
              </div>
            </div>

            <div className="mb-5 space-y-2 text-xs text-gray-700">
              <h4 className="font-bold text-gray-900 text-sm">{t('jobDetails', 'Job Description')}</h4>
              <p className="leading-relaxed bg-gray-50/70 p-3 rounded-2xl border border-gray-100">{job.description}</p>
              <div className="flex items-center gap-2 text-gray-500 pt-1">
                <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                <span>Guaranteed Payment Protection by KaamSetu Escrow</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('cancel', 'Close')}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  handleApply(e);
                  setShowModal(false);
                }}
                disabled={isApplied}
                className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  isApplied
                    ? 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed'
                    : 'bg-[#15803D] hover:bg-[#166534] text-white shadow-md'
                }`}
              >
                {isApplied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    {t('applied', 'Applied')}
                  </>
                ) : (
                  t('apply', 'Apply Now')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
