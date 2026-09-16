import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, Phone } from 'lucide-react';
import { KaamSetuLogo } from '../../components/KaamSetuLogo';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';
import { loginUser, getMyProfile } from '../../../kaamsetu-prototype/backend/auth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
    const { showToast, updateUserProfile, setUserRole } = useApp();

  const [isEmailMode, setIsEmailMode] = useState(true);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');

    try {
      const loginEmail = isEmailMode ? email.trim() : `${phone.trim()}@kaamsetu.app`;

      await loginUser(loginEmail, password);

      const profile = await getMyProfile();

      if (!profile) {
        setError('Could not find your profile. Please contact support.');
        setIsSubmitting(false);
        return;
      }

      updateUserProfile({
        uid: profile.userId,
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        landmark: profile.landmark || '',
        city: profile.location || '',
        pincode: profile.pincode || '',
      });

      if (profile.userType === 'worker') {
        setUserRole('worker');
        showToast('Welcome back!');
        navigate('/worker-dashboard');
      } else if (profile.userType === 'employer') {
        setUserRole('employer');
        showToast('Welcome back!');
        navigate('/employer-dashboard');
      } else {
        setError('Your account has no role set. Please contact support.');
        setIsSubmitting(false);
      }
    } catch (firebaseError: any) {
      if (
        firebaseError.code === 'auth/invalid-credential' ||
        firebaseError.code === 'auth/wrong-password' ||
        firebaseError.code === 'auth/user-not-found'
      ) {
        setError('Incorrect email/mobile or password.');
      } else {
        setError('Could not log in. Please try again.');
      }
      console.error('Login error:', firebaseError);
      setIsSubmitting(false);
    }
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
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Log in to continue to KaamSetu
            </p>
          </div>

          {/* Email / Mobile toggle */}
          <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setIsEmailMode(true)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                isEmailMode ? 'bg-white text-[#15803D] shadow-sm' : 'text-gray-500'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setIsEmailMode(false)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                !isEmailMode ? 'bg-white text-[#15803D] shadow-sm' : 'text-gray-500'
              }`}
            >
              Mobile Number
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isEmailMode ? (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
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
                    placeholder="e.g. ravi.kumar@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50/70 border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] outline-none transition-all"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Mobile Number <span className="text-rose-500">*</span>
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
                    placeholder="e.g. 9876543210"
                    className="w-full pl-3 pr-4 py-3 rounded-r-2xl bg-gray-50/70 border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Password <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-[#15803D] font-bold hover:underline flex items-center gap-1"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Show</span>
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
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-gray-50/70 border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-[#15803D] hover:bg-[#166534] active:scale-[0.99] text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{isSubmitting ? 'Please wait...' : 'Log In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-center text-xs text-gray-600 font-medium">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/signup-options')}
                className="text-[#15803D] font-bold hover:underline"
              >
                Sign Up
              </button>
            </p>
          </form>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-2">
        Protected with 256-bit encryption • KaamSetu
      </footer>
    </div>
  );
};