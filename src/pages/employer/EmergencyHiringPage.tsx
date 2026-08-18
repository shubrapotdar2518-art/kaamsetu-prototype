import React, { useState } from 'react';
import { Zap, ArrowLeft, ArrowRight, Radio, Bell, Users, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';

export const EmergencyHiringPage: React.FC = () => {
  const { addJobPost, showToast } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [trade, setTrade] = useState('General Labour / Helper');
  const [workersCount, setWorkersCount] = useState('2');
  const [urgencyHours, setUrgencyHours] = useState('Within 2 Hours');
  const [wage, setWage] = useState('950'); // Emergency higher wage incentive
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBroadcasting(true);

    setTimeout(() => {
      addJobPost({
        title: `🚨 EMERGENCY: ${workersCount} ${trade} Needed (${urgencyHours})`,
        trade: trade,
        location: 'Andheri West (3 km radius)',
        wage: Number(wage) || 950,
        openings: Number(workersCount) || 2,
        duration: 'Today - Immediate',
        description: 'Urgent requirement broadcasted via KaamSetu SOS. Instant cash/UPI payout upon completion.',
      });

      setIsBroadcasting(false);
      showToast(`Emergency broadcast sent to 84 available workers nearby!`);
      navigate('/employer-dashboard');
    }, 1200);
  };

  return (
    <DashboardLayout type="employer">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <button
            type="button"
            onClick={() => navigate('/employer-dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Employer Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <Zap className="w-6 h-6 text-[#F97316]" />
              <span>{t('emergencyHiring', 'Emergency Hiring Broadcast')}</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#FFEDD5] text-[#C2410C] border border-[#FDBA74]">
              Fast SOS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            Send instant priority notifications and phone alerts to active workers currently within 3 km
          </p>
        </div>

        {/* SOS Highlight Card */}
        <div className="bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] border-2 border-[#FDBA74] rounded-3xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F97316] text-white flex items-center justify-center shrink-0 shadow-md">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                How Emergency Hiring Works
              </h3>
              <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                When you trigger an emergency broadcast, our system immediately sends sound alerts to workers’ phones within your radius who are marked available right now.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <form onSubmit={handleBroadcast} className="space-y-4">
            {/* Required Trade */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Urgent Worker Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-[#F97316]"
              >
                <option value="General Labour / Helper">General Labour / Helper</option>
                <option value="Carpentry">Carpenter</option>
                <option value="Electrical">Electrician</option>
                <option value="Plumbing">Plumber</option>
                <option value="Masonry">Mason (राजमिस्त्री)</option>
                <option value="Painting">Painter</option>
              </select>
            </div>

            {/* Workers Count & Timing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Workers Needed Right Now
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={workersCount}
                    onChange={(e) => setWorkersCount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Arrival Time Required
                </label>
                <select
                  value={urgencyHours}
                  onChange={(e) => setUrgencyHours(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-[#F97316]"
                >
                  <option value="Within 1 Hour">⚡ Within 1 Hour (Urgent)</option>
                  <option value="Within 2 Hours">Within 2 Hours</option>
                  <option value="By 2:00 PM Today">By 2:00 PM Today</option>
                </select>
              </div>
            </div>

            {/* Emergency Incentive Wage */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Emergency Daily Wage (₹ / day)
                <span className="text-[11px] font-normal text-gray-400 ml-1">(Higher rates attract instant responses)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-[#F97316]">
                  ₹
                </span>
                <input
                  type="number"
                  value={wage}
                  onChange={(e) => setWage(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-[#F97316]"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isBroadcasting}
                className="w-full py-4 px-6 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.99] text-white font-extrabold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isBroadcasting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Broadcasting SOS to nearby workers...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Send Emergency Hiring Alert Now</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};
