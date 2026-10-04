import React, { useEffect, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Image,
  Plus,
  Trash2,
  Upload,
  Wrench,
} from "lucide-react";

import { KaamSetuLogo } from "../../components/KaamSetuLogo";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { useLanguage } from "../../i18n/LanguageContext";
import { useApp } from "../../context/AppContext";

const PRESET_SKILLS = [
  { value: "Carpentry", label: "Carpentry" },
  { value: "Masonry", label: "Masonry (राजमिस्त्री)" },
  { value: "Painting", label: "Painting" },
  { value: "Plumbing", label: "Plumbing" },
  { value: "Electrical", label: "Electrical" },
  { value: "General Labour", label: "General Labour" },
];

const MAX_PHOTOS = 5;
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

export const WorkerDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { userRole, userProfile, saveWorkerProfile, showToast } = useApp();

  const [skills, setSkills] = useState(userProfile.skills || "");

  const [experience, setExperience] = useState(userProfile.experience || "");

  const [additionalSkills, setAdditionalSkills] = useState(
    userProfile.additionalSkills || "",
  );

  const [dailyWage, setDailyWage] = useState(userProfile.dailyWage || "");

  const [photos, setPhotos] = useState<string[]>([]);
  const photoUrlsRef = useRef<string[]>([]);

  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Preview URLs only exist in the current browser session.
  useEffect(() => {
    return () => {
      photoUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });

      photoUrlsRef.current = [];
    };
  }, []);

  const handleAddPhotos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);

    const freeSlots = MAX_PHOTOS - photoUrlsRef.current.length;

    if (freeSlots <= 0) {
      showToast("You can preview up to five photos.", "info");

      event.target.value = "";
      return;
    }

    const validFiles = selectedFiles
      .filter((file) => {
        const isImage = file.type === "image/jpeg" || file.type === "image/png";

        const withinSizeLimit = file.size <= MAX_PHOTO_SIZE_BYTES;

        return isImage && withinSizeLimit;
      })
      .slice(0, freeSlots);

    if (validFiles.length < selectedFiles.length) {
      showToast("Only PNG or JPG images up to 5 MB can be previewed.", "info");
    }

    const newUrls = validFiles.map((file) => URL.createObjectURL(file));

    photoUrlsRef.current = [...photoUrlsRef.current, ...newUrls];

    setPhotos([...photoUrlsRef.current]);
    event.target.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    const removedUrl = photoUrlsRef.current[index];

    if (removedUrl) {
      URL.revokeObjectURL(removedUrl);
    }

    photoUrlsRef.current = photoUrlsRef.current.filter(
      (_, currentIndex) => currentIndex !== index,
    );

    setPhotos([...photoUrlsRef.current]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!userProfile.uid || userRole !== "worker") {
      setError("Please sign in as a worker before saving your profile.");
      return;
    }

    const primarySkill = skills.trim();

    if (!primarySkill) {
      setError("Please select or enter your primary skill.");
      return;
    }

    const years = Number(experience);

    if (
      experience.trim() === "" ||
      !Number.isInteger(years) ||
      years < 0 ||
      years > 50
    ) {
      setError("Please enter valid years of experience between 0 and 50.");
      return;
    }

    const wage = Number(dailyWage);

    if (dailyWage.trim() !== "" && (!Number.isFinite(wage) || wage <= 0)) {
      setError("Expected daily wage must be a positive number.");
      return;
    }

    setIsSaving(true);

    try {
      await saveWorkerProfile({
        skills: primarySkill,
        experience: experience.trim(),
        additionalSkills: additionalSkills.trim(),
        dailyWage: dailyWage.trim(),
      });

      showToast("Worker profile saved successfully.");

      navigate("/worker-dashboard", {
        replace: true,
      });
    } catch (caughtError) {
      console.error("Could not save worker profile:", caughtError);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not save your profile. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      <header className="flex items-center justify-between max-w-xl w-full mx-auto">
        <KaamSetuLogo size="sm" />

        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="dropdown" />

          <button
            type="button"
            onClick={() => navigate("/choose-role")}
            className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("back", "Back")}</span>
          </button>
        </div>
      </header>

      <main className="max-w-xl w-full mx-auto my-auto py-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#15803D] border border-[#A7F3D0] mb-2">
              Worker Profile
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {t("tellUsAboutYourWork", "Tell Us About Your Work")}
            </h1>

            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Add your skills so employers can discover your profile.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Primary skill */}
            <div>
              <label
                htmlFor="worker-primary-skill"
                className="block text-xs font-bold text-gray-700 mb-1.5"
              >
                Primary Skill <span className="text-rose-500">*</span>
              </label>

              <div className="relative">
                <Wrench className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                <input
                  id="worker-primary-skill"
                  type="text"
                  required
                  value={skills}
                  onChange={(event) => {
                    setSkills(event.target.value);
                    setError("");
                  }}
                  placeholder="e.g. Plumbing"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-[#15803D] focus:bg-white"
                />
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {PRESET_SKILLS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setSkills(preset.value);
                      setError("");
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      skills === preset.value
                        ? "bg-[#15803D] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience and wage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="worker-experience"
                  className="block text-xs font-bold text-gray-700 mb-1.5"
                >
                  Experience (Years) <span className="text-rose-500">*</span>
                </label>

                <div className="relative">
                  <Clock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                  <input
                    id="worker-experience"
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    required
                    value={experience}
                    onChange={(event) => setExperience(event.target.value)}
                    placeholder="e.g. 3"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-[#15803D] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="worker-daily-wage"
                  className="block text-xs font-bold text-gray-700 mb-1.5"
                >
                  Expected Daily Wage (₹)
                </label>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#15803D]">
                    ₹
                  </span>

                  <input
                    id="worker-daily-wage"
                    type="number"
                    min="1"
                    value={dailyWage}
                    onChange={(event) => setDailyWage(event.target.value)}
                    placeholder="e.g. 750"
                    className="w-full pl-8 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-[#15803D] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Additional skills */}
            <div>
              <label
                htmlFor="worker-additional-skills"
                className="block text-xs font-bold text-gray-700 mb-1.5"
              >
                Additional Skills{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>

              <input
                id="worker-additional-skills"
                type="text"
                value={additionalSkills}
                onChange={(event) => setAdditionalSkills(event.target.value)}
                placeholder="e.g. Pipe repair, bathroom fitting"
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-[#15803D] focus:bg-white"
              />

              <p className="text-xs text-gray-400 mt-1">
                Separate multiple skills with commas.
              </p>
            </div>

            {/* Work photo previews */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700">
                  <Image className="w-4 h-4 text-[#15803D]" />
                  Work Photo Previews ({photos.length}/5)
                </label>

                {photos.length < MAX_PHOTOS && (
                  <label className="inline-flex items-center gap-1 text-xs font-bold text-[#15803D] cursor-pointer">
                    <Plus className="w-4 h-4" />
                    Add Photos
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      multiple
                      onChange={handleAddPhotos}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <p className="text-xs text-gray-500 mb-3">
                Preview only. Photos are not uploaded or saved to your profile
                yet.
              </p>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {photos.map((photoUrl, index) => (
                  <div
                    key={photoUrl}
                    className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
                  >
                    <img
                      src={photoUrl}
                      alt={`Work preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      aria-label={`Remove work preview ${index + 1}`}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {photos.length < MAX_PHOTOS && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-[#15803D] bg-gray-50 flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-[#15803D]">
                    <Upload className="w-5 h-5" />
                    <span className="text-[10px] font-bold mt-1">Add</span>

                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      multiple
                      onChange={handleAddPhotos}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-4 px-6 rounded-2xl bg-[#15803D] hover:bg-[#166534] disabled:opacity-60 text-white font-bold flex items-center justify-center gap-2"
            >
              {isSaving
                ? "Saving Profile..."
                : t("saveAndContinue", "Save & Continue")}

              {!isSaving && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-2">
        Your skills help employers find suitable workers.
      </footer>
    </div>
  );
};
