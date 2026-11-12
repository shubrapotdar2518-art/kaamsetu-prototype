import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Star,
  Search,
  RefreshCw,
  QrCode,
  Banknote,
  DollarSign,
  Briefcase,
  X,
  FileText,
} from 'lucide-react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  fetchWorkerJobHistory,
  type WorkerJobHistoryItem,
} from '../../services/jobService';
import { RatingModal } from '../../components/RatingModal';

export const JobHistoryPage: React.FC = () => {
  const { userProfile, showToast } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [historyItems, setHistoryItems] = useState<WorkerJobHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all');

  // Modals
  const [detailedJob, setDetailedJob] = useState<WorkerJobHistoryItem | null>(null);
  const [ratingTarget, setRatingTarget] = useState<WorkerJobHistoryItem | null>(null);

  const loadHistory = async () => {
    if (!userProfile.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const items = await fetchWorkerJobHistory(userProfile.uid);
      setHistoryItems(items);
    } catch (err) {
      console.error('Failed to load worker job history:', err);
      showToast('Could not load job history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [userProfile.uid]);

  const filteredItems = useMemo(() => {
    return historyItems.filter((item) => {
      if (paymentFilter === 'paid' && item.paymentStatus !== 'paid') return false;
      if (paymentFilter === 'pending' && item.paymentStatus !== 'pending') return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          item.jobTitle.toLowerCase().includes(q) ||
          item.employerName.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.trade.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [historyItems, paymentFilter, searchTerm]);

  const totalEarned = useMemo(() => {
    return historyItems
      .filter((i) => i.paymentStatus === 'paid')
      .reduce((sum, i) => sum + (i.wage || 0), 0);
  }, [historyItems]);

  return (
    <DashboardLayout type="worker">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate('/applied-jobs')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Applied Jobs</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2.5">
              <History className="w-7 h-7 text-[#15803D]" />
              <span>{t('jobHistory', 'Job History')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Archive of all completed daily wage jobs, payouts, and mutual reviews.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={loadHistory}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-white border border-gray-200 text-gray-600 hover:text-[#15803D] hover:bg-emerald-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              title="Refresh history"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-100 shadow-2xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Completed Jobs
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              {historyItems.length}
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50/70 border border-emerald-100 shadow-2xs">
            <span className="text-[11px] font-bold text-[#15803D] uppercase tracking-wider">
              Total Earnings Paid
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#15803D] mt-1">
              ₹{totalEarned}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-4 sm:p-5 rounded-3xl bg-white border border-gray-100 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Mutual Reviews
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1 flex items-center gap-1.5">
                <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                <span>
                  {historyItems.filter((i) => i.employerReview).length}/{historyItems.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history by job title, employer, or location..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs sm:text-sm focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] outline-none shadow-2xs transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPaymentFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                paymentFilter === 'all'
                  ? 'bg-[#15803D] text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              All Completed ({historyItems.length})
            </button>
            <button
              type="button"
              onClick={() => setPaymentFilter('paid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                paymentFilter === 'paid'
                  ? 'bg-[#15803D] text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Paid ({historyItems.filter((i) => i.paymentStatus === 'paid').length})
            </button>
            <button
              type="button"
              onClick={() => setPaymentFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                paymentFilter === 'pending'
                  ? 'bg-[#15803D] text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Payment Pending ({historyItems.filter((i) => i.paymentStatus === 'pending').length})
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-[#15803D] animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-500 font-medium">Loading your job history...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
          <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-xs">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">
              <History className="w-8 h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
              No completed job history found.
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-6">
              When you finish hired jobs and complete the OTP verification flow, your completed
              records will automatically appear here.
            </p>
            <button
              type="button"
              onClick={() => navigate('/applied-jobs')}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-[#15803D] text-white hover:bg-[#166534] shadow-xs cursor-pointer"
            >
              View Active Applied Jobs
            </button>
          </div>
        )}

        {/* History Cards Grid */}
        {!loading && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const isPaid = item.paymentStatus === 'paid';
              const eReview = item.employerReview;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Status & Date */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isPaid ? 'Completed & Paid' : 'Completed – Payment Pending'}</span>
                      </span>

                      <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {item.completionDate}
                      </span>
                    </div>

                    {/* Job Title */}
                    <h3 className="text-lg font-extrabold text-gray-900 mb-1 leading-snug">
                      {item.jobTitle}
                    </h3>

                    {/* Employer Name & Location */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mb-3">
                      <span className="flex items-center gap-1 font-semibold text-gray-800">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        {item.employerName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
                        {item.location}
                      </span>
                    </div>

                    {/* Payout & Payment Method */}
                    <div className="p-3 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center justify-between mb-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400">
                          Agreed Wage
                        </span>
                        <div className="text-base font-extrabold text-[#15803D]">
                          ₹{item.wage} <span className="text-[10px] text-gray-500 font-normal">/day</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-gray-400">
                          Payment Method
                        </span>
                        <div className="font-bold text-gray-800 flex items-center gap-1 justify-end">
                          {item.paymentMethod === 'qr_demo' ? (
                            <>
                              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                              <span>UPI (Demo)</span>
                            </>
                          ) : item.paymentMethod === 'cash' ? (
                            <>
                              <Banknote className="w-3.5 h-3.5 text-amber-600" />
                              <span>Cash</span>
                            </>
                          ) : (
                            <span className="text-amber-600">Pending Release</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Employer Review Section */}
                    {eReview ? (
                      <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 mb-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>Employer Review ({eReview.rating}/5)</span>
                          </span>
                        </div>
                        {eReview.comment && (
                          <p className="text-xs text-gray-700 italic">
                            "{eReview.comment}"
                          </p>
                        )}
                        {eReview.categories && (
                          <div className="pt-1.5 border-t border-amber-200/60 flex flex-wrap gap-2 text-[10px] text-amber-900 font-semibold">
                            <span>Quality: {eReview.categories.workQuality || 5}★</span>
                            <span>Punctuality: {eReview.categories.punctuality || 5}★</span>
                            <span>Skills: {eReview.categories.skills || 5}★</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-2xl bg-gray-50 border border-gray-100 mb-3 text-[11px] text-gray-400 italic text-center">
                        Employer has not written a public review yet.
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailedJob(item)}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>

                    {isPaid && !item.workerReviewSubmitted ? (
                      <button
                        type="button"
                        onClick={() => setRatingTarget(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-white" />
                        <span>Rate Employer</span>
                      </button>
                    ) : item.workerReviewSubmitted ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        ✓ You Rated
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detailed Modal */}
        {detailedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    Completed Job Details
                  </span>
                  <h3 className="text-xl font-extrabold text-gray-900 mt-1">
                    {detailedJob.jobTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailedJob(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                  <div>
                    <span className="text-gray-400 font-semibold">Employer</span>
                    <p className="font-bold text-gray-900">{detailedJob.employerName}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold">Trade / Category</span>
                    <p className="font-bold text-gray-900">{detailedJob.trade || 'General'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold">Location</span>
                    <p className="font-bold text-gray-900">{detailedJob.location}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold">Completion Date</span>
                    <p className="font-bold text-gray-900">{detailedJob.completionDate}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-emerald-800 font-semibold">Payout Status</span>
                    <p className="text-base font-extrabold text-[#15803D]">
                      {detailedJob.paymentStatus === 'paid' ? 'Paid in Full' : 'Pending Receipt'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-800 font-semibold">Daily Wage</span>
                    <p className="text-xl font-black text-[#15803D]">₹{detailedJob.wage}</p>
                  </div>
                </div>

                {detailedJob.description && (
                  <div>
                    <span className="font-bold text-gray-700">Job Description</span>
                    <p className="text-gray-600 mt-0.5 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                      {detailedJob.description}
                    </p>
                  </div>
                )}

                {detailedJob.employerReview && (
                  <div>
                    <span className="font-bold text-gray-700">Employer Feedback</span>
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 mt-1 space-y-1">
                      <div className="flex items-center gap-1 font-bold text-amber-900">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>{detailedJob.employerReview.rating}/5 Stars</span>
                      </div>
                      <p className="italic text-gray-700">"{detailedJob.employerReview.comment}"</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailedJob(null)}
                  className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold shadow-xs hover:bg-black transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rating Modal for Worker -> Employer */}
        {ratingTarget && (
          <RatingModal
            isOpen={!!ratingTarget}
            onClose={() => setRatingTarget(null)}
            jobId={ratingTarget.jobId}
            jobTitle={ratingTarget.jobTitle}
            revieweeId={ratingTarget.employerId}
            revieweeName={ratingTarget.employerName}
            revieweeIsWorker={false}
            reviewerId={userProfile.uid || ''}
            onRatingSubmitted={loadHistory}
          />
        )}
      </div>
    </DashboardLayout>
  );
};
