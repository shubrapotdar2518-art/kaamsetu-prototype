import React, { useState } from 'react';
import { PlusCircle, ArrowLeft, ArrowRight, Briefcase, MapPin, IndianRupee, Users, Clock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';

export const PostJobPage: React.FC = () => {
  const { addJobPost, showToast, userProfile } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [trade, setTrade] = useState('Carpentry');
  const [location, setLocation] = useState('Andheri West, Mumbai');
  const [wage, setWage] = useState('850');
  const [openings, setOpenings] = useState('3');
  const [duration, setDuration] = useState('4 Days');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a job title');
      return;
    }

    addJobPost({
      title,
      trade,
      location,
      wage: Number(wage) || 800,
      openings: Number(openings) || 1,
      duration,
      description,
    });

    navigate('/employer-dashboard');
  };

  return (
    <DashboardLayout type="employer">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <button
            type="button"
            onClick={() => navigate('/employer-dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Employer Dashboard</span>
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-[#15803D]" />
            <span>{t('postAJob', 'Post a New Job Requirement')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Reach 12,000+ verified daily wage workers within 5 km in Mumbai
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Job Title */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master Carpenter for Modular Kitchen Fitting"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-[#15803D]"
                />
              </div>
            </div>

            {/* Category / Trade & Workers Needed */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Worker Trade / Skill <span className="text-rose-500">*</span>
                </label>
                <select
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-[#15803D]"
                >
                  <option value="Carpentry">Carpentry</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Painting">Painting</option>
                  <option value="Masonry">Masonry (राजमिस्त्री)</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="General Labour">General Labour / Helper</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Number of Workers Needed
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={openings}
                    onChange={(e) => setOpenings(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-[#15803D]"
                  />
                </div>
              </div>
            </div>

            {/* Wage & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Daily Wage Offer (₹ / day) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-[#15803D]">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    value={wage}
                    onChange={(e) => setWage(e.target.value)}
                    placeholder="e.g. 850"
                    className="w-full pl-8 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-[#15803D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Work Duration
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 3 Days / 1 Week"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-[#15803D]"
                  />
                </div>
              </div>
            </div>

            {/* Site Location */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Work Site Location <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Lokhandwala Complex, Andheri West, Mumbai"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:bg-white focus:border-[#15803D]"
                />
              </div>
            </div>

            {/* Additional details */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Work Details &amp; Requirements
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention specific tools needed, tea/lunch provision, or site access instructions..."
                className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm outline-none focus:bg-white focus:border-[#15803D]"
              />
            </div>

            {/* Submit */}
            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-4 px-6 rounded-2xl bg-[#15803D] hover:bg-[#166534] active:scale-[0.99] text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Publish Job Requirement</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};
