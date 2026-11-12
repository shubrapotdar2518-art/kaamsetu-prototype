import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Landmark,
  CheckCircle2,
  Clock,
  KeyRound,
  Banknote,
  Star,
  MapPin,
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
import { PaymentModal } from '../../components/PaymentModal';
import { RatingModal } from '../../components/RatingModal';

export const WorkerDashboardPage: React.FC = () => {
  const { userProfile, jobs, requestJobPayment } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [workerApps, setWorkerApps] = useState<WorkerAppliedJobItem[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [selectedPaymentApp, setSelectedPaymentApp] = useState<WorkerAppliedJobItem | null>(null);
  const [selectedRatingApp, setSelectedRatingApp] = useState<WorkerAppliedJobItem | null>(null);

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

  const activeAndRecentApps = workerApps.filter((a) =>
    ['in_progress', 'completion_requested', 'completed'].includes(a.status),
  );

  return (
    <DashboardLayout type="worker">
      <div className="space-y-6 sm:space-y-8">
        {/* Welcome Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {userProfile.name ? `Hello, ${userProfile.name} 👋` : 'Hello, Worker 👋'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
              {t('workerDashboardSubtitle', "Here's what's happening today")}
            </p>
          </div>

          {/* Trust Banner / Day earnings indicator */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#15803D] animate-ping" />
            <span className="text-xs font-bold text-gray-700">
              New Jobs in <span className="text-[#15803D]">{userProfile.city || 'Your Area'}</span>
            </span>
          </div>
        </div>

        {/* 1. Profile Overview */}
        <section>
          <ProfileOverviewCard type="worker" />
        </section>

        {/* 2. Active & Completed Jobs Section (Real-time completion, payment & ratings) */}
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
                      {/* Status Badges */}
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
                        Employer: <strong className="text-gray-700">{app.employerName}</strong>
                      </p>

                      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#F97316]" />
                          <span className="truncate max-w-[120px]">{app.location}</span>
                        </span>
                        <span className="font-extrabold text-[#15803D]">₹{app.wage}/day</span>
                      </div>
                    </div>

                    {/* Action buttons */}
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

        {/* Main Grid: 2 columns on large screens (Left: Jobs, Right: Chat Assistant & Schemes) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Left Column: Consolidated Available Jobs (8 cols) */}
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
                  <p className="text-xs text-gray-500">{t('noJobsAvailable', 'No jobs available right now.')}</p>
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

          {/* Right Column: Chat Assistant & Welfare Schemes (4 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            {/* 4. Chat Assistant */}
            <section>
              <ChatAssistantWidget />
            </section>

            {/* 5. Welfare Schemes */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-[#15803D]" />
                    <span>{t('welfareSchemes', 'Welfare Schemes')}</span>
                  </h3>
                  <p className="text-xs text-gray-500">Govt. health &amp; pension benefits</p>
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
                  <WelfareSchemeCard key={scheme.id} scheme={scheme} compact />
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
              const success = await requestJobPayment(selectedPaymentApp.jobId, method);
              if (success) {
                setWorkerApps((prev) =>
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