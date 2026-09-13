import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Bot,
  Landmark,
  User,
  PlusCircle,
  Zap,
  MessageSquare,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface MobileBottomNavProps {
  type: 'worker' | 'employer';
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ type }) => {
  const { t } = useLanguage();
  const location = useLocation();

  const workerItems = [
    { to: '/worker-dashboard', label: t('overview', 'Home'), icon: LayoutDashboard, exact: true },
    { to: '/recommended-jobs', label: t('recommendedJobs', 'Jobs'), icon: Sparkles },
    { to: '/chat', label: t('chatAssistant', 'Chat'), icon: Bot },
    { to: '/welfare-schemes', label: t('welfareSchemes', 'Schemes'), icon: Landmark },
    { to: '/worker-profile', label: t('workerProfile', 'Profile'), icon: User },
  ];

  const employerItems = [
    { to: '/employer-dashboard', label: t('overview', 'Home'), icon: LayoutDashboard, exact: true },
    { to: '/post-job', label: t('postAJob', 'Post Job'), icon: PlusCircle },
    { to: '/emergency-hiring', label: t('emergencyHiring', 'Emergency'), icon: Zap },
    { to: '/employer-messages', label: t('messages', 'Messages'), icon: MessageSquare },
    { to: '/employer-profile', label: t('employerProfile', 'Profile'), icon: User },
  ];

  const items = type === 'worker' ? workerItems : employerItems;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-2 py-2 safe-area-pb">
      <nav className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-[#15803D] font-bold scale-105'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <div className={`p-1 rounded-xl ${isActive ? 'bg-[#ECFDF5]' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
