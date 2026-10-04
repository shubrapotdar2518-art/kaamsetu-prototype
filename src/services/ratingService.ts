// src/services/ratingService.ts
// Handles submitting and reading ratings/reviews after a job is completed.

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseClient";
import { createNotification } from "./notificationService";

export interface FirestoreRating {
  id: string;
  jobId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  status: string;
  createdAt?: { seconds: number } | null;
}

/**
 * Submit a 1–5 star rating for someone, tied to a specific job.
 * Document ID = jobId_reviewerId, so each person can only rate once per job.
 *
 * revieweeName / revieweeIsWorker are used to update that person's
 * average rating stored on their profile (workers/{uid} or employers/{uid}).
 */
export async function submitRating(
  jobId: string,
  reviewerId: string,
  revieweeId: string,
  revieweeIsWorker: boolean,
  rating: number,
  comment = "",
  jobTitle = "a job",
): Promise<void> {
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  const ratingId = `${jobId}_${reviewerId}`;
  const existing = await getDoc(doc(db, "ratings", ratingId));
  if (existing.exists()) {
    throw new Error("You have already rated this job.");
  }

  await setDoc(doc(db, "ratings", ratingId), {
    jobId,
    reviewerId,
    revieweeId,
    rating,
    comment,
    status: "published",
    createdAt: serverTimestamp(),
  });

  // Recalculate and store the reviewee's average rating
  const newAverage = await calculateAverageRating(revieweeId);
  const collectionName = revieweeIsWorker ? "workers" : "employers";
  const profileSnap = await getDoc(doc(db, collectionName, revieweeId));
  const totalJobsField = revieweeIsWorker ? "totalJobs" : "totalJobsPosted";
  const currentTotal = profileSnap.exists()
    ? ((profileSnap.data() as any)[totalJobsField] ?? 0)
    : 0;

  await updateDoc(doc(db, collectionName, revieweeId), {
    rating: newAverage,
    [totalJobsField]: currentTotal + 1,
    updatedAt: serverTimestamp(),
  });

  // 🔔 Let the reviewee know they got rated
  await createNotification(
    revieweeId,
    "job_completed",
    "You received a rating",
    `You were rated ${rating}/5 for "${jobTitle}".`,
    jobId,
  );
}

/**
 * Get all published ratings for a user (worker or employer).
 */
export async function getRatingsForUser(
  userId: string,
): Promise<FirestoreRating[]> {
  const q = query(
    collection(db, "ratings"),
    where("revieweeId", "==", userId),
    where("status", "==", "published"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<FirestoreRating, "id">),
  }));
}

/**
 * Compute a user's average rating (0 if they have none yet).
 */
export async function calculateAverageRating(userId: string): Promise<number> {
  const ratings = await getRatingsForUser(userId);
  if (ratings.length === 0) return 0;
  const total = ratings.reduce((sum, r) => sum + r.rating, 0);
  return Math.round((total / ratings.length) * 10) / 10;
}

/**
 * Check if the current user has already rated a specific job,
 * so the UI can hide the "Rate" button after they've done it once.
 */
export async function hasRatedJob(
  jobId: string,
  reviewerId: string,
): Promise<boolean> {
  const snap = await getDoc(doc(db, "ratings", `${jobId}_${reviewerId}`));
  return snap.exists();
}
