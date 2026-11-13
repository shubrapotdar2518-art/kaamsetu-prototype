import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Zap,
  Users,
  Briefcase,
  Phone,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  MapPin,
  Building2,
  User,
  MessageSquare,
  KeyRound,
  History,
  QrCode,
  Star,
  Banknote,
  ShieldCheck,
} from 'lucide-react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { ProfileOverviewCard } from '../../components/ProfileOverviewCard';
import { useApp, type JobApplication } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { ensureConversation } from '../../services/messageService';
import { PaymentModal } from '../../components/PaymentModal';
import { RatingModal } from '../../components/RatingModal';

export const EmployerDashboardPage: React.FC = () => {
  const {
    userProfile,
    employerJobPosts,
    applications,
    updateApplicationStatus,
    sendJobOffer,
    confirmJobPayment,
    refreshJobs,
    showToast,
  } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Workflow modals & filters
  const [selectedPaymentApp, setSelectedPaymentApp] = useState<JobApplication | null>(null);
  const [selectedRatingApp, setSelectedRatingApp] = useState<JobApplication | null>(null);
  const [appFilter, setAppFilter] = useState<'All' | 'pending_payment' | 'in_progress' | 'completed' | 'new'>('All');

  const pendingPaymentApps = applications.filter(
    (a) => a.rawStatus === 'completed' && a.paymentStatus === 'pending',
  );

  const filteredApplications = applications.filter((app) => {
    if (appFilter === 'pending_payment') {
      return app.rawStatus === 'completed' && app.paymentStatus === 'pending';
    }
    if (appFilter === 'completed') {
      return app.rawStatus === 'completed' && app.paymentStatus === 'paid';
    }
    if (appFilter === 'in_progress') {
      return app.rawStatus === 'in_progress' || app.rawStatus === 'completion_requested';
    }
    if (appFilter === 'new') {
      return app.status === 'New' || app.status === 'Shortlisted';
    }
    return true;
  });

  const handleShortlist = (appId: string, name: string) => {
    updateApplicationStatus(appId, 'Shortlisted');
  };

  const handleHire = (appId: string, name: string) => {
    sendJobOffer(appId);
  };

  const handleMessageWorker = async (app: (typeof applications)[0]) => {
    if (!userProfile.uid) {
      showToast('Please login first', 'error');
      return;
    }

    const workerId = app.workerId || app.id;
    try {
      const convId = await ensureConversation({
        employerId: userProfile.uid,
        workerId: workerId,
        employerName: userProfile.name || userProfile.companyName || 'Employer',
        workerName: app.workerName,
        jobId: app.jobId,
        jobTitle: app.appliedFor,
      });
      navigate('/employer-messages', { state: { conversationId: convId, workerId } });
    } catch (err) {
      console.error('Failed to open conversation:', err);
      navigate('/employer-messages');
    }
  };

  const handleConfirmPayment = async (method: 'qr_demo' | 'cash') => {
    if (!selectedPaymentApp?.jobId || !selectedPaymentApp.workerId) return;
    await confirmJobPayment(selectedPaymentApp.jobId, selectedPaymentApp.workerId, method);
    await refreshJobs();
    setSelectedPaymentApp(null);
  };

  return (
    <DashboardLayout type="employer">
      <div className="space-y-6 sm:space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {userProfile.name || userProfile.companyName
                ? `Hello, ${userProfile.name || userProfile.companyName} 👋`
                : 'Hello, Employer 👋'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
              {t('employerDashboardSubtitle', "Here's your hiring overview")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/employer-job-history')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:text-[#15803D] hover:border-emerald-200 shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <History className="w-4 h-4 text-[#15803D]" />
            <span>{t('postedJobHistory', 'Posted Job History')}</span>
          </button>
        </div>

        {/* 1. Profile Overview Card */}
        <section>
          <ProfileOverviewCard type="employer" />
        </section>

        {/* 2. Quick Actions Banner Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Find Workers Banner */}
          <div
            onClick={() => navigate('/find-workers')}
            className="group relative overflow-hidden bg-gradient-to-br from-white to-[#F0FDF4] rounded-3xl p-5 border border-emerald-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#15803D] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 group-hover:text-[#15803D] transition-colors">
                  {t('findWorkers', 'Find Workers')}
                </h3>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  Browse available workers &amp; send offers
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#15803D] group-hover:translate-x-1 transition-all" />
          </div>

          {/* Post a Job Banner */}
          <div
            onClick={() => navigate('/post-job')}
            className="group relative overflow-hidden bg-gradient-to-br from-white to-[#F8FAFC] rounded-3xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 group-hover:text-slate-800 transition-colors">
                  {t('postAJob', 'Post a Job')}
                </h3>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  {t('postAJobSubtitle', 'Find skilled workers in minutes')}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-slate-800 group-hover:translate-x-1 transition-all" />
          </div>

          {/* Emergency Hiring Banner */}
          <div
            onClick={() => navigate('/emergency-hiring')}
            className="group relative overflow-hidden bg-gradient-to-br from-white to-[#FFF7ED] rounded-3xl p-5 border border-orange-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#F97316] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm sm:text-base font-extrabold text-gray-900 group-hover:text-[#F97316] transition-colors">
                    {t('emergencyHiring', 'Emergency Hiring')}
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-orange-100 text-orange-800 animate-pulse">
                    ⚡ Fast
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  {t('emergencyHiringSubtitle', 'Instant broadcast within 2 hours')}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#F97316] group-hover:translate-x-1 transition-all" />
          </div>
        </section>

        {/* 3. Active Job Posts */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#15803D]" />
                <span>{t('activeJobPosts', 'Active Job Posts')}</span>
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {t('activeJobPostsSubtitle', 'Track live requirements and received worker profiles')}
              </p>
            </div>

            <Link
              to="/post-job"
              className="text-xs font-bold text-[#15803D] hover:text-[#166534] flex items-center gap-1"
            >
              <span>+ Create New</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {employerJobPosts.slice(0, 3).map((post) => (
              <div
                key={post.id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#15803D] border border-emerald-200">
                        {post.trade}
                      </span>
                      {post.status === 'Urgent' && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#FFEDD5] text-[#C2410C] border border-[#FDBA74]">
                          🚨 SOS
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.postedDate}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mb-1 leading-snug">
                    {post.title}
                  </h3>

                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                    <MapPin className="w-3 h-3 text-[#F97316]" />
                    <span>{post.location}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#15803D]">
                    <Users className="w-4 h-4 text-[#15803D]" />
                    <span>
                      {post.applicationsCount} {t('applicationsCount', 'Applications')}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-gray-700">
                    ₹{post.wage}/day
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Dedicated Section: Pending Payment Confirmations */}
        {pendingPaymentApps.length > 0 && (
          <section className="bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-emerald-500/5 p-5 sm:p-6 rounded-3xl border border-emerald-300 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Action Required
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2 mt-1">
                  <Banknote className="w-5 h-5 text-[#15803D]" />
                  <span>Pending Payment Confirmations ({pendingPaymentApps.length})</span>
                </h2>
                <p className="text-xs text-gray-600">
                  Workers who verified completion and are awaiting daily wage payment confirmation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingPaymentApps.map((app) => (
                <div
                  key={`pending-pay-${app.id}`}
                  className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{app.workerName}</h4>
                      <p className="text-xs text-[#15803D] font-medium">{app.trade} • {app.appliedFor}</p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Requested Method:{" "}
                        <strong className="text-gray-800">
                          {app.paymentMethod === "qr_demo" ? "UPI / QR Demo" : "Cash in Hand"}
                        </strong>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-gray-400">Due Wage</span>
                      <div className="text-base font-extrabold text-[#15803D]">₹{app.wage || 0}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentApp(app)}
                      className="px-4 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Payment</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Recent Applications */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#F97316]" />
                <span>{t('recentApplications', 'Recent Applications')}</span>
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {t('recentApplicationsSubtitle', 'Workers who applied for your open positions')}
              </p>
            </div>

            {/* Application Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {(
                [
                  { id: 'All', label: `All (${applications.length})` },
                  { id: 'pending_payment', label: `Pending Payment (${pendingPaymentApps.length})` },
                  { id: 'completed', label: `Completed & Paid (${applications.filter(a => a.rawStatus === 'completed' && a.paymentStatus === 'paid').length})` },
                  { id: 'in_progress', label: 'In Progress' },
                  { id: 'new', label: 'New / Shortlisted' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAppFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    appFilter === tab.id
                      ? 'bg-[#15803D] text-white shadow-xs'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden divide-y divide-gray-100">
            {filteredApplications.map((app) => {
              const isCompletionRequested = app.rawStatus === 'completion_requested';
              const isCompleted = app.rawStatus === 'completed';
              const isPaymentPending = isCompleted && app.paymentStatus === 'pending';
              const isPaid = isCompleted && app.paymentStatus === 'paid';

              return (
                <div
                  key={app.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors"
                >
                  {/* Worker Details */}
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 shrink-0 mt-0.5">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <h4 className="text-sm sm:text-base font-extrabold text-gray-900">
                          {app.workerName}
                        </h4>

                        {/* Status Badges */}
                        {isCompletionRequested && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse flex items-center gap-1">
                            <KeyRound className="w-3 h-3 text-amber-700" />
                            OTP Verification Requested
                          </span>
                        )}

                        {isPaymentPending && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-[#15803D] border border-emerald-300">
                            Completed – Payment Pending
                          </span>
                        )}

                        {isPaid && (
                          <div className="flex items-center gap-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-[#15803D] border border-emerald-300">
                              Job Completed
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-green-100 text-green-900 border border-green-300">
                              Payment Confirmed ({app.paymentMethod === 'qr_demo' ? 'UPI Demo' : 'Cash'})
                            </span>
                          </div>
                        )}

                        {!isCompletionRequested && !isCompleted && app.status === 'Shortlisted' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#166534] border border-emerald-200">
                            ✓ {t('shortlisted', 'Shortlisted')}
                          </span>
                        )}

                        {!isCompletionRequested && !isCompleted && app.status === 'New' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {t('new', 'New')}
                          </span>
                        )}

                        {!isCompletionRequested && !isCompleted && app.status === 'Hired' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            ★ In Progress
                          </span>
                        )}

                        {!isCompletionRequested && !isCompleted && app.status === 'Offered' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            ⏳ Offer sent
                          </span>
                        )}

                        {!isCompletionRequested && !isCompleted && app.status === 'Declined' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            ✕ Declined
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-gray-600">
                        <span className="font-semibold text-[#15803D]">{app.trade}</span>
                        <span>•</span>
                        <span>{app.experience}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-gray-500">
                          <MapPin className="w-3 h-3 text-[#F97316]" /> {app.location}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-400 mt-1">
                        Applied for: <strong className="text-gray-700">{app.appliedFor}</strong> (
                        {app.appliedDate})
                      </p>

                      {/* PHASE 3: Employer OTP Callout Box */}
                      {isCompletionRequested && (
                        <div className="mt-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200 max-w-lg">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                              <KeyRound className="w-4 h-4 text-amber-700" />
                              <span>Worker Verification OTP:</span>
                            </span>
                            <span className="font-mono text-sm px-3 py-1 rounded-xl bg-white border border-amber-300 text-amber-900 font-black tracking-widest shadow-2xs">
                              {app.completionOtp || 'Check Notifications'}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-800 mt-1.5 leading-snug">
                            {app.workerName} has marked the job completed. Share this 6-digit OTP
                            with them so they can verify completion. (Valid for 10 mins).
                          </p>
                        </div>
                      )}

                      {/* PHASE 4: Payment Pending Callout Box */}
                      {isPaymentPending && (
                        <div className="mt-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 max-w-lg flex items-center justify-between gap-3">
                          <div className="text-xs">
                            <p className="font-bold text-[#15803D]">Completion Verified!</p>
                            <p className="text-[11px] text-gray-600">
                              Please release agreed daily wage (₹{app.wage || 0}).
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedPaymentApp(app)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Confirm Payout</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                    <a
                      href={`tel:${app.phone}`}
                      onClick={(e) => {
                        e.preventDefault();
                        showToast(`Calling ${app.workerName} at ${app.phone}...`);
                      }}
                      className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-bold text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#15803D]" />
                      <span>{t('callWorker', 'Call')}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleMessageWorker(app)}
                      className="px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-[#15803D] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{t('messages', 'Message')}</span>
                    </button>

                    {/* Shortlist action */}
                    {!isCompletionRequested &&
                      !isCompleted &&
                      app.status !== 'Shortlisted' &&
                      app.status !== 'Hired' &&
                      app.status !== 'Offered' &&
                      app.status !== 'Declined' && (
                        <button
                          type="button"
                          onClick={() => handleShortlist(app.id, app.workerName)}
                          className="px-3 py-2 rounded-xl bg-[#ECFDF5] hover:bg-[#DCFCE7] text-[#15803D] border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                        >
                          {t('shortlistCandidate', 'Shortlist')}
                        </button>
                      )}

                    {/* Hire action */}
                    {!isCompletionRequested &&
                      !isCompleted &&
                      app.status !== 'Hired' &&
                      app.status !== 'Offered' && (
                        <button
                          type="button"
                          onClick={() => handleHire(app.id, app.workerName)}
                          className="px-3.5 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          Send Offer
                        </button>
                      )}

                    {/* PHASE 5: Rate Worker button */}
                    {isPaid && !app.employerReviewSubmitted && (
                      <button
                        type="button"
                        onClick={() => setSelectedRatingApp(app)}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-white" />
                        <span>{t('rateWorker', 'Rate Worker')}</span>
                      </button>
                    )}

                    {isPaid && app.employerReviewSubmitted && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                        <span>✓ You Rated</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Payment Confirmation Modal for Employer */}
        {selectedPaymentApp && (
          <PaymentModal
            isOpen={!!selectedPaymentApp}
            onClose={() => setSelectedPaymentApp(null)}
            jobId={selectedPaymentApp.jobId || ''}
            workerId={selectedPaymentApp.workerId || ''}
            employerId={userProfile.uid || ''}
            workerName={selectedPaymentApp.workerName}
            employerName={userProfile.name || userProfile.companyName || 'Employer'}
            jobTitle={selectedPaymentApp.appliedFor}
            wage={selectedPaymentApp.wage || 0}
            userRole="employer"
            initialMethod={selectedPaymentApp.paymentMethod}
            paymentStatus={selectedPaymentApp.paymentStatus}
            onConfirmPayment={handleConfirmPayment}
          />
        )}

        {/* Rating Modal for Employer -> Worker */}
        {selectedRatingApp && (
          <RatingModal
            isOpen={!!selectedRatingApp}
            onClose={() => setSelectedRatingApp(null)}
            jobId={selectedRatingApp.jobId || ''}
            jobTitle={selectedRatingApp.appliedFor}
            revieweeId={selectedRatingApp.workerId || ''}
            revieweeName={selectedRatingApp.workerName}
            revieweeIsWorker={true}
            reviewerId={userProfile.uid || ''}
            onRatingSubmitted={refreshJobs}
          />
        )}
      </div>
    </DashboardLayout>
  );
};
