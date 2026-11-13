import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Landmark,
  CheckCircle2,
  KeyRound,
  Banknote,
  Star,
  MapPin,
  AlertCircle,
  XCircle,
  Clock,
} from 'lucide-react';

import { DashboardLayout } from '../../layouts/DashboardLayout';
import { ProfileOverviewCard } from '../../components/ProfileOverviewCard';
import { JobCard } from '../../components/JobCard';
import { ChatAssistantWidget } from '../../components/ChatAssistantWidget';
import { WelfareSchemeCard, SCHEMES_LIST } from '../../components/WelfareSchemeCard';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';

import {
  fetchWorkerApplications,
  type WorkerAppliedJobItem,
} from '../../services/jobService';

import {
  acceptEmergencyJobOfferDoc,
  rejectEmergencyJobOfferDoc,
} from '../../services/emergencyDispatchService';

import { PaymentModal } from '../../components/PaymentModal';
import { RatingModal } from '../../components/RatingModal';

export const WorkerDashboardPage: React.FC = () => {
  const { userProfile, jobs, requestJobPayment } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [workerApps, setWorkerApps] = useState<WorkerAppliedJobItem[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  const [selectedPaymentApp, setSelectedPaymentApp] =
    useState<WorkerAppliedJobItem | null>(null);

  const [selectedRatingApp, setSelectedRatingApp] =
    useState<WorkerAppliedJobItem | null>(null);

  const [processingOfferId, setProcessingOfferId] = useState<string | null>(null);
  const [offerError, setOfferError] = useState<string | null>(null);

  const loadWorkerApps = async () => {
    if (!userProfile.uid) return;

    setLoadingApps(true);

    try {
      const list = await fetchWorkerApplications(userProfile.uid);
      setWorkerApps(list);
    } catch (err) {
      console.warn('Failed to fetch worker applications on dashboard:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    loadWorkerApps();
  }, [userProfile.uid]);

  // Emergency offers awaiting the worker's response
  const emergencyOffers = workerApps.filter(
    (a) => a.status === 'offered',
  );

  // Active and completed jobs
  const activeAndRecentApps = workerApps.filter((a) =>
    ['in_progress', 'completion_requested', 'completed'].includes(a.status),
  );

  // Handle emergency offer acceptance or rejection
  const handleEmergencyOffer = async (
    app: WorkerAppliedJobItem,
    action: 'accept' | 'reject',
  ) => {
    if (!userProfile.uid || processingOfferId) return;

    setProcessingOfferId(app.id);
    setOfferError(null);

    try {
      if (action === 'accept') {
        const result = await acceptEmergencyJobOfferDoc(
          app.id,
          userProfile.uid,
        );

        alert(result.message);
      } else {
        const result = await rejectEmergencyJobOfferDoc(
          app.id,
          userProfile.uid,
        );

        alert(result.message);
      }

      await loadWorkerApps();
    } catch (err: any) {
      console.error(`Emergency offer ${action} error:`, err);

      setOfferError(
        err?.message || `Failed to ${action} emergency offer. Please try again.`,
      );
    } finally {
      setProcessingOfferId(null);
    }
  };

  return (
    <DashboardLayout type="worker">
      <div className="space-y-6 sm:space-y-8">

        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {userProfile.name
                ? `Hello, ${userProfile.name} 👋`
                : 'Hello, Worker 👋'}
            </h1>

            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
              {t('workerDashboardSubtitle', "Here's what's happening today")}
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#15803D] animate-ping" />

            <span className="text-xs font-bold text-gray-700">
              New Jobs in{' '}
              <span className="text-[#15803D]">
                {userProfile.city || 'Your Area'}
              </span>
            </span>
          </div>
        </div>

        {/* 1. Profile Overview */}
        <section>
          <ProfileOverviewCard type="worker" />
        </section>

        {/* 2. Emergency Job Offers */}
        {emergencyOffers.length > 0 && (
          <section className="bg-orange-50 rounded-3xl p-5 sm:p-6 border border-orange-200 shadow-xs space-y-4">

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
                  Emergency Job Offers
                </h2>

                <p className="text-xs text-gray-600">
                  Respond to these urgent job offers before they expire.
                </p>
              </div>

              <span className="ml-auto px-3 py-1 rounded-full bg-orange-200 text-orange-800 text-xs font-extrabold">
                {emergencyOffers.length} Pending
              </span>
            </div>

            {offerError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />

                <p className="text-xs text-red-700 font-medium">
                  {offerError}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergencyOffers.map((app) => {
                const isProcessing = processingOfferId === app.id;

                return (
                  <div
                    key={`emergency-${app.id}`}
                    className="bg-white rounded-2xl border border-orange-200 p-4 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-extrabold border border-red-200">
                          🚨 EMERGENCY OFFER
                        </span>

                        <span className="flex items-center gap-1 text-[10px] font-bold text-orange-700">
                          <Clock className="w-3 h-3" />
                          5-minute response window
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-gray-900 mb-1">
                        {app.jobTitle}
                      </h3>

                      <p className="text-xs text-gray-500">
                        Employer:{' '}
                        <strong className="text-gray-800">
                          {app.employerName}
                        </strong>
                      </p>

                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin className="w-3.5 h-3.5 text-orange-500" />
                          <span>{app.location}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                          <strong className="text-emerald-700 text-sm">
                            ₹{app.wage}/day
                          </strong>
                        </div>
                      </div>

                      {app.description && (
                        <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                          {app.description}
                        </p>
                      )}
                    </div>

                    {/* Accept and Reject Actions */}
                    <div className="grid grid-cols-2 gap-2 mt-5 pt-3 border-t border-gray-100">

                      <button
                        type="button"
                        disabled={!!processingOfferId}
                        onClick={() => handleEmergencyOffer(app, 'accept')}
                        className="py-2.5 rounded-xl bg-[#15803D] hover:bg-[#166534] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {isProcessing ? (
                          <span>Processing...</span>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Accept Offer
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={!!processingOfferId}
                        onClick={() => handleEmergencyOffer(app, 'reject')}
                        className="py-2.5 rounded-xl bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed border border-red-200 text-red-600 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Offer
                      </button>

                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 3. Active & Completed Jobs */}
        {activeAndRecentApps.length > 0 && (
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-xs space-y-4">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
                  <span>My Active &amp; Completed Jobs</span>
                </h2>

                <p className="text-xs text-gray-500 font-medium">
                  Track completion progress, daily wage payouts, and submit employer ratings.
                </p>
              </div>

              <Link
                to="/applied-jobs"
                className="text-xs font-bold text-[#15803D] hover:text-[#166534] flex items-center gap-1 group cursor-pointer"
              >
                <span>View All Applied ({workerApps.length})</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {activeAndRecentApps.slice(0, 3).map((app) => {
                const isInProgress = app.status === 'in_progress';
                const isCompletionRequested = app.status === 'completion_requested';
                const isCompleted = app.status === 'completed';
                const isPaymentPending = isCompleted && app.paymentStatus === 'pending';
                const isPaid = isCompleted && app.paymentStatus === 'paid';

                return (
                  <div
                    key={`dash-app-${app.id}`}
                    className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-emerald-200 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">

                        {isInProgress && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-[#15803D] border border-emerald-200">
                            ★ In Progress
                          </span>
                        )}

                        {isCompletionRequested && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse flex items-center gap-1">
                            <KeyRound className="w-3 h-3 text-amber-700" />
                            Verification Pending
                          </span>
                        )}

                        {isPaymentPending && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-[#15803D] border border-emerald-300">
                            Completed – Payment Pending
                          </span>
                        )}

                        {isPaid && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-[#15803D] border border-emerald-300">
                              Job Completed
                            </span>

                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-green-100 text-green-900 border border-green-300">
                              Payment Confirmed ({app.paymentMethod === 'qr_demo' ? 'UPI Demo' : 'Cash'})
                            </span>
                          </div>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-extrabold text-gray-900 leading-snug mb-1">
                        {app.jobTitle}
                      </h3>

                      <p className="text-xs text-gray-500 font-medium">
                        Employer:{' '}
                        <strong className="text-gray-700">
                          {app.employerName}
                        </strong>
                      </p>

                      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#F97316]" />
                          <span className="truncate max-w-[120px]">
                            {app.location}
                          </span>
                        </span>

                        <span className="font-extrabold text-[#15803D]">
                          ₹{app.wage}/day
                        </span>
                      </div>
                    </div>

                    {/* Existing Action Buttons */}
                    <div className="mt-3 pt-2.5 border-t border-gray-100">

                      {isCompletionRequested && (
                        <button
                          type="button"
                          onClick={() => navigate('/applied-jobs')}
                          className="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Enter Employer OTP</span>
                        </button>
                      )}

                      {isPaymentPending && (
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentApp(app)}
                          className="w-full py-1.5 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          <span>Select / View Payment Method</span>
                        </button>
                      )}

                      {isPaid && !app.workerReviewSubmitted && (
                        <button
                          type="button"
                          onClick={() => setSelectedRatingApp(app)}
                          className="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span>Rate Employer</span>
                        </button>
                      )}

                      {isPaid && app.workerReviewSubmitted && (
                        <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 py-1 rounded-xl border border-emerald-200 flex items-center gap-1 justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                          <span>✓ You Rated</span>
                        </div>
                      )}

                      {isInProgress && (
                        <button
                          type="button"
                          onClick={() => navigate('/applied-jobs')}
                          className="w-full py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-[#15803D] flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Manage Job in Applied Jobs →</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

          {/* Available Jobs */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#15803D]" />
                    <span>{t('availableJobs', 'Available Jobs')}</span>
                  </h2>

                  <p className="text-xs text-gray-500 font-medium">
                    {userProfile.skills
                      ? `Handpicked matches for your ${userProfile.skills} skills and open positions nearby`
                      : 'Verified opportunities matching your skills and location'}
                  </p>
                </div>

                <Link
                  to="/available-jobs"
                  className="text-xs font-bold text-[#15803D] hover:text-[#166534] flex items-center gap-1 group cursor-pointer"
                >
                  <span>{t('all', 'View All')}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {jobs.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-2xs">
                  <p className="text-xs text-gray-500">
                    {t('noJobsAvailable', 'No jobs available right now.')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobs.slice(0, 4).map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Chat Assistant & Welfare Schemes */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">

            <section>
              <ChatAssistantWidget />
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-[#15803D]" />
                    <span>{t('welfareSchemes', 'Welfare Schemes')}</span>
                  </h3>

                  <p className="text-xs text-gray-500">
                    Govt. health &amp; pension benefits
                  </p>
                </div>

                <Link
                  to="/welfare-schemes"
                  className="text-xs font-bold text-[#15803D] hover:text-[#166534] flex items-center gap-0.5"
                >
                  <span>{t('all', 'All')}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3">
                {SCHEMES_LIST.slice(0, 2).map((scheme) => (
                  <WelfareSchemeCard
                    key={scheme.id}
                    scheme={scheme}
                    compact
                  />
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Worker Payment Modal */}
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
              const success = await requestJobPayment(
                selectedPaymentApp.jobId,
                method,
              );

              if (success) {
                setWorkerApps((prev) =>
                  prev.map((a) =>
                    a.id === selectedPaymentApp.id
                      ? {
                          ...a,
                          paymentMethod: method,
                          paymentStatus: 'pending',
                        }
                      : a,
                  ),
                );
              }
            }}
          />
        )}

        {/* Worker -> Employer Rating Modal */}
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
            onRatingSubmitted={loadWorkerApps}
          />
        )}

      </div>
    </DashboardLayout>
  );
};