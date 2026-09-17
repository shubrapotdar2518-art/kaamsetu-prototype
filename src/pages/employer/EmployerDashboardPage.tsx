import React from 'react';
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
} from 'lucide-react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { ProfileOverviewCard } from '../../components/ProfileOverviewCard';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';

export const EmployerDashboardPage: React.FC = () => {
  const { userProfile, employerJobPosts, applications, updateApplicationStatus, showToast } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleShortlist = (appId: string, name: string) => {
    updateApplicationStatus(appId, 'Shortlisted');
  };

  const handleHire = (appId: string, name: string) => {
    updateApplicationStatus(appId, 'Hired');
  };

  return (
    <DashboardLayout type="employer">
      <div className="space-y-6 sm:space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {userProfile.name || userProfile.companyName ? `Hello, ${userProfile.name || userProfile.companyName} 👋` : 'Hello, Employer 👋'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
              {t('employerDashboardSubtitle', "Here's your hiring overview")}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              to="/emergency-hiring"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#FFF7ED] hover:bg-[#FFEDD5] border border-[#FDBA74] text-xs sm:text-sm font-extrabold text-[#C2410C] transition-all shadow-2xs animate-pulse-subtle"
            >
              <Zap className="w-4 h-4 text-[#F97316]" />
              <span>{t('emergencyHiring', 'Emergency Hiring')}</span>
            </Link>

            <Link
              to="/post-job"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('postAJob', 'Post a Job')}</span>
            </Link>
          </div>
        </div>

        {/* 1. Profile Overview Card */}
        <section>
          <ProfileOverviewCard type="employer" />
        </section>

        {/* 2. Quick Actions Banner Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Post a Job Banner */}
          <div
            onClick={() => navigate('/post-job')}
            className="group relative overflow-hidden bg-gradient-to-br from-white to-[#ECFDF5] rounded-3xl p-5 sm:p-6 border border-emerald-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#15803D] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-gray-900 group-hover:text-[#15803D] transition-colors">
                  {t('postAJob', 'Post a Job')}
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {t('postAJobSubtitle', 'Find the right skilled workers in minutes')}
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#15803D] group-hover:translate-x-1 transition-all" />
          </div>

          {/* Emergency Hiring Banner */}
          <div
            onClick={() => navigate('/emergency-hiring')}
            className="group relative overflow-hidden bg-gradient-to-br from-white to-[#FFF7ED] rounded-3xl p-5 sm:p-6 border border-orange-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F97316] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-extrabold text-gray-900 group-hover:text-[#F97316] transition-colors">
                    {t('emergencyHiring', 'Emergency Hiring')}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 animate-pulse">
                    ⚡ 2 Hours
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {t('emergencyHiringSubtitle', 'Need workers urgently? Instant broadcast')}
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#F97316] group-hover:translate-x-1 transition-all" />
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
            {employerJobPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#15803D] border border-emerald-200">
                      {post.trade}
                    </span>
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
                    <span>{post.applicationsCount} {t('applicationsCount', 'Applications')}</span>
                  </div>

                  <span className="text-xs font-bold text-gray-700">
                    ₹{post.wage}/day
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Recent Applications */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#F97316]" />
                <span>{t('recentApplications', 'Recent Applications')}</span>
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {t('recentApplicationsSubtitle', 'Workers who applied for your open positions')}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden divide-y divide-gray-100">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors"
              >
                {/* Worker Details */}
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-extrabold text-gray-900">
                        {app.workerName}
                      </h4>
                      {app.status === 'Shortlisted' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#166534] border border-emerald-200">
                          ✓ {t('shortlisted', 'Shortlisted')}
                        </span>
                      )}
                      {app.status === 'New' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {t('new', 'New')}
                        </span>
                      )}
                      {app.status === 'Hired' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          ★ Hired
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
                      Applied for: <strong className="text-gray-700">{app.appliedFor}</strong> ({app.appliedDate})
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <a
                    href={`tel:${app.phone}`}
                    onClick={(e) => {
                      e.preventDefault();
                      showToast(`Calling ${app.workerName} at ${app.phone}...`);
                    }}
                    className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-bold text-gray-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#15803D]" />
                    <span>{t('callWorker', 'Call')}</span>
                  </a>

                  {app.status !== 'Shortlisted' && app.status !== 'Hired' && (
                    <button
                      type="button"
                      onClick={() => handleShortlist(app.id, app.workerName)}
                      className="px-3 py-2 rounded-xl bg-[#ECFDF5] hover:bg-[#DCFCE7] text-[#15803D] border border-emerald-200 text-xs font-bold transition-colors"
                    >
                      {t('shortlistCandidate', 'Shortlist')}
                    </button>
                  )}

                  {app.status !== 'Hired' && (
                    <button
                      type="button"
                      onClick={() => handleHire(app.id, app.workerName)}
                      className="px-3.5 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      {t('hireNow', 'Hire Now')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};
