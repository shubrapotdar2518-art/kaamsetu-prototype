import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Wrench, Clock, Plus, Trash2, Image, Sparkles, Upload } from 'lucide-react';
import { KaamSetuLogo } from '../../components/KaamSetuLogo';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';

const PRESET_SKILLS = [
  'Carpenter',
  'Mason (राजमिस्त्री)',
  'Painter',
  'Plumber',
  'Electrician',
  'Construction Helper',
  'Welder',
  'Tile & Marble Fitter',
];

export const WorkerDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { userProfile, updateUserProfile, showToast, selectedPhotos, setSelectedPhotos } = useApp();

  const [skills, setSkills] = useState(userProfile.skills || '');
  const [experience, setExperience] = useState(userProfile.experience || '');
  const [additionalSkills, setAdditionalSkills] = useState(userProfile.additionalSkills || '');
  const [dailyWage, setDailyWage] = useState(userProfile.dailyWage || '');
  const [photos, setPhotos] = useState<string[]>(selectedPhotos);
  const [error, setError] = useState('');

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        if (photos.length + newUrls.length < 5) {
          newUrls.push(URL.createObjectURL(files[i]));
        }
      }
      const updated = [...photos, ...newUrls].slice(0, 5);
      setPhotos(updated);
      setSelectedPhotos(updated);
      showToast(`Added ${newUrls.length} work photo(s)`);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    setSelectedPhotos(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skills.trim()) {
      setError('Please provide your primary skill');
      return;
    }
    if (!experience.trim()) {
      setError('Please provide your years of experience');
      return;
    }

    updateUserProfile({
      skills,
      experience,
      additionalSkills,
      dailyWage,
      photos,
    });

    showToast('Work profile completed! Welcome to KaamSetu Dashboard.');
    navigate('/worker-dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="flex items-center justify-between max-w-xl w-full mx-auto">
        <KaamSetuLogo size="sm" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="dropdown" />
          <button
            type="button"
            onClick={() => navigate('/choose-role')}
            className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back', 'Back')}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl w-full mx-auto my-auto py-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-0.5 rounded-full text-xs font-extrabold bg-[#ECFDF5] text-[#15803D] border border-[#A7F3D0] mb-2">
              Worker Profile
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {t('tellUsAboutYourWork', 'Tell Us About Your Work')}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {t('workerDetailsSubtitle', 'Help employers find the right fit for work')}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Primary Skill */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {t('skills', 'Primary Skill')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Wrench className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={skills}
                  onChange={(e) => {
                    setSkills(e.target.value);
                    setError('');
                  }}
                  placeholder={t('skillsPlaceholder', 'e.g. Plumbing, Masonry, Painting, Carpentry')}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50/70 border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] outline-none transition-all"
                />
              </div>

              {/* Quick skill chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PRESET_SKILLS.slice(0, 4).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSkills(preset)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                      skills === preset
                        ? 'bg-[#15803D] text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience & Daily Wage Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {t('experience', 'Experience (in Years)')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    required
                    min="0"
                    max="50"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder={t('experiencePlaceholder', 'e.g. 3')}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50/70 border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {t('dailyWageExpectation', 'Expected Daily Wage (₹/day)')}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-[#15803D]">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={dailyWage}
                    onChange={(e) => setDailyWage(e.target.value)}
                    placeholder={t('dailyWagePlaceholder', 'e.g. 750')}
                    className="w-full pl-8 pr-4 py-3 rounded-2xl bg-gray-50/70 border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Additional Skills */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {t('additionalSkills', 'Additional Skills')} <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={additionalSkills}
                onChange={(e) => setAdditionalSkills(e.target.value)}
                placeholder={t('additionalSkillsPlaceholder', 'e.g. Electric Work, Tiling, Welding')}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50/70 border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] outline-none transition-all"
              />
            </div>

            {/* Photos of Work Section */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-[#15803D]" />
                  <span>{t('photosOfWork', 'Photos of Work')}</span>
                  <span className="text-gray-400 font-normal">({photos.length}/5)</span>
                </label>

                {photos.length < 5 && (
                  <label className="inline-flex items-center gap-1 text-xs font-bold text-[#15803D] hover:text-[#166534] cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('addPhotos', 'Add Photos')}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleAddPhotos}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <p className="text-[11px] text-gray-400 mb-3">
                {t('photosHint', 'Upload up to 5 photos of your past work projects (PNG, JPG)')}
              </p>

              {/* Photo previews grid */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                {photos.map((url, index) => (
                  <div
                    key={index}
                    className="relative group w-full aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-2xs"
                  >
                    <img src={url} alt={`Work sample ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors"
                      title={t('removePhoto', 'Remove')}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {photos.length < 5 && (
                  <label className="w-full aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#15803D] bg-gray-50 hover:bg-emerald-50/50 flex flex-col items-center justify-center text-gray-400 hover:text-[#15803D] cursor-pointer transition-all">
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold">Add</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleAddPhotos}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-4 px-6 rounded-2xl bg-[#15803D] hover:bg-[#166534] active:scale-[0.99] text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('saveAndContinue', 'Save & Continue')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-2">
        KaamSetu verified worker network • 100% daily wage guarantee
      </footer>
    </div>
  );
};
