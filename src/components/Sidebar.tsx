import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Briefcase,
  Bot,
  Landmark,
  MessageSquare,
  User,
  Settings,
  LogOut,
  PlusCircle,
  Zap,
  Repeat,
} from 'lucide-react';
import { KaamSetuLogo } from './KaamSetuLogo';
import { useLanguage } from '../i18n/LanguageContext';
import { useApp } from '../context/AppContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: string;
  highlight?: boolean;
}

interface SidebarProps {
  type: 'worker' | 'employer';
}

export const Sidebar: React.FC<SidebarProps> = ({ type }) => {
  const { t } = useLanguage();
  const { setUserRole } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    navigate('/welcome');
  };

  const handleSwitchRole = () => {
    if (type === 'worker') {
      setUserRole('employer');
      navigate('/employer-dashboard');
    } else {
      setUserRole('worker');
      navigate('/worker-dashboard');
    }
  };

  const workerNavItems: NavItem[] = [
    { to: '/worker-dashboard', label: t('overview', 'Overview'), icon: LayoutDashboard, exact: true },
    { to: '/recommended-jobs', label: t('recommendedJobs', 'Recommended Jobs'), icon: Sparkles, badge: '3' },
    { to: '/available-jobs', label: t('availableJobs', 'Available Jobs'), icon: Briefcase },
    { to: '/chat', label: t('chatAssistant', 'Chat Assistant'), icon: Bot },
    { to: '/welfare-schemes', label: t('welfareSchemes', 'Welfare Schemes'), icon: Landmark },
    { to: '/messages', label: t('messages', 'Messages'), icon: MessageSquare, badge: '2' },
    { to: '/worker-profile', label: t('workerProfile', 'Profile'), icon: User },
    { to: '/settings', label: t('settings', 'Settings'), icon: Settings },
  ];

  const employerNavItems: NavItem[] = [
    { to: '/employer-dashboard', label: t('overview', 'Overview'), icon: LayoutDashboard, exact: true },
    { to: '/post-job', label: t('postAJob', 'Post a Job'), icon: PlusCircle },
    { to: '/emergency-hiring', label: t('emergencyHiring', 'Emergency Hiring'), icon: Zap, highlight: true },
    { to: '/employer-messages', label: t('messages', 'Messages'), icon: MessageSquare, badge: '4' },
    { to: '/employer-profile', label: t('employerProfile', 'Profile'), icon: User },
    { to: '/employer-settings', label: t('settings', 'Settings'), icon: Settings },
  ];

  const navItems = type === 'worker' ? workerNavItems : employerNavItems;

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col bg-white border-r border-gray-100 min-h-screen py-6 px-4 justify-between sticky top-0 h-screen overflow-y-auto">
      <div>
        {/* Brand Logo */}
        <div className="px-3 mb-8">
          <KaamSetuLogo size="md" showTagline />
        </div>

        {/* Role Switcher Pill */}
        <div className="mb-6 px-1">
          <button
            type="button"
            onClick={handleSwitchRole}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-gray-50 hover:bg-emerald-50 border border-gray-200/80 text-xs font-bold text-gray-700 hover:text-[#15803D] transition-all group"
          >
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${type === 'worker' ? 'bg-[#15803D]' : 'bg-[#F97316]'}`} />
              <span>{type === 'worker' ? 'Worker Mode' : 'Employer Mode'}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-400 group-hover:text-[#15803D]">
              <Repeat className="w-3.5 h-3.5" />
              <span>Switch</span>
            </div>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#15803D] text-white shadow-xs'
                    : item.highlight
                    ? 'text-orange-700 bg-orange-50 hover:bg-orange-100 font-bold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-orange-600' : 'text-gray-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-[#15803D]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout button */}
      <div className="pt-4 border-t border-gray-100 space-y-1">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('logout', 'Logout')}</span>
        </button>
      </div>
    </aside>
  );
};
