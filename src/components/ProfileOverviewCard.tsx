import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Award, CheckCircle, ChevronRight, Building2, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../i18n/LanguageContext';

interface ProfileOverviewCardProps {
  type: 'worker' | 'employer';
}

export const ProfileOverviewCard: React.FC<ProfileOverviewCardProps> = ({ type }) => {
  const { userProfile } = useApp();
  const { t } = useLanguage();

  if (type === 'employer') {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-white to-[#FFF7ED] rounded-3xl p-5 sm:p-6 border border-orange-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* User Avatar */}
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F97316] to-[#C2410C] flex items-center justify-center text-white shadow-md shrink-0">
              <User className="w-8 h-8" />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#15803D] rounded-full border-2 border-white flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
                  {userProfile.name || userProfile.companyName || 'Employer Profile'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">
                  {t('verified', 'Verified')}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 font-medium">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {[userProfile.landmark, userProfile.city].filter(Boolean).join(', ') || userProfile.address || 'Location not added'}
                </span>
                <span>•</span>
                <span className="text-emerald-700 font-bold">Verified Account</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:self-center">
            <Link
              to="/employer-profile"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-orange-200 text-xs sm:text-sm font-bold text-gray-800 hover:bg-orange-50 hover:text-orange-900 transition-all shadow-2xs"
            >
              {t('viewProfile', 'View Profile')}
              <ChevronRight className="w-4 h-4 text-orange-500" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white to-[#ECFDF5] rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Worker Avatar */}
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border-2 border-[#15803D]/20 shadow-sm shrink-0 flex items-center justify-center">
            {userProfile.avatar ? (
              <img
                src={userProfile.avatar}
                alt={userProfile.name || 'Worker'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                <User className="w-8 h-8" />
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#15803D] rounded-full border-2 border-white flex items-center justify-center shadow-xs">
              <CheckCircle className="w-3 h-3 text-white" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
                {userProfile.name || 'Worker Profile'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#166534]">
                ✓ {t('verified', 'Verified Worker')}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#15803D]">
                <Award className="w-3.5 h-3.5" />
                {userProfile.skills || 'Skills Not Added'}
              </span>
              {userProfile.experience && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-gray-600 font-semibold">
                    {userProfile.experience} {t('experiencePlaceholder', 'Years Experience')}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
              <span>{userProfile.city || userProfile.address || 'Location not added'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:self-center">
          <Link
            to="/worker-profile"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-emerald-200 text-xs sm:text-sm font-bold text-gray-800 hover:bg-emerald-50 hover:text-[#15803D] transition-all shadow-2xs"
          >
            {t('viewProfile', 'View Profile')}
            <ChevronRight className="w-4 h-4 text-[#15803D]" />
          </Link>
        </div>
      </div>
    </div>
  );
};
