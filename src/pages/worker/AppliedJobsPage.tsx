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
  const { userProfile, jobs, acceptJobOffer, rejectJobOffer, showToast } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<WorkerAppliedJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [busyOfferId, setBusyOfferId] = useState<string | null>(null);

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

  const statuses = ['All', 'Pending', 'Accepted', 'Offered', 'In Progress', 'Completed', 'Rejected'];

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const cfg = mapStatusToConfig(app.status);

      // Status filter
      if (statusFilter !== 'All') {
        if (cfg.label.toLowerCase() !== statusFilter.toLowerCase()) {
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

          {/* Refresh & Summary */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={loadApplications}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-white border border-gray-200 text-gray-600 hover:text-[#15803D] hover:bg-emerald-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              title="Refresh applications"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="px-3.5 py-2 rounded-2xl bg-white border border-gray-200 shadow-2xs text-xs font-semibold text-gray-600">
              Total Applications: <span className="font-bold text-gray-900">{applications.length}</span>
            </div>
          </div>
        </div>

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
              const isOffered = app.status === 'offered';

              return (
                <div
                  key={app.id}
                  className="flex flex-col justify-between p-4 sm:p-5 bg-white rounded-2xl border border-gray-100/90 shadow-xs hover:shadow-md transition-all group"
                >
                  <div>
                    {/* Top Status & Date Row */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusCfg.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor}`} />
                        <span>{statusCfg.label}</span>
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

                    <p className="text-xs text-gray-600 font-medium flex items-center gap-1.5 mb-3">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{app.employerName}</span>
                    </p>

                    {/* Status note */}
                    <p className="text-[11px] text-gray-500 mb-3 bg-gray-50 rounded-xl px-2.5 py-1.5 border border-gray-100">
                      {statusCfg.description}
                    </p>
                  </div>

                  <div>
                    {/* Location & Wage */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
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
      </div>
    </DashboardLayout>
  );
};
