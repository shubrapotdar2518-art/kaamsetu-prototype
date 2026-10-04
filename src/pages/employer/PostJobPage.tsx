import React, { useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Clock,
  IndianRupee,
  MapPin,
  PlusCircle,
  Users,
} from "lucide-react";

import { DashboardLayout } from "../../layouts/DashboardLayout";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../i18n/LanguageContext";

type Urgency = "normal" | "emergency";

interface JobFormData {
  title: string;
  trade: string;
  location: string;
  wage: string;
  openings: string;
  duration: string;
  description: string;
  urgency: Urgency;
}

export const PostJobPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { userRole, userProfile, addJobPost } = useApp();

  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    trade: "Carpentry",
    location: "",
    wage: "",
    openings: "1",
    duration: "",
    description: "",
    urgency: "normal",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");

  const updateField = (field: keyof JobFormData, value: string) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!userProfile.uid || userRole !== "employer") {
      setError("Please sign in as an employer before posting a job.");
      return;
    }

    if (!formData.title.trim()) {
      setError("Please enter a job title.");
      return;
    }

    if (!formData.location.trim()) {
      setError("Please enter the work location.");
      return;
    }

    const wage = Number(formData.wage);
    const openings = Number(formData.openings);

    if (!Number.isFinite(wage) || wage <= 0) {
      setError("Please enter a valid daily wage greater than zero.");
      return;
    }

    if (!Number.isInteger(openings) || openings < 1 || openings > 50) {
      setError("The number of workers must be between 1 and 50.");
      return;
    }

    setIsSubmitting(true);

    try {
      await addJobPost({
        title: formData.title.trim(),
        trade: formData.trade,
        location: formData.location.trim(),
        wage,
        openings,
        duration: formData.duration.trim(),
        description: formData.description.trim(),
        urgency: formData.urgency,
      });

      navigate("/employer-dashboard", {
        replace: true,
      });
    } catch (caughtError) {
      console.error("Job posting failed:", caughtError);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not post the job. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout type="employer">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <button
            type="button"
            onClick={() => navigate("/employer-dashboard")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Employer Dashboard
          </button>

          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-[#15803D]" />

            <span>{t("postAJob", "Post a New Job Requirement")}</span>
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            Describe your requirement so suitable workers can discover it.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          {error && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Job title */}
            <div>
              <label
                htmlFor="job-title"
                className="block text-xs font-bold text-gray-700 mb-1.5"
              >
                Job Title <span className="text-rose-500">*</span>
              </label>

              <div className="relative">
                <Briefcase className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                <input
                  id="job-title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="e.g. Carpenter for modular kitchen fitting"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-[#15803D] focus:bg-white"
                />
              </div>
            </div>

            {/* Trade and openings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="job-trade"
                  className="block text-xs font-bold text-gray-700 mb-1.5"
                >
                  Worker Trade <span className="text-rose-500">*</span>
                </label>

                <select
                  id="job-trade"
                  value={formData.trade}
                  onChange={(event) => updateField("trade", event.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-[#15803D] focus:bg-white"
                >
                  <option value="Carpentry">Carpentry</option>

                  <option value="Electrical">Electrical</option>

                  <option value="Painting">Painting</option>

                  <option value="Masonry">Masonry</option>

                  <option value="Plumbing">Plumbing</option>

                  <option value="General Labour">
                    General Labour / Helper
                  </option>

                  <option value="Cleaning">Cleaning</option>

                  <option value="Event Helper">Event Helper</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="job-openings"
                  className="block text-xs font-bold text-gray-700 mb-1.5"
                >
                  Workers Needed
                </label>

                <div className="relative">
                  <Users className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                  <input
                    id="job-openings"
                    type="number"
                    min="1"
                    max="50"
                    step="1"
                    value={formData.openings}
                    onChange={(event) =>
                      updateField("openings", event.target.value)
                    }
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-[#15803D] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Wage and duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="job-wage"
                  className="block text-xs font-bold text-gray-700 mb-1.5"
                >
                  Daily Wage (₹) <span className="text-rose-500">*</span>
                </label>

                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                  <input
                    id="job-wage"
                    type="number"
                    min="1"
                    required
                    value={formData.wage}
                    onChange={(event) =>
                      updateField("wage", event.target.value)
                    }
                    placeholder="e.g. 850"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-[#15803D] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="job-duration"
                  className="block text-xs font-bold text-gray-700 mb-1.5"
                >
                  Work Duration
                </label>

                <div className="relative">
                  <Clock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                  <input
                    id="job-duration"
                    type="text"
                    value={formData.duration}
                    onChange={(event) =>
                      updateField("duration", event.target.value)
                    }
                    placeholder="e.g. 3 days"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-[#15803D] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="job-location"
                className="block text-xs font-bold text-gray-700 mb-1.5"
              >
                Work Location <span className="text-rose-500">*</span>
              </label>

              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                <input
                  id="job-location"
                  type="text"
                  required
                  value={formData.location}
                  onChange={(event) =>
                    updateField("location", event.target.value)
                  }
                  placeholder="e.g. Andheri West, Mumbai"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-[#15803D] focus:bg-white"
                />
              </div>

              <p className="text-xs text-gray-400 mt-1">
                Precise distance in kilometres requires map coordinates, which
                will be added in a later phase.
              </p>
            </div>

            {/* Urgency */}
            <fieldset>
              <legend className="block text-xs font-bold text-gray-700 mb-2">
                Urgency Level
              </legend>

              <div className="flex flex-wrap gap-5">
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="job-urgency"
                    value="normal"
                    checked={formData.urgency === "normal"}
                    onChange={() => updateField("urgency", "normal")}
                    className="accent-[#15803D]"
                  />
                  Normal
                </label>

                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="job-urgency"
                    value="emergency"
                    checked={formData.urgency === "emergency"}
                    onChange={() => updateField("urgency", "emergency")}
                    className="accent-[#15803D]"
                  />
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Emergency
                </label>
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Emergency status is saved with the job. Automatic alerts require
                a separate notification feature.
              </p>
            </fieldset>

            {/* Description */}
            <div>
              <label
                htmlFor="job-description"
                className="block text-xs font-bold text-gray-700 mb-1.5"
              >
                Work Details{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>

              <textarea
                id="job-description"
                rows={3}
                value={formData.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Mention tools needed and relevant work instructions."
                className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-[#15803D] focus:bg-white resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-[#15803D] hover:bg-[#166534] disabled:opacity-60 text-white font-bold text-base flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Publishing..." : "Publish Job Requirement"}

              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};
