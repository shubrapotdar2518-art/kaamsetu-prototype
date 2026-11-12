// src/services/ratingService.ts
// Handles submitting and reading ratings/reviews after a job is completed.

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
    runTransaction,
  collection,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseClient";
import { createNotification } from "./notificationService";

export interface WorkerRatingCategories {
  workQuality: number;
  punctuality: number;
  skills: number;
}

export interface EmployerRatingCategories {
  employerBehaviour: number;
  communication: number;
  paymentExperience: number;
}

export interface FirestoreRating {
  id: string;
  jobId: string;
  reviewerId: string;
  revieweeId: string;
  reviewerName?: string;
  rating: number;
  categories?: WorkerRatingCategories | EmployerRatingCategories | null;
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
  categories?: WorkerRatingCategories | EmployerRatingCategories | null,
  customReviewerName?: string,
): Promise<void> {
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  // 1. Enforce that only participants can rate and only after payment is confirmed
  const workerId = revieweeIsWorker ? revieweeId : reviewerId;
  const employerId = revieweeIsWorker ? reviewerId : revieweeId;
  const applicationId = `${jobId}_${workerId}`;

    const appSnap = await getDoc(doc(db, "applications", applicationId));

  // A valid application must exist.
  if (!appSnap.exists()) {
    throw new Error("No valid job application found for this rating.");
  }

  const appData = appSnap.data();

  // Only the actual employer and worker can rate each other.
  if (appData.workerId !== workerId || appData.employerId !== employerId) {
    throw new Error("You are not authorized to rate this job.");
  }

  // Reviews are allowed only after job completion and payment.
  if (appData.status !== "completed" || appData.paymentStatus !== "paid") {
    throw new Error("Reviews are only unlocked after job completion and payment.");
  }

  // Prevent duplicate reviews in the same direction.
  if (revieweeIsWorker && appData.employerReviewSubmitted) {
    throw new Error("You have already submitted a review for this worker.");
  }

  if (!revieweeIsWorker && appData.workerReviewSubmitted) {
    throw new Error("You have already submitted a review for this employer.");
  }

    const ratingId = `${jobId}_${reviewerId}_${revieweeId}`;
  const ratingRef = doc(db, "ratings", ratingId);
  const legacyRatingRef = doc(db, "ratings", `${jobId}_${reviewerId}`);
  const applicationRef = doc(db, "applications", applicationId);

  let reviewerName = customReviewerName;

  if (!reviewerName) {
    try {
      const reviewerSnap = await getDoc(doc(db, "users", reviewerId));
      reviewerName = reviewerSnap.exists()
        ? reviewerSnap.data().name ?? "A user"
        : "A user";
    } catch {
      reviewerName = "A user";
    }
  }

  const finalReviewerName = reviewerName || "A user";

  await runTransaction(db, async (transaction) => {
    const currentApp = await transaction.get(applicationRef);
    const existingRating = await transaction.get(ratingRef);
    const existingLegacyRating = await transaction.get(legacyRatingRef);

    if (!currentApp.exists()) {
      throw new Error("No valid job application found.");
    }

    if (existingRating.exists() || existingLegacyRating.exists()) {
      throw new Error("You have already rated this job.");
    }

    const currentData = currentApp.data();

    if (
      currentData.workerId !== workerId ||
      currentData.employerId !== employerId
    ) {
      throw new Error("You are not authorized to rate this job.");
    }

    if (
      currentData.status !== "completed" ||
      currentData.paymentStatus !== "paid"
    ) {
      throw new Error("Reviews require a completed and paid job.");
    }

    const reviewFlag = revieweeIsWorker
      ? "employerReviewSubmitted"
      : "workerReviewSubmitted";

    if (currentData[reviewFlag]) {
      throw new Error("You have already submitted this review.");
    }

    transaction.set(ratingRef, {
      jobId,
      workerId,
      employerId,
      reviewerId,
      revieweeId,
      reviewerName: finalReviewerName,
      rating,
      categories: categories || null,
      comment,
      status: "published",
      createdAt: serverTimestamp(),
    });

    transaction.update(applicationRef, {
      [reviewFlag]: true,
      updatedAt: serverTimestamp(),
    });
  });

    // 🔔 Let the reviewee know they got rated
  await createNotification(
    revieweeId,
    "rating_received",
    "You received a rating",
    `${reviewerName} rated you ${rating}/5 for "${jobTitle}".`,
    jobId,
    reviewerId,
    reviewerName,
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
  revieweeId?: string,
): Promise<boolean> {
  if (revieweeId) {
    const snap = await getDoc(
      doc(db, "ratings", `${jobId}_${reviewerId}_${revieweeId}`),
    );
    if (snap.exists()) return true;
  }
  const snapLegacy = await getDoc(
    doc(db, "ratings", `${jobId}_${reviewerId}`),
  );
  return snapLegacy.exists();
}
