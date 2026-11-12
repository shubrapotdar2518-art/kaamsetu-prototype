import React, { useState, useEffect, useMemo } from 'react';
import { User, Phone, MapPin, ShieldCheck, Edit3, ArrowLeft, Briefcase, Star, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  getRatingsForUser,
  type FirestoreRating,
} from '../../services/ratingService';

export const EmployerProfilePage: React.FC = () => {
  const { userProfile, updateUserProfile, showToast, employerJobPosts } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile.name || userProfile.companyName || '');
  const [phone, setPhone] = useState(userProfile.phone || '');
  const [address, setAddress] = useState(userProfile.address || '');
  const [landmark, setLandmark] = useState(userProfile.landmark || '');
  const [city, setCity] = useState(userProfile.city || '');

  // Ratings & reviews state
  const [reviews, setReviews] = useState<FirestoreRating[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    if (!userProfile.uid) return;
    setLoadingReviews(true);
    getRatingsForUser(userProfile.uid)
      .then(setReviews)
      .catch((err) => console.error('Failed to load employer reviews:', err))
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
      companyName: name,
      phone,
      address,
      landmark,
      city,
    });
    setIsEditing(false);
    showToast('Profile updated successfully!');
  };

  return (
    <DashboardLayout type="employer">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate('/employer-dashboard')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <User className="w-6 h-6 text-[#F97316]" />
              <span>{t('employerProfile', 'Profile')}</span>
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white border border-gray-200 hover:border-[#F97316] text-xs font-bold text-gray-800 shadow-2xs transition-all cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-[#F97316]" />
            <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
          </button>
        </div>

        {/* Employer Card Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-100 to-amber-100 border-2 border-orange-200 flex items-center justify-center text-[#F97316] shadow-sm shrink-0">
              <User className="w-12 h-12" />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h2 className="text-2xl font-extrabold text-gray-900">
                  {userProfile.name || userProfile.companyName || 'Employer Profile'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF7ED] text-[#C2410C] border border-[#FDBA74] self-center sm:self-auto">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Account
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs sm:text-sm text-gray-600 mb-4">
                <span className="font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-xl">
                  💼 {employerJobPosts.length} Active Posts
                </span>
                <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{averageRating > 0 ? `${averageRating} Rating` : 'New Employer'}</span>
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
                  <span>{userProfile.phone ? `+91 ${userProfile.phone}` : userProfile.email || 'Contact not specified'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>{[userProfile.address, userProfile.landmark, userProfile.city].filter(Boolean).join(', ') || 'Location not specified'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-orange-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900">Update Profile Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#F97316]"
                  placeholder="e.g. Ramesh Patel"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">City / Region</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Address / Street</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Landmark / Nearby Area</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#F97316]"
                  placeholder="e.g. Near Market / Station"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Save Profile
              </button>
            </div>
          </form>
        )}

        {/* Worker Feedback & Reviews Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span>Worker Reviews &amp; Ratings ({reviews.length})</span>
              </h3>
              <p className="text-xs text-gray-500">
                Verified feedback submitted by workers who completed jobs for you
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
            <p className="text-xs text-gray-400">Loading worker reviews...</p>
          ) : reviews.length === 0 ? (
            <div className="p-6 rounded-2xl bg-gray-50/70 border border-dashed border-gray-200 text-center">
              <Star className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-gray-700">No worker reviews yet</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Feedback from hired daily wage workers will appear here once jobs are verified and paid.
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
                        {r.reviewerName || 'Daily Worker'}
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
                        {cats.employerBehaviour && (
                          <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600 font-semibold">
                            Behaviour: {cats.employerBehaviour}★
                          </span>
                        )}
                        {cats.communication && (
                          <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600 font-semibold">
                            Communication: {cats.communication}★
                          </span>
                        )}
                        {cats.paymentExperience && (
                          <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600 font-semibold">
                            Payout Experience: {cats.paymentExperience}★
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
