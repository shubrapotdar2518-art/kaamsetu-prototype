import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Phone,
  MapPin,
  Wrench,
  Clock,
  ShieldCheck,
  Edit3,
  Camera,
  Image,
  ArrowLeft,
  CheckCircle2,
  Star,
  MessageSquare,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  getRatingsForUser,
  type FirestoreRating,
} from '../../services/ratingService';

export const WorkerProfilePage: React.FC = () => {
  const { userProfile, updateUserProfile, showToast, selectedPhotos } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile.name);
  const [skills, setSkills] = useState(userProfile.skills);
  const [experience, setExperience] = useState(userProfile.experience);
  const [dailyWage, setDailyWage] = useState(userProfile.dailyWage);
  const [address, setAddress] = useState(userProfile.address);
  const [city, setCity] = useState(userProfile.city);

  // Ratings & reviews state
  const [reviews, setReviews] = useState<FirestoreRating[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    if (!userProfile.uid) return;
    setLoadingReviews(true);
    getRatingsForUser(userProfile.uid)
      .then(setReviews)
      .catch((err) => console.error('Failed to load ratings:', err))
      .finally(() => setLoadingReviews(false));
  }, [userProfile.uid]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name,
      skills,
      experience,
      dailyWage,
      address,
      city,
    });
    setIsEditing(false);
    showToast('Profile updated successfully!');
  };

  return (
    <DashboardLayout type="worker">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
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
              <User className="w-6 h-6 text-[#15803D]" />
              <span>{t('workerProfile', 'Worker Profile & Verification')}</span>
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white border border-gray-200 hover:border-[#15803D] text-xs font-bold text-gray-800 shadow-2xs transition-all"
          >
            <Edit3 className="w-4 h-4 text-[#15803D]" />
            <span>{isEditing ? t('cancel', 'Cancel') : t('editProfile', 'Edit Profile')}</span>
          </button>
        </div>

        {/* Profile Card Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-[#15803D]/30 bg-gray-50 shadow-md shrink-0 flex items-center justify-center">
              {userProfile.avatar ? (
                <img src={userProfile.avatar} alt={userProfile.name || 'Worker'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  <User className="w-12 h-12" />
                </div>
              )}
              <span className="absolute bottom-1.5 right-1.5 w-6 h-6 bg-[#15803D] rounded-full border-2 border-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h2 className="text-2xl font-extrabold text-gray-900">{userProfile.name || 'Worker Profile'}</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#15803D] border border-emerald-200 self-center sm:self-auto">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Government Verified Worker
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs sm:text-sm text-gray-600 mb-4">
                <span className="font-bold text-[#15803D] bg-emerald-50 px-2.5 py-1 rounded-xl">
                  🛠️ {userProfile.skills || 'Skill not set'}
                </span>
                <span className="font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-xl">
                  ⏱️ {userProfile.experience ? `${userProfile.experience} Years Experience` : 'Experience not set'}
                </span>
                <span className="font-bold text-[#15803D] bg-emerald-50 px-2.5 py-1 rounded-xl">
                  💰 {userProfile.dailyWage ? `₹${userProfile.dailyWage} / day` : 'Wage not set'}
                </span>
                <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{averageRating > 0 ? `${averageRating} Rating` : 'New Worker'}</span>
                  {reviews.length > 0 && (
                    <span className="text-[10px] text-amber-600 font-normal">
                      ({reviews.length})
                    </span>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{userProfile.phone ? `+91 ${userProfile.phone}` : 'Phone not provided'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>{[userProfile.address, userProfile.city].filter(Boolean).join(', ') || 'Location not provided'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Mode Form */}
        {isEditing && (
          <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm space-y-4 animate-in fade-in-50">
            <h3 className="text-base font-bold text-gray-900">Update Profile Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#15803D]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Primary Skill</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#15803D]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Experience (Years)</label>
                <input
                  type="number"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#15803D]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Expected Daily Wage (₹)</label>
                <input
                  type="number"
                  value={dailyWage}
                  onChange={(e) => setDailyWage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#15803D]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#15803D]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Photos of Past Work Showcase */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <Image className="w-5 h-5 text-[#15803D]" />
                <span>{t('photosOfWork', 'Verified Work Photos')}</span>
              </h3>
              <p className="text-xs text-gray-500">Portfolio samples shown to verified local employers and clients</p>
            </div>
          </div>

          {selectedPhotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {selectedPhotos.map((photo, i) => (
                <div
                  key={i}
                  className="group relative aspect-4/3 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-2xs"
                >
                  <img src={photo} alt={`Portfolio sample ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 text-[10px] text-white font-bold">
                    <span>Verified Project #{i + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 px-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 text-center">
              <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-700">No work photos uploaded yet</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Uploading past work or project pictures is optional, but helps you get selected 3x faster by local employers.
              </p>
            </div>
          )}
        </div>

        {/* Customer Ratings & Reviews Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span>Verified Employer Reviews ({reviews.length})</span>
              </h3>
              <p className="text-xs text-gray-500">
                Performance feedback left by employers after completed jobs and verified payouts
              </p>
            </div>
            {reviews.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-extrabold text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{averageRating} / 5.0</span>
              </div>
            )}
          </div>

          {loadingReviews ? (
            <p className="text-xs text-gray-400">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <div className="p-6 rounded-2xl bg-gray-50/70 border border-dashed border-gray-200 text-center">
              <Star className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-gray-700">No reviews yet</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Complete hired jobs and verify payment to earn verified ratings from employers.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {reviews.map((r) => {
                const cats = r.categories as any;
                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-gray-900">
                        {r.reviewerName || 'Verified Employer'}
                      </span>
                      <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{r.rating}/5</span>
                      </div>
                    </div>
                    {r.comment && (
                      <p className="text-gray-700 italic leading-relaxed">
                        "{r.comment}"
                      </p>
                    )}
                    {cats && (
                      <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                        {cats.workQuality && (
                          <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600 font-semibold">
                            Quality: {cats.workQuality}★
                          </span>
                        )}
                        {cats.punctuality && (
                          <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600 font-semibold">
                            Punctuality: {cats.punctuality}★
                          </span>
                        )}
                        {cats.skills && (
                          <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600 font-semibold">
                            Skills: {cats.skills}★
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
