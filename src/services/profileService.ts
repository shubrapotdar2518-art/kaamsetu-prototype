import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseClient";

export interface AvailableWorker {
  id: string;
  name: string;
  avatar?: string;
  trade: string;
  skills: string[];
  experience: number;
  location: string;
  address?: string;
  dailyRate: number;
  isAvailable: boolean;
  rating: number;
  totalJobs: number;
  bio?: string;
  languages?: string[];
  hasOwnTools?: boolean;
}

export async function createWorkerProfileDoc(
  uid: string,
  data: {
    primarySkill: string;
    skills: string[];
    experience: number;
    dailyRate: number;
    location: string;
    address: string;
  },
) {
  await setDoc(doc(db, "workers", uid), {
    userId: uid,
    skills: data.skills.map((s) => s.toLowerCase()),
    primarySkill: data.primarySkill,
    experience: data.experience,
    dailyRate: data.dailyRate,
    location: data.location,
    address: data.address,
    isAvailable: true,
    rating: 0,
    totalJobs: 0,
    bio: "",
    languages: [],
    hasOwnTools: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function createEmployerProfileDoc(
  uid: string,
  data: {
    companyName: string;
    contactPerson: string;
    location: string;
    address: string;
  },
) {
  await setDoc(doc(db, "employers", uid), {
    userId: uid,
    companyName: data.companyName,
    companyType: "",
    contactPerson: data.contactPerson,
    location: data.location,
    address: data.address,
    totalJobsPosted: 0,
    activeJobs: 0,
    rating: 0,
    verified: false,
    bio: "",
    gstNumber: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getWorkerProfileDoc(uid: string) {
  const snap = await getDoc(doc(db, "workers", uid));
  return snap.exists() ? (snap.data() as Record<string, any>) : null;
}

/**
 * Fetch registered workers who are available for work and have completed
 * their profile information. Incomplete or unsuitable accounts are excluded.
 */
export async function fetchAvailableWorkers(): Promise<AvailableWorker[]> {
  const q = query(
    collection(db, "workers"),
    where("isAvailable", "==", true),
  );
  const snap = await getDocs(q);
    // Fetch published ratings for all available workers in batches
  const workerIds = snap.docs.map((workerDoc) => workerDoc.id);
  const ratingTotals = new Map<string, { sum: number; count: number }>();

  for (let i = 0; i < workerIds.length; i += 30) {
    const batchIds = workerIds.slice(i, i + 30);

    const ratingsQuery = query(
      collection(db, "ratings"),
      where("revieweeId", "in", batchIds),
      where("status", "==", "published"),
    );

    const ratingsSnapshot = await getDocs(ratingsQuery);

    ratingsSnapshot.docs.forEach((ratingDoc) => {
      const data = ratingDoc.data();
      const revieweeId = data.revieweeId;
      const rating = Number(data.rating);

      if (!Number.isFinite(rating) || rating < 1 || rating > 5) return;

      const current = ratingTotals.get(revieweeId) || {
        sum: 0,
        count: 0,
      };

      current.sum += rating;
      current.count += 1;

      ratingTotals.set(revieweeId, current);
    });
  }

  const workerAverages = new Map<string, number>();

  ratingTotals.forEach((value, workerId) => {
    workerAverages.set(
      workerId,
      Math.round((value.sum / value.count) * 10) / 10,
    );
  });

  const results: AvailableWorker[] = [];

  for (const wDoc of snap.docs) {
    const w = wDoc.data();
    if (!w.isAvailable) continue;

    let name = "";
    let isActive = true;
    let userType = "worker";
    let avatar = "";

    try {
      const userSnap = await getDoc(doc(db, "users", wDoc.id));
      if (userSnap.exists()) {
        const u = userSnap.data();
        name = (u.name || "").trim();
        if (u.isActive === false) isActive = false;
        if (u.userType) userType = u.userType;
        if (u.avatar) avatar = u.avatar;
      }
    } catch (err) {
      console.warn("Could not fetch user info for worker:", wDoc.id, err);
    }

    // Exclude unsuitable accounts (e.g. inactive accounts, or admin accounts)
    if (!isActive || userType !== "worker") continue;

    // Must have completed profile: name, trade, location, positive wage
    if (!name) continue;

    const trade = (
      w.primarySkill ||
      (Array.isArray(w.skills) && w.skills.length > 0 ? w.skills[0] : "") ||
      ""
    ).trim();
    if (!trade) continue;

    const location = (w.location || w.address || "").trim();
    if (!location) continue;

    const dailyRate = Number(w.dailyRate) || 0;
    if (dailyRate <= 0) continue;

    const experience = Number(w.experience) || 0;
    const rawSkills = Array.isArray(w.skills) ? w.skills : [];
    const skills = rawSkills.filter(Boolean);

    results.push({
      id: wDoc.id,
      name,
      avatar: avatar || w.avatar || "",
      trade,
      skills,
      experience,
      location,
      address: w.address || "",
      dailyRate,
      isAvailable: true,
      rating: workerAverages.get(wDoc.id) ?? 0,
      totalJobs: Number(w.totalJobs) || 0,
      bio: w.bio || "",
      languages: Array.isArray(w.languages) ? w.languages : [],
      hasOwnTools: Boolean(w.hasOwnTools),
    });
  }

  return results.sort(
    (a, b) => b.rating - a.rating || b.experience - a.experience,
  );
}

