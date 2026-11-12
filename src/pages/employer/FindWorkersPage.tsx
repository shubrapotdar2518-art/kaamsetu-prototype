import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  MapPin,
  Briefcase,
  Star,
  Award,
  Sparkles,
  CheckCircle2,
  X,
  Clock,
  Send,
  MessageSquare,
  ArrowLeft,
  ChevronDown,
  RotateCcw,
  AlertCircle,
  Wrench,
  Languages,
  PlusCircle,
  Check,
} from 'lucide-react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  fetchAvailableWorkers,
  type AvailableWorker,
} from '../../services/profileService';
import {
  fetchEmployerJobs,
  fetchEmployerJobOffers,
  type FirestoreJob,
} from '../../services/jobService';
import { computeMatchScore } from '../../algorithms/recommendation';
import { ensureConversation } from '../../services/messageService';

const PRESET_TRADES = [
  'All',
  'Carpentry',
  'Masonry',
  'Painting',
  'Plumbing',
  'Electrical',
  'General Labour',
];

export const FindWorkersPage: React.FC = () => {
  const { userProfile, sendDirectJobOffer, showToast } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Data states
  const [workers, setWorkers] = useState<AvailableWorker[]>([]);
  const [employerJobs, setEmployerJobs] = useState<FirestoreJob[]>([]);
  const [offerStatusMap, setOfferStatusMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('All');
  const [locationFilter, setLocationFilter] = useState('');
  const [minExperience, setMinExperience] = useState('0');
  const [maxWage, setMaxWage] = useState('');
  const [selectedJobForMatch, setSelectedJobForMatch] = useState<string>('none');
  const [sortBy, setSortBy] = useState<'match' | 'rating' | 'experience' | 'wageAsc' | 'wageDesc'>('rating');

  // Modals state
  const [viewingWorker, setViewingWorker] = useState<AvailableWorker | null>(null);
  const [offeringWorker, setOfferingWorker] = useState<AvailableWorker | null>(null);
  const [selectedJobIdForOffer, setSelectedJobIdForOffer] = useState<string>('');
  const [isSendingOffer, setIsSendingOffer] = useState(false);

  // Load data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedWorkers, jobs, offers] = await Promise.all([
        fetchAvailableWorkers(),
        userProfile.uid ? fetchEmployerJobs(userProfile.uid) : Promise.resolve([]),
        userProfile.uid ? fetchEmployerJobOffers(userProfile.uid) : Promise.resolve({}),
      ]);

      setWorkers(fetchedWorkers);
      // Filter open jobs that have remaining openings
      const openJobs = jobs.filter(
        (j) => j.status === 'open' && (j.hiredCount ?? 0) < (j.openings ?? 1),
      );
      setEmployerJobs(openJobs);
      setOfferStatusMap(offers);
    } catch (err) {
      console.error('Failed to load workers:', err);
      setError('Unable to load workers at this time. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userProfile.uid]);

  // Selected job object for recommendation match scoring
  const activeMatchingJob = useMemo(() => {
    if (selectedJobForMatch === 'none') return null;
    return employerJobs.find((j) => j.id === selectedJobForMatch) || null;
  }, [selectedJobForMatch, employerJobs]);

  // Compute matched score and filter workers
  const processedWorkers = useMemo(() => {
    return workers
      .map((w) => {
        let matchScore: number | null = null;
        if (activeMatchingJob) {
          matchScore = computeMatchScore(
            {
              primarySkill: w.trade,
              skills: w.skills,
              location: w.location,
              isAvailable: w.isAvailable,
              rating: w.rating,
              totalJobs: w.totalJobs,
            },
            {
              trade: activeMatchingJob.trade,
              location: activeMatchingJob.location,
              urgency: activeMatchingJob.urgency || 'normal',
            },
          );
        }
        return { ...w, matchScore };
      })
      .filter((w) => {
        // Keyword Search (Name, Trade, Skills, Location)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = w.name.toLowerCase().includes(q);
          const matchesTrade = w.trade.toLowerCase().includes(q);
          const matchesSkills = w.skills.some((s) => s.toLowerCase().includes(q));
          const matchesLoc = w.location.toLowerCase().includes(q);
          if (!matchesName && !matchesTrade && !matchesSkills && !matchesLoc) {
            return false;
          }
        }

        // Trade Filter
        if (selectedTrade !== 'All') {
          const tNorm = selectedTrade.toLowerCase();
          const matchesPrimary = w.trade.toLowerCase().includes(tNorm) || tNorm.includes(w.trade.toLowerCase());
          const matchesSkills = w.skills.some((s) => s.toLowerCase().includes(tNorm) || tNorm.includes(s.toLowerCase()));
          if (!matchesPrimary && !matchesSkills) return false;
        }

        // Location Filter
        if (locationFilter.trim()) {
          const loc = locationFilter.toLowerCase().trim();
          if (!w.location.toLowerCase().includes(loc) && !w.address?.toLowerCase().includes(loc)) {
            return false;
          }
        }

        // Min Experience
        const minExp = Number(minExperience);
        if (minExp > 0 && w.experience < minExp) {
          return false;
        }

        // Max Wage
        if (maxWage.trim()) {
          const maxW = Number(maxWage);
          if (maxW > 0 && w.dailyRate > maxW) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (activeMatchingJob && sortBy === 'match') {
          return (b.matchScore ?? 0) - (a.matchScore ?? 0);
        }
        if (sortBy === 'rating') {
          return b.rating - a.rating || b.totalJobs - a.totalJobs;
        }
        if (sortBy === 'experience') {
          return b.experience - a.experience;
        }
        if (sortBy === 'wageAsc') {
          return a.dailyRate - b.dailyRate;
        }
        if (sortBy === 'wageDesc') {
          return b.dailyRate - a.dailyRate;
        }
        return 0;
      });
  }, [
    workers,
    activeMatchingJob,
    searchQuery,
    selectedTrade,
    locationFilter,
    minExperience,
    maxWage,
    sortBy,
  ]);

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTrade('All');
    setLocationFilter('');
    setMinExperience('0');
    setMaxWage('');
    setSelectedJobForMatch('none');
    setSortBy('rating');
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedTrade !== 'All' ||
    Boolean(locationFilter.trim()) ||
    minExperience !== '0' ||
    Boolean(maxWage.trim()) ||
    selectedJobForMatch !== 'none';

  // Open Send Offer dialog
  const handleOpenSendOffer = (worker: AvailableWorker) => {
    setOfferingWorker(worker);
    // Pre-select the active matched job, or the first open job
    if (activeMatchingJob) {
      setSelectedJobIdForOffer(activeMatchingJob.id);
    } else if (employerJobs.length > 0) {
      setSelectedJobIdForOffer(employerJobs[0].id);
    } else {
      setSelectedJobIdForOffer('');
    }
  };

  // Submit Send Offer
  const handleConfirmSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offeringWorker || !selectedJobIdForOffer) return;

    setIsSendingOffer(true);
    try {
      const ok = await sendDirectJobOffer(selectedJobIdForOffer, offeringWorker.id);
      if (ok) {
        // Update local map to immediately show 'offered'
        setOfferStatusMap((prev) => ({
          ...prev,
          [`${selectedJobIdForOffer}_${offeringWorker.id}`]: 'offered',
        }));
        setOfferingWorker(null);
        if (viewingWorker && viewingWorker.id === offeringWorker.id) {
          setViewingWorker(null);
        }
      }
    } finally {
      setIsSendingOffer(false);
    }
  };

  // Message Worker
  const handleMessageWorker = async (worker: AvailableWorker) => {
    if (!userProfile.uid) {
      showToast('Please login first', 'error');
      return;
    }

    try {
      const convId = await ensureConversation({
        employerId: userProfile.uid,
        workerId: worker.id,
        employerName: userProfile.name || userProfile.companyName || 'Employer',
        workerName: worker.name,
        jobId: activeMatchingJob ? activeMatchingJob.id : undefined,
        jobTitle: activeMatchingJob ? activeMatchingJob.title : `${worker.trade} requirement`,
      });
      navigate('/employer-messages', { state: { conversationId: convId, workerId: worker.id } });
    } catch (err) {
      console.error('Failed to open conversation:', err);
      navigate('/employer-messages');
    }
  };

  return (
    <DashboardLayout type="employer">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate('/employer-dashboard')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <Users className="w-7 h-7 text-[#15803D]" />
                <span>{t('findWorkers', 'Find Workers')}</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-[#15803D] border border-emerald-200">
                Available Now
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {t(
                'findWorkersSubtitle',
                'Browse available verified workers and send direct job offers',
              )}
            </p>
          </div>

          {/* Quick Refresh & Post Job */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/post-job')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post a Job</span>
            </button>
          </div>
        </div>

        {/* ─── Match with Open Job Section ─── */}
        <div className="bg-gradient-to-br from-white to-[#ECFDF5] rounded-3xl p-5 sm:p-6 border border-emerald-200/90 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#15803D] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900">
                  {t('matchForJob', 'Find Matches for an Open Job')}
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Select one of your open jobs to automatically score and rank workers based on trade skill, location, availability, and rating.
                </p>
              </div>
            </div>

            <div className="w-full md:w-72 shrink-0">
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Select Open Job for Match
              </label>
              <select
                value={selectedJobForMatch}
                onChange={(e) => {
                  setSelectedJobForMatch(e.target.value);
                  if (e.target.value !== 'none') {
                    setSortBy('match');
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-gray-800 outline-none focus:border-[#15803D] shadow-2xs cursor-pointer"
              >
                <option value="none">Browse All Workers (No Job Selected)</option>
                {employerJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.trade} - ₹{j.wage}/day)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeMatchingJob && (
            <div className="mt-4 pt-4 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="font-extrabold text-[#15803D]">Active Match:</span>
                <span className="font-bold">{activeMatchingJob.title}</span>
                <span>•</span>
                <span className="text-gray-500">{activeMatchingJob.trade}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-gray-500">
                  <MapPin className="w-3 h-3 text-[#F97316]" /> {activeMatchingJob.location}
                </span>
                <span>•</span>
                <span className="font-extrabold text-[#15803D]">₹{activeMatchingJob.wage}/day</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedJobForMatch('none');
                  setSortBy('rating');
                }}
                className="text-[11px] font-bold text-gray-500 hover:text-gray-900 underline cursor-pointer"
              >
                Reset Job Match
              </button>
            </div>
          )}
        </div>

        {/* ─── Search & Filter Toolbar ─── */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, trade, skill, city..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:bg-white focus:border-[#15803D] transition-all"
              />
            </div>

            {/* Trade filter */}
            <div>
              <select
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#15803D] transition-all cursor-pointer"
              >
                {PRESET_TRADES.map((t) => (
                  <option key={t} value={t}>
                    {t === 'All' ? 'All Trades / Professions' : t}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Experience */}
            <div>
              <select
                value={minExperience}
                onChange={(e) => setMinExperience(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#15803D] transition-all cursor-pointer"
              >
                <option value="0">Any Experience</option>
                <option value="1">1+ Years Experience</option>
                <option value="3">3+ Years Experience</option>
                <option value="5">5+ Years Experience</option>
                <option value="8">8+ Years Experience</option>
              </select>
            </div>

            {/* Sort selector */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#15803D] transition-all cursor-pointer"
              >
                {activeMatchingJob && (
                  <option value="match">Sort by: Best Job Match</option>
                )}
                <option value="rating">Sort by: Highest Rated</option>
                <option value="experience">Sort by: Most Experienced</option>
                <option value="wageAsc">Sort by: Daily Wage (Low to High)</option>
                <option value="wageDesc">Sort by: Daily Wage (High to Low)</option>
              </select>
            </div>
          </div>

          {/* Secondary filter chips & Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs">
            <div className="flex items-center gap-2 text-gray-500 font-semibold">
              <Users className="w-4 h-4 text-[#15803D]" />
              <span>
                Showing{' '}
                <strong className="text-gray-900">{processedWorkers.length}</strong> available{' '}
                {processedWorkers.length === 1 ? 'worker' : 'workers'}
              </span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear All Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── Loading State ─── */}
        {loading && (
          <div className="py-20 text-center">
            <div className="w-12 h-12 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-base font-extrabold text-gray-900">
              Loading available workers...
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Fetching registered verified workers available on KaamSetu
            </p>
          </div>
        )}

        {/* ─── Error State ─── */}
        {!loading && error && (
          <div className="p-8 text-center bg-white rounded-3xl border border-rose-200 shadow-sm max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Failed to load workers
            </h3>
            <p className="text-xs text-gray-500 mb-5">{error}</p>
            <button
              type="button"
              onClick={loadData}
              className="px-5 py-2.5 rounded-2xl bg-[#15803D] text-white text-xs font-bold hover:bg-[#166534] transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ─── Empty State ─── */}
        {!loading && !error && processedWorkers.length === 0 && (
          <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-xs max-w-lg mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#15803D]">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
              {workers.length === 0
                ? 'No available workers found right now'
                : 'No workers match your filter criteria'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-6">
              {workers.length === 0
                ? 'Check back soon as workers toggle their availability, or post a new job to invite applications.'
                : 'Try adjusting your trade, location, or wage filters to see more workers.'}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-5 py-2.5 rounded-2xl bg-[#15803D] text-white text-xs font-bold hover:bg-[#166534] transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/post-job')}
                className="px-5 py-2.5 rounded-2xl bg-[#15803D] text-white text-xs font-bold hover:bg-[#166534] transition-colors cursor-pointer"
              >
                Post a Job Requirement
              </button>
            )}
          </div>
        )}

        {/* ─── Workers Grid ─── */}
        {!loading && !error && processedWorkers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {processedWorkers.map((worker) => {
              // Check if any offer has been sent to this worker for the active matching job, or any job
              const activeJobOfferStatus = activeMatchingJob
                ? offerStatusMap[`${activeMatchingJob.id}_${worker.id}`]
                : undefined;

              const isOfferedForActiveJob = activeJobOfferStatus === 'offered';
              const isHiredForActiveJob =
                activeJobOfferStatus === 'in_progress' ||
                activeJobOfferStatus === 'completed' ||
                activeJobOfferStatus === 'accepted';

              return (
                <div
                  key={worker.id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-2xs hover:shadow-md hover:border-emerald-200 transition-all p-5 flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Avatar + Name + Trade + Match Badge */}
                    <div className="flex items-start gap-3.5 mb-3.5">
                      {/* Avatar */}
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 border-2 border-[#15803D]/20 shadow-2xs shrink-0 flex items-center justify-center">
                        {worker.avatar ? (
                          <img
                            src={worker.avatar}
                            alt={worker.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-[#15803D] font-extrabold text-lg">
                            {worker.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#15803D] rounded-full border-2 border-white flex items-center justify-center">
                          <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                        </span>
                      </div>

                      {/* Header details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h3 className="text-base font-extrabold text-gray-900 truncate">
                            {worker.name}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-[#15803D] border border-emerald-200 truncate max-w-[140px]">
                            {worker.trade}
                          </span>

                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>
                              {worker.rating > 0 ? worker.rating.toFixed(1) : 'New'}
                            </span>
                            {worker.totalJobs > 0 && (
                              <span className="text-gray-400">({worker.totalJobs})</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Match Score Badge (if an open job was chosen) */}
                    {worker.matchScore !== null && (
                      <div className="mb-3 p-2 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#15803D]">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{worker.matchScore}% Match for Selected Job</span>
                        </div>
                        <div className="w-16 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#15803D] h-full rounded-full"
                            style={{ width: `${worker.matchScore}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Metrics row */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-gray-50 rounded-2xl mb-3 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">
                          Experience
                        </span>
                        <span className="font-extrabold text-gray-800">
                          {worker.experience} {worker.experience === 1 ? 'Year' : 'Years'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block font-medium">
                          Daily Wage
                        </span>
                        <span className="font-extrabold text-[#15803D]">
                          ₹{worker.dailyRate}
                          <span className="text-[10px] text-gray-500 font-normal">/day</span>
                        </span>
                      </div>
                    </div>

                    {/* Location & Availability */}
                    <div className="space-y-1.5 mb-3 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                        <span className="truncate">{worker.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Available for Work Today</span>
                      </div>
                    </div>

                    {/* Skills pills */}
                    {worker.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {worker.skills.slice(0, 3).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-medium"
                          >
                            {s}
                          </span>
                        ))}
                        {worker.skills.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded-lg bg-gray-50 text-gray-400 text-[10px] font-bold">
                            +{worker.skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    {/* Status notification tag if already offered or hired for active job */}
                    {isOfferedForActiveJob && (
                      <div className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold text-center">
                        ⏳ Offer Sent (Pending Acceptance)
                      </div>
                    )}
                    {isHiredForActiveJob && (
                      <div className="px-2.5 py-1 rounded-xl bg-emerald-50 text-[#15803D] border border-emerald-200 text-[11px] font-bold text-center">
                        ✓ Hired for {activeMatchingJob?.title}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingWorker(worker)}
                        className="flex-1 py-2 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors text-center cursor-pointer"
                      >
                        {t('viewProfile', 'View Profile')}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenSendOffer(worker)}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold shadow-xs transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3 h-3" />
                        <span>{t('sendJobOffer', 'Send Offer')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Modal 1: Worker Profile Preview Modal ─── */}
        {viewingWorker && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6 space-y-5 animate-in fade-in-50 zoom-in-95">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-[#15803D] flex items-center justify-center font-extrabold text-2xl shrink-0 overflow-hidden">
                    {viewingWorker.avatar ? (
                      <img
                        src={viewingWorker.avatar}
                        alt={viewingWorker.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      viewingWorker.name.charAt(0).toUpperCase()
                    )}
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#15803D] rounded-full border-2 border-white flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900">
                      {viewingWorker.name}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-[#15803D] border border-emerald-200">
                        {viewingWorker.trade}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        • Verified Worker
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingWorker(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Banner */}
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <span className="font-bold text-[#15803D] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Available for Work
                </span>
                <span className="font-extrabold text-[#15803D]">
                  Expected Rate: ₹{viewingWorker.dailyRate}/day
                </span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <span className="text-[10px] text-gray-400 font-bold block mb-1">
                    WORK EXPERIENCE
                  </span>
                  <span className="font-extrabold text-gray-900 text-sm">
                    {viewingWorker.experience} {viewingWorker.experience === 1 ? 'Year' : 'Years'}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-2xl">
                  <span className="text-[10px] text-gray-400 font-bold block mb-1">
                    RATING & REPUTATION
                  </span>
                  <span className="font-extrabold text-gray-900 text-sm flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>{viewingWorker.rating > 0 ? viewingWorker.rating.toFixed(1) : 'New'}</span>
                    <span className="text-gray-400 text-xs font-normal">
                      ({viewingWorker.totalJobs} jobs)
                    </span>
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-2xl col-span-2">
                  <span className="text-[10px] text-gray-400 font-bold block mb-1">
                    WORK SITE LOCATION
                  </span>
                  <span className="font-bold text-gray-800 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
                    <span>{viewingWorker.location}</span>
                  </span>
                </div>
              </div>

              {/* Bio */}
              {viewingWorker.bio && (
                <div>
                  <h4 className="text-xs font-extrabold text-gray-700 uppercase mb-1">
                    About / Work Summary
                  </h4>
                  <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl leading-relaxed">
                    {viewingWorker.bio}
                  </p>
                </div>
              )}

              {/* Skills */}
              {viewingWorker.skills.length > 0 && (
                <div>
                  <h4 className="text-xs font-extrabold text-gray-700 uppercase mb-1.5">
                    Skills & Specializations
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingWorker.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-xl bg-emerald-50 text-[#15803D] border border-emerald-200 text-xs font-semibold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional badges: Tools & Languages */}
              <div className="flex flex-wrap gap-2 text-xs pt-2 border-t border-gray-100">
                {viewingWorker.hasOwnTools && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                    <Wrench className="w-3 h-3" /> Owns work tools & equipment
                  </span>
                )}
                {viewingWorker.languages && viewingWorker.languages.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                    <Languages className="w-3 h-3" /> Speaks: {viewingWorker.languages.join(', ')}
                  </span>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleMessageWorker(viewingWorker)}
                  className="px-4 py-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-[#15803D] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Message</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleOpenSendOffer(viewingWorker);
                    setViewingWorker(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Direct Job Offer</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Modal 2: Send Job Offer Modal ─── */}
        {offeringWorker && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 p-6 space-y-5 animate-in fade-in-50 zoom-in-95">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <Send className="w-5 h-5 text-[#15803D]" />
                    <span>Send Job Offer</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Offer an open job to <strong className="text-gray-900">{offeringWorker.name}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOfferingWorker(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Worker Mini Card */}
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-gray-900">
                    {offeringWorker.name}
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    {offeringWorker.trade} • {offeringWorker.experience} yrs exp • {offeringWorker.location}
                  </p>
                </div>
                <span className="text-xs font-extrabold text-[#15803D]">
                  ₹{offeringWorker.dailyRate}/day
                </span>
              </div>

              {/* Offer Form */}
              <form onSubmit={handleConfirmSendOffer} className="space-y-4">
                {employerJobs.length === 0 ? (
                  <div className="p-5 text-center bg-amber-50 rounded-2xl border border-amber-200">
                    <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    <h4 className="text-xs font-bold text-gray-900 mb-1">
                      No Open Jobs Available
                    </h4>
                    <p className="text-[11px] text-gray-600 mb-3">
                      You need to have an active job post to send a direct offer.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/post-job')}
                      className="px-4 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      + Create Job Post Now
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Select Job to Offer <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={selectedJobIdForOffer}
                        onChange={(e) => setSelectedJobIdForOffer(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-[#15803D] transition-all cursor-pointer"
                      >
                        <option value="">-- Choose an open job --</option>
                        {employerJobs.map((j) => {
                          const existingStatus = offerStatusMap[`${j.id}_${offeringWorker.id}`];
                          const isAlreadyOffered = existingStatus === 'offered';
                          const isHired =
                            existingStatus === 'in_progress' ||
                            existingStatus === 'completed' ||
                            existingStatus === 'accepted';

                          let labelSuffix = '';
                          if (isAlreadyOffered) labelSuffix = ' (Offer Already Sent)';
                          if (isHired) labelSuffix = ' (Already Hired)';

                          return (
                            <option
                              key={j.id}
                              value={j.id}
                              disabled={isAlreadyOffered || isHired}
                            >
                              {j.title} — ₹{j.wage}/day ({j.location}){labelSuffix}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Preview details of selected job */}
                    {selectedJobIdForOffer && (
                      (() => {
                        const j = employerJobs.find((x) => x.id === selectedJobIdForOffer);
                        if (!j) return null;
                        const existingStatus = offerStatusMap[`${j.id}_${offeringWorker.id}`];
                        const isDuplicate = existingStatus === 'offered';

                        return (
                          <div className="space-y-3">
                            <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-gray-900">{j.title}</span>
                                <span className="font-extrabold text-[#15803D]">₹{j.wage}/day</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600 text-[11px]">
                                <span>Trade: {j.trade}</span>
                                <span>•</span>
                                <span>Duration: {j.duration || 'Daily'}</span>
                                <span>•</span>
                                <span>Location: {j.location}</span>
                              </div>
                              <div className="text-[11px] text-gray-500">
                                Openings left: {(j.openings ?? 1) - (j.hiredCount ?? 0)} of {j.openings ?? 1}
                              </div>
                            </div>

                            {isDuplicate && (
                              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 font-semibold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>You have already sent an active offer to this worker for this job.</span>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}

                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      💡 The worker will receive an instant <strong>job_offer</strong> notification with Accept and Reject actions. Once accepted, they will be registered as hired on your dashboard.
                    </p>

                    {/* Form actions */}
                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setOfferingWorker(null)}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={
                          !selectedJobIdForOffer ||
                          isSendingOffer ||
                          offerStatusMap[`${selectedJobIdForOffer}_${offeringWorker.id}`] === 'offered'
                        }
                        className="px-5 py-2.5 rounded-xl bg-[#15803D] hover:bg-[#166534] disabled:opacity-50 text-white text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer"
                      >
                        {isSendingOffer ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Sending Offer...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Confirm & Send Offer</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
