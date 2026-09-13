import React, { useState } from 'react';
import { Settings, Globe, Bell, CreditCard, Shield, LogOut, ArrowLeft, Repeat, Check, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Language } from '../../i18n/translations';

interface SettingsPageProps {
  type?: 'worker' | 'employer';
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ type = 'worker' }) => {
  const { userRole, setUserRole, showToast } = useApp();
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState({
    sms: true,
    whatsapp: true,
    instantJobs: true,
  });

  const [upiId, setUpiId] = useState('9876543210@paytm');
  const [bankAccount, setBankAccount] = useState('SBIN0001234 - 38291029381');

  const handleRoleToggle = () => {
    if (userRole === 'worker') {
      setUserRole('employer');
      showToast('Switched to Employer Mode');
      navigate('/employer-dashboard');
    } else {
      setUserRole('worker');
      showToast('Switched to Worker Mode');
      navigate('/worker-dashboard');
    }
  };

  const handleSavePayouts = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Direct Payout details updated successfully!');
  };

  return (
    <DashboardLayout type={userRole}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <button
            type="button"
            onClick={() => navigate(userRole === 'worker' ? '/worker-dashboard' : '/employer-dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-gray-700" />
            <span>{t('settings', 'Account Settings & Preferences')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Manage your language, daily wage payout accounts, and alerts
          </p>
        </div>

        {/* 1. Switch Role Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#15803D] flex items-center justify-center">
              <Repeat className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                Switch Role ({userRole === 'worker' ? 'Worker ➔ Employer' : 'Employer ➔ Worker'})
              </h3>
              <p className="text-xs text-gray-500">
                Currently logged in as <strong className="capitalize text-[#15803D]">{userRole}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRoleToggle}
            className="px-5 py-2.5 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-2"
          >
            <Repeat className="w-4 h-4" />
            <span>Switch to {userRole === 'worker' ? 'Employer' : 'Worker'}</span>
          </button>
        </div>

        {/* 2. App Language Selector */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">App Language / भाषा</h3>
              <p className="text-xs text-gray-500">Change interface language across the application</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  showToast(`Language set to ${lang.name}`);
                }}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${
                  language === lang.code
                    ? 'border-[#15803D] bg-[#ECFDF5] text-[#15803D] font-bold shadow-2xs'
                    : 'border-gray-200 bg-gray-50/50 hover:bg-white text-gray-700'
                }`}
              >
                <div className="text-sm font-extrabold">{lang.nativeName}</div>
                <div className="text-[11px] text-gray-400 font-normal">{lang.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Daily Wage Payout Account (Worker only) */}
        {userRole === 'worker' && (
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Direct Daily Payout Account</h3>
                <p className="text-xs text-gray-500">Wages are deposited directly by 7 PM every evening</p>
              </div>
            </div>

            <form onSubmit={handleSavePayouts} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  UPI ID (GPay / PhonePe / Paytm)
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:border-[#15803D] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Bank Account / IFSC
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:border-[#15803D] outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#15803D] text-white text-xs font-bold shadow-xs hover:bg-[#166534] transition-colors"
              >
                Save Payout Account
              </button>
            </form>
          </div>
        )}

        {/* 4. Logout / Session */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Sign Out</h3>
            <p className="text-xs text-gray-400">Return to KaamSetu Welcome Screen</p>
          </div>

          <button
            type="button"
            onClick={() => {
              showToast('Logged out of KaamSetu');
              navigate('/welcome');
            }}
            className="px-4 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout', 'Log Out')}</span>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};
