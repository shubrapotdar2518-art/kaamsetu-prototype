import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, RefreshCw, Mail, Phone, KeyRound } from 'lucide-react';
import { KaamSetuLogo } from '../../components/KaamSetuLogo';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';

export const VerifyOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { userProfile, showToast } = useApp();

  const isEmailMode =
    (location.state as { method?: string })?.method === 'email' ||
    (Boolean(userProfile.email) && !userProfile.phone);

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(30);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    // Check if pasted multiple characters
    const cleanNumbers = value.replace(/\D/g, '');
    if (cleanNumbers.length > 1) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        if (cleanNumbers[i]) {
          newOtp[i] = cleanNumbers[i];
        }
      }
      setOtp(newOtp);
      const nextFocus = Math.min(cleanNumbers.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const cleanValue = cleanNumbers.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleanValue;
    setOtp(newOtp);

    // Auto move to next input
    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    setIsResending(true);
    setTimeout(() => {
      setCountdown(30);
      setIsResending(false);
      if (isEmailMode) {
        showToast(`New 6-digit verification code sent to ${userProfile.email || 'your email'}!`);
      } else {
        showToast(`New 6-digit OTP sent to +91 ${userProfile.phone || 'your mobile'}!`);
      }
    }, 600);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otp.join('');
    if (entered.length < 6) {
      showToast('Please enter the full 6-digit verification code', 'error');
      return;
    }
    showToast(isEmailMode ? 'Email verified successfully!' : 'Mobile number verified successfully!');
    navigate('/basic-details');
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
            onClick={() => navigate('/create-account', { state: { method: isEmailMode ? 'email' : 'mobile' } })}
            className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back', 'Back')}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl w-full mx-auto my-auto py-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm text-center">
          {/* Badge Icon */}
          <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] text-[#15803D] flex items-center justify-center mx-auto mb-4 border border-[#A7F3D0]">
            {isEmailMode ? <Mail className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {isEmailMode ? 'Verify Your Email' : 'Verify Your Mobile Number'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
            {isEmailMode ? 'Enter the 6-digit verification code sent to' : 'Enter the 6-digit OTP sent to'}{' '}
            <strong className="text-gray-800 font-bold">
              {isEmailMode
                ? userProfile.email || 'your email'
                : userProfile.phone
                ? `+91 ${userProfile.phone}`
                : 'your mobile number'}
            </strong>
          </p>

          <form onSubmit={handleVerify} className="mt-8 space-y-6">
            {/* 6 OTP Input Boxes */}
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-extrabold text-gray-900 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-[#15803D] focus:bg-white focus:ring-2 focus:ring-[#15803D]/20 outline-none transition-all"
                />
              ))}
            </div>

            {/* Resend OTP & Countdown */}
            <div className="text-xs text-gray-500">
              {countdown > 0 ? (
                <p>
                  {t('resendIn', 'Resend in')}{' '}
                  <span className="text-[#15803D] font-bold">{countdown}</span> {t('seconds', 'seconds')}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="inline-flex items-center gap-1.5 font-bold text-[#15803D] hover:underline"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>{isEmailMode ? 'Resend Verification Code' : t('resendOtp', 'Resend OTP')}</span>
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-4 px-6 rounded-2xl bg-[#15803D] hover:bg-[#166534] active:scale-[0.99] text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('verifyAndContinue', 'Verify & Continue')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-2">
        {isEmailMode ? 'Email code verification • KaamSetu' : 'Instant SMS OTP verification • KaamSetu'}
      </footer>
    </div>
  );
};
