import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MapPin, Building, Compass } from 'lucide-react';
import { KaamSetuLogo } from '../../components/KaamSetuLogo';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useLanguage } from '../../i18n/LanguageContext';
import { useApp } from '../../context/AppContext';

export const BasicDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { userProfile, updateUserProfile, showToast } = useApp();

  const [address, setAddress] = useState(userProfile.address || '');
  const [landmark, setLandmark] = useState(userProfile.landmark || '');
  const [city, setCity] = useState(userProfile.city || '');
  const [pincode, setPincode] = useState(userProfile.pincode || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      showToast('Please enter your street address', 'error');
      return;
    }
    if (!city.trim()) {
      showToast('Please enter your city / district', 'error');
      return;
    }
    if (!pincode.trim()) {
      showToast('Please enter your pincode', 'error');
      return;
    }

    updateUserProfile({
      address: address.trim(),
      landmark: landmark.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
    });
    showToast('Address details saved!');
    navigate('/choose-role');
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
            onClick={() => navigate('/verify-otp')}
            className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back', 'Back')}</span>
          </button>
        </div>
      </header>

      {/* Main Form */}
      <main className="max-w-xl w-full mx-auto my-auto py-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] text-[#15803D] flex items-center justify-center mx-auto mb-3 border border-[#A7F3D0]">
              <MapPin className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {t('tellUsAboutYou', 'Tell Us Your Address')}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Provide your location details to find instant jobs and reliable workers nearby
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Address / Street */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {t('address', 'Address / Street / House No.')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('addressPlaceholder', 'e.g. Room 402, Shiv Shakti Chawl, Andheri West')}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50/70 border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] outline-none transition-all"
                />
              </div>
            </div>

            {/* Landmark Section */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                <span>Landmark / Nearby Area</span>
                <span className="text-gray-400 font-normal ml-1">(Optional)</span>
              </label>
              <div className="relative">
                <Compass className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Metro Station, Behind City Hospital, Opp. Police Chowki"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50/70 border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] outline-none transition-all"
                />
              </div>
            </div>

            {/* City/District & Pincode Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {t('cityDistrict', 'City / District')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t('cityDistrictPlaceholder', 'e.g. Mumbai, Maharashtra')}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50/70 border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {t('pincode', 'Pincode / Postal Code')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('pincodePlaceholder', 'e.g. 400058')}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50/70 border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] outline-none transition-all"
                />
              </div>
            </div>

            {/* Continue Button */}
            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-4 px-6 rounded-2xl bg-[#15803D] hover:bg-[#166534] active:scale-[0.99] text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('continue', 'Continue')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-2">
        Location information helps optimize job matching within your neighborhood
      </footer>
    </div>
  );
};
