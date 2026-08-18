import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Search, User, Repeat } from 'lucide-react';
import { KaamSetuLogo } from './KaamSetuLogo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../i18n/LanguageContext';

interface NavbarProps {
  showSidebarToggle?: boolean;
  type?: 'worker' | 'employer' | 'onboarding';
}

export const Navbar: React.FC<NavbarProps> = ({ type = 'worker' }) => {
  const { userProfile, userRole, setUserRole } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleRoleToggle = () => {
    if (userRole === 'worker') {
      setUserRole('employer');
      navigate('/employer-dashboard');
    } else {
      setUserRole('worker');
      navigate('/worker-dashboard');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Logo (for mobile or onboarding) */}
        <div className="flex items-center gap-3">
          <div className="lg:hidden">
            <KaamSetuLogo size="sm" />
          </div>
          {type !== 'onboarding' && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs text-gray-400 w-48 md:w-64">
              <Search className="w-3.5 h-3.5" />
              <input
                type="text"
                placeholder={t('searchPlaceholder', 'Search jobs, skills...')}
                className="bg-transparent text-gray-700 outline-none w-full text-xs placeholder:text-gray-400"
              />
            </div>
          )}
        </div>

        {/* Right Action Icons & Language Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role Switch in Mobile Navbar */}
          {type !== 'onboarding' && (
            <button
              type="button"
              onClick={handleRoleToggle}
              className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#15803D] border border-emerald-200"
              title="Switch between Worker and Employer"
            >
              <Repeat className="w-3 h-3" />
              <span className="text-[11px] capitalize">{userRole}</span>
            </button>
          )}

          {/* Language Selector Dropdown */}
          <LanguageSwitcher variant="dropdown" />

          {type !== 'onboarding' && (
            <>
              {/* Notification Bell */}
              <button
                type="button"
                onClick={() => navigate(userRole === 'worker' ? '/messages' : '/employer-messages')}
                className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F97316]" />
              </button>

              {/* Profile Avatar Icon */}
              <Link
                to={userRole === 'worker' ? '/worker-profile' : '/employer-profile'}
                className="flex items-center gap-2 pl-1 group"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-300 bg-emerald-100 flex items-center justify-center text-emerald-800 text-xs font-bold">
                  {userProfile.avatar ? (
                    <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
