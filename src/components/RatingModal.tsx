import React, { useState } from "react";
import { Star, X, CheckCircle2, MessageSquare, ShieldCheck } from "lucide-react";
import {
  submitRating,
  type WorkerRatingCategories,
  type EmployerRatingCategories,
} from "../services/ratingService";
import { useApp } from "../context/AppContext";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  revieweeId: string;
  revieweeName: string;
  revieweeIsWorker: boolean;
  reviewerId: string;
  onRatingSubmitted?: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  revieweeId,
  revieweeName,
  revieweeIsWorker,
  reviewerId,
  onRatingSubmitted,
}) => {
  const { showToast } = useApp();

  const [overallRating, setOverallRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Specific criteria ratings (1 to 5)
  // Worker criteria:
  const [workQuality, setWorkQuality] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [skills, setSkills] = useState(5);

  // Employer criteria:
  const [employerBehaviour, setEmployerBehaviour] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [paymentExperience, setPaymentExperience] = useState(5);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (overallRating < 1 || overallRating > 5) {
      showToast("Please select an overall rating.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const categories: WorkerRatingCategories | EmployerRatingCategories =
        revieweeIsWorker
          ? {
              workQuality,
              punctuality,
              skills,
            }
          : {
              employerBehaviour,
              communication,
              paymentExperience,
            };

      await submitRating(
        jobId,
        reviewerId,
        revieweeId,
        revieweeIsWorker,
        overallRating,
        comment.trim(),
        jobTitle,
        categories,
      );

      showToast("Thank you! Your review has been published.");
      if (onRatingSubmitted) onRatingSubmitted();
      onClose();
    } catch (err) {
      console.error("Failed to submit rating:", err);
      showToast(
        err instanceof Error ? err.message : "Failed to submit review.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarPicker = (
    label: string,
    value: number,
    onChange: (val: number) => void,
    subtitle?: string,
  ) => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 py-2 border-b border-gray-100 last:border-0">
        <div>
          <span className="text-xs font-bold text-gray-800">{label}</span>
          {subtitle && (
            <p className="text-[10px] text-gray-400 font-medium">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="p-1 hover:scale-110 transition-transform cursor-pointer"
            >
              <Star
                className={`w-5 h-5 ${
                  star <= value
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-200 hover:text-amber-200"
                }`}
              />
            </button>
          ))}
          <span className="text-xs font-extrabold text-gray-700 ml-1.5 w-4 text-center">
            {value}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              Verified Mutual Review
            </span>
            <h3 className="text-lg font-extrabold text-gray-900 mt-0.5">
              Rate {revieweeName}
            </h3>
            <p className="text-xs text-gray-500 truncate max-w-xs">{jobTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Overall Rating Highlight Box */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-center">
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Overall Performance Rating
            </label>
            <div className="flex items-center justify-center gap-2 my-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setOverallRating(star)}
                  className="p-1.5 hover:scale-125 transition-transform cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= overallRating
                        ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                        : "text-gray-300 hover:text-amber-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-amber-800">
              {overallRating === 5 && "⭐ Excellent - Exceeded Expectations"}
              {overallRating === 4 && "⭐ Very Good - Highly Recommended"}
              {overallRating === 3 && "⭐ Good - Met Requirements"}
              {overallRating === 2 && "⭐ Fair - Needs Improvement"}
              {overallRating === 1 && "⭐ Poor - Unsatisfactory"}
            </span>
          </div>

          {/* Granular Criteria Breakdown */}
          <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-1">
            <h4 className="text-xs font-extrabold text-gray-900 mb-2">
              Detailed Assessment
            </h4>

            {revieweeIsWorker ? (
              <>
                {renderStarPicker(
                  "Work Quality",
                  workQuality,
                  setWorkQuality,
                  "Craftsmanship, neatness, precision",
                )}
                {renderStarPicker(
                  "Punctuality",
                  punctuality,
                  setPunctuality,
                  "On-time arrival and timely finish",
                )}
                {renderStarPicker(
                  "Skills & Tools",
                  skills,
                  setSkills,
                  "Proficiency in trade & tool usage",
                )}
              </>
            ) : (
              <>
                {renderStarPicker(
                  "Employer Behaviour",
                  employerBehaviour,
                  setEmployerBehaviour,
                  "Professionalism and respect on site",
                )}
                {renderStarPicker(
                  "Communication",
                  communication,
                  setCommunication,
                  "Clear job expectations & location guidance",
                )}
                {renderStarPicker(
                  "Payment Experience",
                  paymentExperience,
                  setPaymentExperience,
                  "Prompt and agreed wage payout",
                )}
              </>
            )}
          </div>

          {/* Written Feedback Textarea */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
              <span>Written Review (Optional)</span>
              <span className="text-[10px] text-gray-400">Public profile feedback</span>
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Share details about your experience working with ${revieweeName}...`}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs sm:text-sm outline-none focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] transition-all resize-none shadow-2xs"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] disabled:opacity-50 text-white text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? "Publishing..." : "Submit Review"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
