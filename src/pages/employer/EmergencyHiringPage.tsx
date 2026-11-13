import React, { useState, useEffect } from 'react';
import {
  Zap,
  ArrowLeft,
  Users,
  Briefcase,
  MapPin,
  AlertTriangle,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  createAndDispatchEmergencyJob,
  subscribeToEmergencyJob,
  checkAndAdvanceEmergencyDispatch,
  type EmergencyDispatchResult,
} from '../../services/emergencyDispatchService';
import { FirestoreJob } from '../../services/jobService';

export const EmergencyHiringPage: React.FC = () => {
  const { userProfile, showToast } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [trade, setTrade] = useState('General Labour / Helper');
  const [location, setLocation] = useState(userProfile.address || userProfile.city || '');
  const [workersCount, setWorkersCount] = useState('1');
  const [urgencyHours, setUrgencyHours] = useState('Within 1 Hour');
  const [wage, setWage] = useState('950'); // Emergency incentive wage
  const [description, setDescription] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Emergency Dispatch Tracking State
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] = useState<EmergencyDispatchResult | null>(null);
  const [liveJob, setLiveJob] = useState<(FirestoreJob & {
    emergencyStatus?: string;
    currentWorkerId?: string | null;
    currentOfferExpiresAt?: number | null;
    assignedWorkerIds?: string[];
    offeredWorkerIds?: string[];
    eligibleWorkersCount?: number;
  }) | null>(null);
  const [liveWorkerInfo, setLiveWorkerInfo] = useState<{
    id: string;
    name: string;
    expiresAt: number | null;
  } | null>(null);

  // Live timer tick for real-time countdown
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Realtime subscription to the emergency job in Firestore
  useEffect(() => {
    if (!activeJobId) return;

    const unsubscribe = subscribeToEmergencyJob(
      activeJobId,
      (updatedJob, workerInfo) => {
        if (updatedJob) {
          setLiveJob(updatedJob as any);
          setLiveWorkerInfo(workerInfo || null);
        }
      },
    );

    return () => unsubscribe();
  }, [activeJobId]);

  // Client-assisted queue check when watching the active tracker
  useEffect(() => {
    if (!activeJobId || !liveJob) return;

    const expiresAt = liveJob.currentOfferExpiresAt;
    if (
      liveJob.status === "open" &&
      liveJob.emergencyStatus === "dispatching" &&
      liveJob.currentWorkerId &&
      expiresAt &&
      currentTime > expiresAt
    ) {
      // 5 minutes passed: advance to next worker
      checkAndAdvanceEmergencyDispatch(activeJobId).catch((err) =>
        console.warn("Error advancing dispatch on client timer:", err),
      );
    }
  }, [activeJobId, liveJob, currentTime]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!userProfile.uid) {
      showToast('Please log in as an employer first.', 'error');
      navigate('/login');
      return;
    }

    if (!title.trim()) {
      showToast('Please enter a job title', 'error');
      return;
    }
    if (!location.trim()) {
      showToast('Please enter a work site location', 'error');
      return;
    }

    const numericWage = Number(wage);
    if (!numericWage || numericWage <= 0) {
      showToast('Please enter a valid wage amount', 'error');
      return;
    }

    const targetWorkers = Math.max(1, Number(workersCount) || 1);

    setIsBroadcasting(true);

    try {
      const employerDisplayName =
        userProfile.companyName || userProfile.name || 'Verified Employer';

      const result = await createAndDispatchEmergencyJob({
        employerId: userProfile.uid,
        employerName: employerDisplayName,
        title: title.trim(),
        trade,
        location: location.trim(),
        wage: numericWage,
        openings: targetWorkers,
        duration: urgencyHours,
        description:
          description.trim() ||
          'Urgent requirement broadcasted via KaamSetu SOS. Instant payout upon completion.',
      });

      setDispatchResult(result);
      setActiveJobId(result.jobId);
      setIsBroadcasting(false);

      if (result.status === 'exhausted' || result.eligibleCount === 0) {
        showToast(
          'Emergency job posted. No available workers matching this trade were found nearby right now.',
          'info',
        );
      } else {
        showToast(
          `Emergency broadcast launched! Offer sent to nearest worker (${result.dispatchedWorker?.name}).`,
          'success',
        );
      }
    } catch (err: any) {
      console.error('Emergency dispatch error:', err);
      setIsBroadcasting(false);
      const msg = err?.message || 'Failed to dispatch emergency job. Please try again.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    }
  };

  const handleResetForm = () => {
    setActiveJobId(null);
    setDispatchResult(null);
    setLiveJob(null);
    setLiveWorkerInfo(null);
    setTitle('');
    setDescription('');
  };

  // Remaining seconds for current active offer
  const currentExpiresAt = liveJob?.currentOfferExpiresAt ?? (dispatchResult?.dispatchedWorker ? (currentTime + 300) : null);
  const remainingSeconds = currentExpiresAt
    ? Math.max(0, currentExpiresAt - currentTime)
    : 0;
  const remainingMins = Math.floor(remainingSeconds / 60);
  const remainingSecs = remainingSeconds % 60;
  const formattedCountdown = `${remainingMins}m ${remainingSecs < 10 ? '0' : ''}${remainingSecs}s`;

  const hiredCount = liveJob?.hiredCount ?? 0;
  const targetOpenings = liveJob?.openings ?? (Number(workersCount) || 1);
  const isFilled = hiredCount >= targetOpenings;
  const isExhausted = liveJob?.emergencyStatus === 'exhausted' && !isFilled;

  return (
    <DashboardLayout type="employer">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <button
            type="button"
            onClick={() => navigate('/employer-dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1.5 cursor-pointer"
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
            Automated sequential dispatch: sends priority offers to nearest eligible available workers with a 5-minute response window
          </p>
        </div>

        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs sm:text-sm flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Dispatch Error</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* ACTIVE DISPATCH TRACKER CARD (Shown when a job is created) */}
        {activeJobId && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#F97316] shadow-md space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#FFF7ED] text-[#EA580C] border border-[#FDBA74]">
                  {isFilled ? '✓ HIRED & ASSIGNED' : isExhausted ? '⚠ NO WORKERS REMAINING' : '⚡ DISPATCH IN PROGRESS'}
                </span>
                <h2 className="text-xl font-black text-gray-900 mt-2">
                  {liveJob?.title || title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                    {liveJob?.trade || trade}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {liveJob?.location || location}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-gray-400 font-bold block">Daily Wage</span>
                <span className="text-lg font-black text-[#15803D]">
                  ₹{liveJob?.wage || wage}/day
                </span>
              </div>
            </div>

            {/* Positions Progress Bar */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#F97316]" />
                  <span>Positions Filled</span>
                </span>
                <span className="text-sm font-extrabold text-[#F97316]">
                  {hiredCount} of {targetOpenings}
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#F97316] to-[#15803D] transition-all duration-500"
                  style={{ width: `${Math.min(100, (hiredCount / targetOpenings) * 100)}%` }}
                />
              </div>
            </div>

            {/* Dynamic Status Box */}
            {isFilled ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-extrabold text-emerald-900">
                    Emergency Hiring Completed!
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    All {targetOpenings} opening{targetOpenings > 1 ? 's' : ''} have been filled. The worker is marked assigned and busy. You can coordinate directly in the employer dashboard.
                  </p>
                </div>
              </div>
            ) : isExhausted ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-extrabold text-amber-900">
                    No Available Workers Nearby
                  </h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    All eligible available workers matching {trade} in your area have been contacted or are currently engaged. Consider offering a higher incentive wage or widening your search area.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <Radio className="w-5 h-5 text-[#F97316] animate-pulse shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-extrabold text-gray-900">
                        Offer Dispatched to Nearest Worker
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Worker: <span className="font-bold text-gray-900">{liveWorkerInfo?.name || dispatchResult?.dispatchedWorker?.name || 'Nearest Eligible Worker'}</span>
                        {dispatchResult?.dispatchedWorker?.distanceLabel && (
                          <span className="text-gray-500 ml-1">({dispatchResult.dispatchedWorker.distanceLabel})</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-orange-600 uppercase block">Response Window</span>
                    <span className="text-sm font-black text-orange-600">
                      ⏱ {formattedCountdown}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-orange-200/60 flex items-center justify-between text-[11px] text-gray-500">
                  <span>
                    Queue Candidates: {liveJob?.eligibleWorkersCount ?? dispatchResult?.eligibleCount ?? 0} eligible nearby
                  </span>
                  <span>
                    Auto-forwards if no response in 5 min
                  </span>
                </div>
              </div>
            )}

            {/* Tracker Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/employer-dashboard')}
                className="w-full py-3.5 px-4 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs sm:text-sm text-center transition-all cursor-pointer"
              >
                Go to Employer Dashboard
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold text-xs sm:text-sm text-center transition-all cursor-pointer"
              >
                Create Another Broadcast
              </button>
            </div>
          </div>
        )}

        {/* SOS Highlight Information Card */}
        {!activeJobId && (
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
                  Our system computes real proximity, excludes busy workers, and sends a priority offer to the nearest verified worker. The worker has exactly 5 minutes to respond. If declined or expired, it automatically forwards to the next nearest candidate.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* EMERGENCY JOB CREATION FORM */}
        {!activeJobId && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <form onSubmit={handleBroadcast} className="space-y-4">
              {/* Job Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Job Title <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Urgent Carpenter Needed for Site Repair"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-[#F97316]"
                  />
                </div>
              </div>

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
                      max="10"
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
                    <option value="Immediate">Immediate Arrival</option>
                  </select>
                </div>
              </div>

              {/* Work Site Location */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Work Site Location <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Lokhandwala Complex, Andheri West, Mumbai"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-[#F97316]"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Proximity is computed against available workers in your suburb/locality.
                </p>
              </div>

              {/* Emergency Incentive Wage */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Emergency Daily Wage (₹ / day)
                  <span className="text-[11px] font-normal text-gray-400 ml-1">
                    (Higher rates attract instant worker responses)
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-[#F97316]">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="100"
                    value={wage}
                    onChange={(e) => setWage(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-[#F97316]"
                  />
                </div>
              </div>

              {/* Additional details */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Work Details &amp; Requirements
                  <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mention specific tools needed, tea/lunch provision, or site access instructions..."
                  className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm outline-none focus:bg-white focus:border-[#F97316]"
                />
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
                      <span>Finding nearest eligible worker &amp; dispatching...</span>
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
        )}
      </div>
    </DashboardLayout>
  );
};
