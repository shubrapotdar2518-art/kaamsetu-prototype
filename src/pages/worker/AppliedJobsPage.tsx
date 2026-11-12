import React, { useEffect, useState, useMemo } from 'react';
import {
  CheckCircle2,
  Briefcase,
  MapPin,
  Clock,
  Search,
  ArrowLeft,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Building2,
  Calendar,
  KeyRound,
  QrCode,
  Star,
  History,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  fetchWorkerApplications,
  type WorkerAppliedJobItem,
} from '../../services/jobService';
import { ensureConversation } from '../../services/messageService';
import { PaymentModal } from '../../components/PaymentModal';
import { RatingModal } from '../../components/RatingModal';

interface StatusBadgeConfig {
  label: string;
  badgeClass: string;
  dotColor: string;
  description: string;
}

const mapStatusToConfig = (rawStatus?: string): StatusBadgeConfig => {
  const s = (rawStatus || '').toLowerCase().trim();

  switch (s) {
    case 'pending':
    case 'new':
      return {
        label: 'Pending',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotColor: 'bg-amber-500',
        description: 'Waiting for employer review',
      };

    case 'accepted':
    case 'shortlisted':
      return {
        label: 'Accepted',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        dotColor: 'bg-blue-500',
        description: 'Employer accepted your application',
      };

    case 'offered':
      return {
        label: 'Offered',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse',
        dotColor: 'bg-purple-500',
        description: 'You received a direct job offer!',
      };

    case 'offer_declined':
    case 'declined':
      return {
        label: 'Declined',
        badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
        dotColor: 'bg-gray-400',
        description: 'You declined this offer',
      };

    case 'in_progress':
    case 'hired':
      return {
        label: 'In Progress',
        badgeClass: 'bg-emerald-50 text-[#15803D] border-emerald-300 font-bold',
        dotColor: 'bg-[#15803D]',
        description: 'Active job in progress',
      };

    case 'completion_requested':
      return {
        label: 'Verification Pending',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
        dotColor: 'bg-amber-500 animate-ping',
        description: 'Waiting for OTP verification from employer',
      };

    case 'completed':
      return {
        label: 'Completed',
        badgeClass: 'bg-green-100 text-green-800 border-green-300 font-bold',
        dotColor: 'bg-green-600',
        description: 'Job completed successfully',
      };

    case 'rejected':
      return {
        label: 'Rejected',
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        dotColor: 'bg-red-500',
        description: 'Employer unable to proceed',
      };

    case 'cancelled':
      return {
        label: 'Cancelled',
        badgeClass: 'bg-gray-50 text-gray-500 border-gray-200',
        dotColor: 'bg-gray-400',
        description: 'Position was cancelled',
      };

    default:
      return {
        label: rawStatus ? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1) : 'Pending',
        badgeClass: 'bg-gray-50 text-gray-700 border-gray-200',
        dotColor: 'bg-gray-400',
        description: 'Application status update',
      };
  }
};

const formatApplicationDate = (seconds?: number | null): string => {
  if (!seconds) return 'Recently';
  const d = new Date(seconds * 1000);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const AppliedJobsPage: React.FC = () => {
  const {
    userProfile,
    jobs,
    acceptJobOffer,
    rejectJobOffer,
    requestJobCompletion,
    verifyJobCompletionOtp,
    requestJobPayment,
    showToast,
  } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<WorkerAppliedJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [busyOfferId, setBusyOfferId] = useState<string | null>(null);

  // Workflow modals & states
  const [confirmingCompletionApp, setConfirmingCompletionApp] = useState<WorkerAppliedJobItem | null>(null);
  const [isRequestingCompletion, setIsRequestingCompletion] = useState(false);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [otpSubmittingId, setOtpSubmittingId] = useState<string | null>(null);
  const [selectedPaymentApp, setSelectedPaymentApp] = useState<WorkerAppliedJobItem | null>(null);
  const [selectedRatingApp, setSelectedRatingApp] = useState<WorkerAppliedJobItem | null>(null);

  const loadApplications = async () => {
    if (!userProfile.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const list = await fetchWorkerApplications(userProfile.uid);

      // Also merge any locally applied demo jobs if not already present
      const appliedDemoJobs = jobs
        .filter((j) => j.applied && j.id.startsWith('job-'))
        .map((j) => ({
          id: `${j.id}_${userProfile.uid}`,
          jobId: j.id,
          employerId: j.employerId || 'employer-demo',
          jobTitle: j.defaultTitle,
          employerName: j.employerName || 'KaamSetu Employer',
          location: j.location,
          wage: j.wage,
          status: 'pending',
          appliedAt: null,
          trade: j.category,
          description: j.description,
        }));

      const existingJobIds = new Set(list.map((a) => a.jobId));
      const combined = [...list];
      for (const dj of appliedDemoJobs) {
        if (!existingJobIds.has(dj.jobId)) {
          combined.push(dj);
        }
      }

      setApplications(combined);
    } catch (err) {
      console.error('Failed to load worker applications:', err);
      showToast('Could not load your applications.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [userProfile.uid]);

  const handleMessageEmployer = async (app: WorkerAppliedJobItem) => {
    if (!userProfile.uid) {
      showToast('Please login first', 'error');
      return;
    }

    try {
      const convId = await ensureConversation({
        employerId: app.employerId || ('employer-' + app.jobId),
        workerId: userProfile.uid,
        employerName: app.employerName || 'Employer',
        workerName: userProfile.name || 'Worker',
        jobId: app.jobId,
        jobTitle: app.jobTitle,
      });

      navigate('/messages', {
        state: { conversationId: convId, employerId: app.employerId },
      });
    } catch (err) {
      console.error('Failed to open conversation:', err);
      navigate('/messages');
    }
  };

  const handleAccept = async (app: WorkerAppliedJobItem) => {
    if (busyOfferId) return;
    setBusyOfferId(app.id);
    const ok = await acceptJobOffer(app.id);
    if (ok) {
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: 'in_progress' } : a)),
      );
    }
    setBusyOfferId(null);
  };

  const handleReject = async (app: WorkerAppliedJobItem) => {
    if (busyOfferId) return;
    setBusyOfferId(app.id);
    const ok = await rejectJobOffer(app.id);
    if (ok) {
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: 'offer_declined' } : a)),
      );
    }
    setBusyOfferId(null);
  };

  // Phase 2: Worker requests job completion
  const handleConfirmRequestCompletion = async () => {
    if (!confirmingCompletionApp) return;
    setIsRequestingCompletion(true);
    try {
      const res = await requestJobCompletion(confirmingCompletionApp.jobId);
      if (res) {
        setApplications((prev) =>
          prev.map((a) =>
            a.id === confirmingCompletionApp.id
              ? { ...a, status: 'completion_requested', completionAttempts: 0 }
              : a,
          ),
        );
      }
      setConfirmingCompletionApp(null);
    } finally {
      setIsRequestingCompletion(false);
    }
  };

  // Phase 3: Worker submits OTP shared by employer
  const handleVerifyOtp = async (app: WorkerAppliedJobItem) => {
    const code = (otpInputs[app.id] || '').trim();
    if (!code || code.length !== 6) {
      showToast('Please enter the complete 6-digit verification code.', 'error');
      return;
    }

    setOtpSubmittingId(app.id);
    try {
      const ok = await verifyJobCompletionOtp(app.jobId, code);
      if (ok) {
        const updatedApp: WorkerAppliedJobItem = {
          ...app,
          status: 'completed',
          paymentStatus: 'pending',
        };
        setApplications((prev) =>
          prev.map((a) => (a.id === app.id ? updatedApp : a)),
        );
        // Clear entered input
        setOtpInputs((prev) => {
          const next = { ...prev };
          delete next[app.id];
          return next;
        });
        // Requirement 5: Automatically redirect/open worker to the payment section
        setSelectedPaymentApp(updatedApp);
      } else {
        // Increment local attempt counter display
        setApplications((prev) =>
          prev.map((a) =>
            a.id === app.id
              ? { ...a, completionAttempts: (a.completionAttempts || 0) + 1 }
              : a,
          ),
        );
      }
    } finally {
      setOtpSubmittingId(null);
    }
  };

  const statuses = ['All', 'In Progress', 'Pending', 'Accepted', 'Offered', 'Completed', 'Rejected'];

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const cfg = mapStatusToConfig(app.status);

      if (statusFilter !== 'All') {
        if (statusFilter === 'Completed') {
          if (app.status !== 'completed') return false;
        } else if (cfg.label.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          app.jobTitle.toLowerCase().includes(q) ||
          app.employerName.toLowerCase().includes(q) ||
          app.location.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [applications, statusFilter, searchTerm]);

  const hasArchivedJobs = useMemo(
    () => applications.some((a) => a.status === 'completed' && a.paymentStatus === 'paid'),
    [applications],
  );

  return (
    <DashboardLayout type="worker">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate('/worker-dashboard')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2.5">
              <CheckCircle2 className="w-7 h-7 text-[#15803D]" />
              <span>{t('appliedJobs', 'Applied Jobs')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Track real-time status updates on all jobs you have applied for.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/job-history')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:text-[#15803D] hover:border-emerald-200 shadow-2xs transition-all cursor-pointer"
            >
              <History className="w-4 h-4 text-[#15803D]" />
              <span>{t('jobHistory', 'Job History')}</span>
            </button>

            <button
              type="button"
              onClick={loadApplications}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-white border border-gray-200 text-gray-600 hover:text-[#15803D] hover:bg-emerald-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              title="Refresh applications"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Phase 8 Banner: Link to Job History if completed jobs exist */}
        {hasArchivedJobs && statusFilter === 'All' && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0" />
              <span>
                Completed &amp; paid jobs have been moved to your <strong>Job History</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/job-history')}
              className="font-bold underline hover:text-[#166534] shrink-0 cursor-pointer"
            >
              View Job History →
            </button>
          </div>
        )}

        {/* Filters & Search */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by job title, employer, or location..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs sm:text-sm focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] outline-none shadow-2xs transition-all"
            />
          </div>

          {/* Status filter chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {statuses.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#15803D] text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-[#15803D] animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-500 font-medium">Loading your applications...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredApplications.length === 0 && (
          <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-xs">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#15803D]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
              {applications.length === 0
                ? t('noAppliedJobs', "You haven't applied for any jobs yet.")
                : 'No matching applications found.'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-6">
              {applications.length === 0
                ? 'Explore available daily wage opportunities in your trade and connect with local employers.'
                : 'Try clearing your search query or switching your status filter.'}
            </p>
            {applications.length === 0 ? (
              <button
                type="button"
                onClick={() => navigate('/available-jobs')}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-[#15803D] text-white hover:bg-[#166534] shadow-xs hover:shadow transition-all cursor-pointer"
              >
                Browse Available Jobs
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('All');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Applications List Grid */}
        {!loading && filteredApplications.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApplications.map((app) => {
              const statusCfg = mapStatusToConfig(app.status);
              const isBusy = busyOfferId === app.id;
              const normalizedStatus = (app.status || '').toLowerCase().trim();
const isOffered = normalizedStatus === 'offered';
const isInProgress = normalizedStatus === 'in_progress';
const isCompletionRequested = normalizedStatus === 'completion_requested';
const isCompleted = normalizedStatus === 'completed';

              return (
                <div
                  key={app.id}
                  className="flex flex-col justify-between p-4 sm:p-5 bg-white rounded-2xl border border-gray-100/90 shadow-xs hover:shadow-md transition-all group"
                >
                  <div>
                    {/* Top Status & Date Row */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          isCompleted && app.paymentStatus === 'pending'
                            ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                            : statusCfg.badgeClass
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor}`} />
                        <span>
                          {isCompleted && app.paymentStatus === 'pending'
                            ? 'Completed – Payment Pending'
                            : statusCfg.label}
                        </span>
                      </span>

                      <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3" />
                        {formatApplicationDate(app.appliedAt?.seconds)}
                      </span>
                    </div>

                    {/* Job Title & Employer */}
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#15803D] transition-colors leading-snug mb-1">
                      {app.jobTitle}
                    </h3>

                    <p className="text-xs text-gray-600 font-medium flex items-center gap-1.5 mb-2">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{app.employerName}</span>
                    </p>

                    {/* Status note */}
                    <p className="text-[11px] text-gray-500 mb-3 bg-gray-50 rounded-xl px-2.5 py-1.5 border border-gray-100">
                      {isCompleted && app.paymentStatus === 'pending'
                        ? 'Job completed! Waiting for employer to release payment.'
                        : statusCfg.description}
                    </p>

                    {/* PHASE 2 & 3: Completion Verification OTP interface */}
                    {isCompletionRequested && (
                      <div className="mb-3 p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-amber-900 flex items-center gap-1.5">
                            <KeyRound className="w-4 h-4 text-amber-600" />
                            <span>{t('enterVerificationOtp', 'Enter Verification OTP')}</span>
                          </span>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
                            Attempts: {app.completionAttempts || 0}/5
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-tight">
                          The employer received a 6-digit OTP in their notification. Enter it
                          below to confirm job completion:
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="6-digit OTP"
                            value={otpInputs[app.id] || ''}
                            onChange={(e) =>
                              setOtpInputs((prev) => ({
                                ...prev,
                                [app.id]: e.target.value.replace(/\D/g, ''),
                              }))
                            }
                            className="flex-1 px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-xs font-mono font-black tracking-widest text-center outline-none focus:ring-1 focus:ring-[#15803D]"
                          />
                          <button
                            type="button"
                            disabled={otpSubmittingId === app.id}
                            onClick={() => handleVerifyOtp(app)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#15803D] hover:bg-[#166534] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                          >
                            {otpSubmittingId === app.id ? 'Checking...' : 'Verify OTP'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* PHASE 4: Payment section when completed and payment pending */}
                    {isCompleted && app.paymentStatus === 'pending' && (
                      <div className="mb-3 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#15803D] flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Work Completed</span>
                          </span>
                          <span className="text-[11px] font-extrabold text-[#15803D]">
                            Payout Due: ₹{app.wage}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600">
                          OTP verified successfully! Employer must confirm receipt of payment.
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentApp(app)}
                          className="w-full py-1.5 px-3 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-100 text-xs font-bold text-[#15803D] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>View Demo Payment / QR Code</span>
                        </button>
                      </div>
                    )}

                    {/* PHASE 5: Payment paid - mutual rating trigger */}
                    {isCompleted && app.paymentStatus === 'paid' && (
                      <div className="mb-3 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[#15803D] flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Payment Confirmed ({app.paymentMethod === 'qr_demo' ? 'UPI Demo' : 'Cash'})</span>
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            ₹{app.wage}
                          </span>
                        </div>

                        {!app.workerReviewSubmitted ? (
                          <button
                            type="button"
                            onClick={() => setSelectedRatingApp(app)}
                            className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 fill-white" />
                            <span>{t('rateEmployer', 'Rate Employer')}</span>
                          </button>
                        ) : (
                          <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 py-1.5 px-3 rounded-xl border border-emerald-200 flex items-center gap-1.5 justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                            <span>✓ You Rated</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    {/* Location & Wage */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
                        <span className="truncate max-w-[140px] sm:max-w-[170px]">
                          {app.location}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base sm:text-lg font-extrabold text-[#15803D]">
                          ₹{app.wage}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium ml-0.5">
                          /day
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {isOffered ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleAccept(app)}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#15803D] hover:bg-[#166534] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            Accept Offer
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleReject(app)}
                            className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-red-50 disabled:opacity-50 text-red-600 border border-red-200 text-xs font-bold transition-all cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleMessageEmployer(app)}
                          className="w-full py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-[#15803D] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat with Employer</span>
                        </button>
                      </div>
                    ) : isInProgress ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setConfirmingCompletionApp(app)}
                          className="w-full py-2 px-3 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{t('markJobCompleted', 'Mark Job as Completed')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMessageEmployer(app)}
                          className="w-full py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-[#15803D] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat with Employer</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMessageEmployer(app)}
                        className="w-full py-2 px-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-[#15803D] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat with Employer</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Phase 2: Confirmation Dialog for Completion Request */}
        {confirmingCompletionApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#15803D] flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 mb-1">
                {t('confirmCompletion', 'Confirm Job Completion')}
              </h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Have you completed all work for{' '}
                <strong className="text-gray-900">"{confirmingCompletionApp.jobTitle}"</strong>?
                Confirming will generate a 6-digit demo verification OTP sent to your employer (
                <strong>{confirmingCompletionApp.employerName}</strong>). You will then enter that
                code here to complete the verification.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  disabled={isRequestingCompletion}
                  onClick={() => setConfirmingCompletionApp(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isRequestingCompletion}
                  onClick={handleConfirmRequestCompletion}
                  className="px-5 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isRequestingCompletion ? 'Sending OTP...' : 'Send OTP to Employer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal for Worker */}
        {selectedPaymentApp && (
          <PaymentModal
            isOpen={!!selectedPaymentApp}
            onClose={() => setSelectedPaymentApp(null)}
            jobId={selectedPaymentApp.jobId}
            workerId={userProfile.uid || ''}
            employerId={selectedPaymentApp.employerId}
            workerName={userProfile.name || 'Worker'}
            employerName={selectedPaymentApp.employerName}
            jobTitle={selectedPaymentApp.jobTitle}
            wage={selectedPaymentApp.wage}
            userRole="worker"
            initialMethod={selectedPaymentApp.paymentMethod}
            paymentStatus={selectedPaymentApp.paymentStatus}
            onSelectPaymentMethod={async (method) => {
              const success = await requestJobPayment(selectedPaymentApp.jobId, method);
              if (success) {
                setApplications((prev) =>
                  prev.map((a) =>
                    a.id === selectedPaymentApp.id
                      ? { ...a, paymentMethod: method, paymentStatus: 'pending' }
                      : a,
                  ),
                );
              }
            }}
          />
        )}

        {/* Rating Modal for Worker -> Employer */}
        {selectedRatingApp && (
          <RatingModal
            isOpen={!!selectedRatingApp}
            onClose={() => setSelectedRatingApp(null)}
            jobId={selectedRatingApp.jobId}
            jobTitle={selectedRatingApp.jobTitle}
            revieweeId={selectedRatingApp.employerId}
            revieweeName={selectedRatingApp.employerName}
            revieweeIsWorker={false}
            reviewerId={userProfile.uid || ''}
            onRatingSubmitted={loadApplications}
          />
        )}
      </div>
    </DashboardLayout>
  );
};
