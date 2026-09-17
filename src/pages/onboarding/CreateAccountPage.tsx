import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, User, Mail, Phone, ShieldCheck } from 'lucide-react';
import { KaamSetuLogo } from '../../components/KaamSetuLogo';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';

export const CreateAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { userProfile, updateUserProfile, showToast } = useApp();

  const isEmailMode = location.state?.method !== 'mobile';

  const [fullName, setFullName] = useState(userProfile.name || '');
  const [email, setEmail] = useState(userProfile.email || '');
  const [phone, setPhone] = useState(userProfile.phone || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (isEmailMode) {
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }
    } else {
      if (!phone.trim() || phone.trim().length < 10) {
        setError('Please enter a valid 10-digit mobile number');
        return;
      }
    }
    if (!password.trim() || password.length < 4) {
      setError('Please enter a password with at least 4 characters');
      return;
    }
    if (!agreeTerms) {
      setError('Please agree to the Terms & Conditions');
      return;
    }

    if (isEmailMode) {
      updateUserProfile({
        name: fullName.trim(),
        email: email.trim(),
        phone: '',
      });
      showToast('Verification code sent to your email address!');
    } else {
      updateUserProfile({
        name: fullName.trim(),
        phone: phone.trim(),
        email: '',
      });
      showToast('OTP sent to your mobile number!');
    }

    navigate('/verify-otp', { state: { method: isEmailMode ? 'email' : 'mobile' } });
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="flex items-center justify-between max-w-xl w-full mx-auto">
        <KaamSetuLogo size="sm" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="dropdown" />
          <button
            type="button"
            onClick={() => navigate('/signup-options')}
            className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back', 'Back')}</span>
          </button>
        </div>
      </header>

      {/* Main Form */}
      <main className="max-w-xl w-full mx-auto my-auto py-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {t('createAccount', 'Create Account')}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {isEmailMode
                ? 'Sign up with your email address for instant verification'
                : 'Sign up with your mobile number for quick SMS OTP'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {t('fullName', 'Full Name')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setError('');
                  }}
                  placeholder={t('fullNamePlaceholder', 'e.g. Ravi Kumar')}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50/70 border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] outline-none transition-all"
                />
              </div>
            </div>

            {/* Email Address (Only in Email mode) */}
            {isEmailMode && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {t('email', 'Email Address')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder={t('emailPlaceholder', 'e.g. ravi.kumar@example.com')}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50/70 border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Mobile Number (Only in Mobile mode) */}
            {!isEmailMode && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {t('mobileNumber', 'Mobile Number')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3 rounded-l-2xl border border-r-0 border-gray-200 bg-gray-100 text-xs font-bold text-gray-600">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, ''));
                      setError('');
                    }}
                    placeholder={t('mobileNumberPlaceholder', 'e.g. 9876543210')}
                    className="w-full pl-3 pr-4 py-3 rounded-r-2xl bg-gray-50/70 border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Password with show/hide */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700">
                  {t('password', 'Password')} <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-[#15803D] font-bold hover:underline flex items-center gap-1"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>{t('hidePassword', 'Hide')}</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t('showPassword', 'Show')}</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('passwordPlaceholder', 'Enter your password')}
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-gray-50/70 border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] outline-none transition-all"
                />
              </div>
            </div>

            {/* Terms & Conditions checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-[#15803D] focus:ring-[#15803D] border-gray-300"
                />
                <span className="text-xs text-gray-600 leading-snug">
                  {t('termsAndConditions', 'I agree to the Terms & Conditions and Privacy Policy of KaamSetu')}
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-[#15803D] hover:bg-[#166534] active:scale-[0.99] text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t('continue', 'Continue')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-2">
        Protected with 256-bit encryption • KaamSetu
      </footer>
    </div>
  );
};
