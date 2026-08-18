import React, { useState } from 'react';
import { Sparkles, Search, Filter, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { JobCard } from '../../components/JobCard';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';

export const RecommendedJobsPage: React.FC = () => {
  const { jobs, userProfile } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('All');

  const trades = ['All', 'Carpentry', 'Electrical', 'Painting', 'General Labour'];

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.defaultTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTrade = selectedTrade === 'All' || job.category === selectedTrade;
    return matchesSearch && matchesTrade;
  });

  return (
    <DashboardLayout type="worker">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate('/worker-dashboard')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#15803D]" />
              <span>{t('recommendedJobs', 'Recommended Jobs')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Matched automatically with your skill ({userProfile.skills || 'Carpenter'}) and location ({userProfile.city || 'Mumbai'})
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by job title, area or employer..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs sm:text-sm focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {trades.map((tr) => (
              <button
                key={tr}
                type="button"
                onClick={() => setSelectedTrade(tr)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedTrade === tr
                    ? 'bg-[#15803D] text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {tr}
              </button>
            ))}
          </div>
        </div>

        {/* Job Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};
