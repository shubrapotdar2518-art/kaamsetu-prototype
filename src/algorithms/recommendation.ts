/**
 * KaamSetu content-based weighted scoring.
 * Normal:    Skill 0.40 + Location 0.20 + Availability 0.20 + Rating 0.20
 * Emergency: Skill 0.30 + Location 0.30 + Availability 0.30 + Rating 0.10
 * Every component is normalised to 0–1. Result is a 0–100 percentage.
 */
export interface WorkerForMatch {
  primarySkill: string;
  skills: string[];
  location: string;
  isAvailable: boolean;
  rating: number;
  totalJobs: number;
}
export interface JobForMatch {
  trade: string;
  location: string;
  urgency: "normal" | "emergency";
}

const NORMAL = { skill: 0.4, location: 0.2, availability: 0.2, rating: 0.2 };
const EMERGENCY = { skill: 0.3, location: 0.3, availability: 0.3, rating: 0.1 };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

export function skillScore(w: WorkerForMatch, j: JobForMatch): number {
  const t = norm(j.trade);
  if (
    norm(w.primarySkill) === t ||
    norm(w.primarySkill).includes(t) ||
    t.includes(norm(w.primarySkill))
  )
    return 1.0;
  if (w.skills.some((s) => norm(s).includes(t) || t.includes(norm(s))))
    return 0.5;
  return 0.0;
}

export function locationScore(w: WorkerForMatch, j: JobForMatch): number {
  const a = w.location.toLowerCase(),
    b = j.location.toLowerCase();
  if (!a || !b) return 0.5;
  if (a === b) return 1.0;
  // same city keyword (e.g. both contain "mumbai")
  const shared = a
    .split(/[ ,]+/)
    .some((word) => word.length > 3 && b.includes(word));
  return shared ? 0.8 : 0.3;
}

export const availabilityScore = (w: WorkerForMatch) =>
  w.isAvailable ? 1.0 : 0.0;

// Neutral 0.6 for new workers avoids the cold-start penalty
export const ratingScore = (w: WorkerForMatch) =>
  w.totalJobs === 0 ? 0.6 : w.rating / 5;

export function computeMatchScore(w: WorkerForMatch, j: JobForMatch): number {
  const wt = j.urgency === "emergency" ? EMERGENCY : NORMAL;
  const score =
    wt.skill * skillScore(w, j) +
    wt.location * locationScore(w, j) +
    wt.availability * availabilityScore(w) +
    wt.rating * ratingScore(w);
  return Math.round(score * 100);
}
