import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Briefcase, Bot, Landmark, TrendingUp, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { ProfileOverviewCard } from '../../components/ProfileOverviewCard';
import { JobCard } from '../../components/JobCard';
import { ChatAssistantWidget } from '../../components/ChatAssistantWidget';
import { WelfareSchemeCard, SCHEMES_LIST } from '../../components/WelfareSchemeCard';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';

export const WorkerDashboardPage: React.FC = () => {
  const { userProfile, jobs } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const firstName = userProfile.name ? userProfile.name.split(' ')[0] : 'Worker';

  // Filter recommended vs available jobs
  const recommendedJobs = jobs.filter((j) => j.matchPercentage && j.matchPercentage > 85);
  const availableJobs = jobs.filter((j) => !j.matchPercentage || j.matchPercentage <= 85);

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

        {/* Main Grid: 2 columns on large screens (Left: Jobs, Right: Chat Assistant & Schemes) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Left Column: Recommended & Available Jobs (8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            {/* 2. Recommended Jobs Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#15803D]" />
                    <span>{t('recommendedJobs', 'Recommended Jobs')}</span>
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    {userProfile.skills
                      ? `Handpicked jobs matching your ${userProfile.skills} skills`
                      : 'Handpicked jobs matching verified skills in your area'}
                  </p>
                </div>

                <Link
                  to="/recommended-jobs"
                  className="text-xs font-bold text-[#15803D] hover:text-[#166534] flex items-center gap-1 group"
                >
                  <span>{t('all', 'View All')}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendedJobs.slice(0, 2).map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </section>

            {/* 3. Available Jobs Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#F97316]" />
                    <span>{t('availableJobs', 'Available Jobs')}</span>
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    {t('availableJobsSubtitle', 'Recent daily wage opportunities nearby')}
                  </p>
                </div>

                <Link
                  to="/available-jobs"
                  className="text-xs font-bold text-[#15803D] hover:text-[#166534] flex items-center gap-1 group"
                >
                  <span>{t('all', 'View All')}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableJobs.slice(0, 4).map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
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
                {SCHEMES_LIST.slice(0, 3).map((scheme) => (
                  <WelfareSchemeCard key={scheme.id} scheme={scheme} compact />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
