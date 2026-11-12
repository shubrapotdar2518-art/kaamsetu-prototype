import React, { useState, useMemo } from 'react';
import { Briefcase, Search, ArrowLeft, Sparkles, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { JobCard } from '../../components/JobCard';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';

export const AvailableJobsPage: React.FC = () => {
  const { jobs, userProfile } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'recommended'>('all');
  const [selectedTrade, setSelectedTrade] = useState('All');

  const trades = ['All', 'Carpentry', 'Electrical', 'Painting', 'Plumbing', 'General Labour'];

  // All jobs are already scored by the recommendation algorithm and sorted highest match first
  const recommendedCount = useMemo(
    () => jobs.filter((j) => (j.matchPercentage ?? 0) >= 75).length,
    [jobs],
  );

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Filter by Recommended tab if active
      if (activeTab === 'recommended' && (job.matchPercentage ?? 0) < 75) {
        return false;
      }

      // Filter by Trade
      if (selectedTrade !== 'All') {
        const matchesTrade =
          job.category?.toLowerCase() === selectedTrade.toLowerCase() ||
          job.defaultTitle?.toLowerCase().includes(selectedTrade.toLowerCase());
        if (!matchesTrade) return false;
      }

      // Filter by Search Term (title, location, category, employer)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matches =
          job.defaultTitle?.toLowerCase().includes(query) ||
          job.location?.toLowerCase().includes(query) ||
          job.category?.toLowerCase().includes(query) ||
          job.employerName?.toLowerCase().includes(query);
        if (!matches) return false;
      }

      return true;
    });
  }, [jobs, activeTab, selectedTrade, searchTerm]);

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
              <Briefcase className="w-7 h-7 text-[#15803D]" />
              <span>{t('availableJobs', 'Available Jobs')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {userProfile.skills
                ? `Explore open opportunities. Jobs matching your ${userProfile.skills} skills are marked with a Recommended badge.`
                : 'Browse all open daily wage positions nearby with verified employer details.'}
            </p>
          </div>

          {/* Quick Counter */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="px-3.5 py-2 rounded-2xl bg-white border border-gray-200 shadow-2xs text-xs font-semibold text-gray-600">
              <span className="font-bold text-gray-900">{jobs.length}</span> Total Jobs
            </div>
            {recommendedCount > 0 && (
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs font-bold text-[#15803D] shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{recommendedCount} Recommended</span>
              </div>
            )}
          </div>
        </div>

        {/* Search & Tabs Bar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by job title, trade, area, or employer..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs sm:text-sm focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] outline-none shadow-2xs transition-all"
              />
            </div>

            {/* View Mode Tabs (All vs Recommended) */}
            <div className="flex items-center p-1 bg-gray-100 rounded-2xl border border-gray-200/80 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                All Jobs ({jobs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('recommended')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'recommended'
                    ? 'bg-[#15803D] text-white shadow-xs'
                    : 'text-gray-500 hover:text-[#15803D]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recommended ({recommendedCount})</span>
              </button>
            </div>
          </div>

          {/* Trade Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1 pr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Trade:
            </span>
            {trades.map((tr) => (
              <button
                key={tr}
                type="button"
                onClick={() => setSelectedTrade(tr)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedTrade === tr
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {tr}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs Grid / Empty State */}
        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-xs">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
              {t('noJobsAvailable', 'No jobs available right now.')}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-5">
              {searchTerm || selectedTrade !== 'All' || activeTab !== 'all'
                ? 'Try clearing your search terms or filters to see all available listings.'
                : 'Check back soon for new daily wage opportunities posted by local employers.'}
            </p>
            {(searchTerm || selectedTrade !== 'All' || activeTab !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTrade('All');
                  setActiveTab('all');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#15803D] text-white hover:bg-[#166534] transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
