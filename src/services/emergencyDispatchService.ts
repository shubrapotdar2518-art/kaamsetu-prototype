import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  runTransaction,
  serverTimestamp,
  arrayUnion,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";

import { db } from "../firebase/firebaseClient";
import { createNotification } from "./notificationService";
import { evaluateProximity, Coordinates } from "../utils/geoUtils";
import { FirestoreJob, postJobDoc } from "./jobService";

export interface EligibleEmergencyWorker {
  id: string;
  name: string;
  phone?: string;
  trade: string;
  skills: string[];
  experience: number;
  dailyRate: number;
  location: string;
  address?: string;
  rating: number;
  totalJobs: number;
  distanceKm: number | null;
  distanceLabel: string;
  isCalculatedDistance: boolean;
  proximityRank: number;
}

export interface EmergencyJobCreateInput {
  employerId: string;
  employerName: string;
  title: string;
  trade: string;
  location: string;
  wage: number;
  openings?: number;
  duration?: string;
  description?: string;
  coordinates?: Coordinates | null;
}

export interface EmergencyDispatchResult {
  jobId: string;
  eligibleCount: number;
  dispatched: boolean;
  dispatchedWorker?: {
    id: string;
    name: string;
    distanceLabel: string;
  } | null;
  status: "dispatching" | "exhausted" | "error";
  message: string;
}

export function isTradeMatch(
  workerTrade: string,
  workerSkills: string[] = [],
  jobTrade: string,
): boolean {
  const norm = (s: string) =>
    (s || "")
      .toLowerCase()
      .replace(/[^\w\s\u0900-\u097F]/g, "")
      .trim();

  const j = norm(jobTrade);
  const wTrade = norm(workerTrade);
  const wSkills = workerSkills.map(norm);

  const TRADE_SYNONYMS: Record<string, string[]> = {
    carpentry: [
      "carpenter",
      "carpentry",
      "furniture",
      "woodwork",
      "बढ़ई",
      "सुतार",
    ],
    electrical: [
      "electrician",
      "electrical",
      "wiring",
      "power",
      "इलेक्ट्रीशियन",
      "बिजली",
    ],
    plumbing: [
      "plumber",
      "plumbing",
      "pipe",
      "leak",
      "प्लंबर",
      "नल",
    ],
    masonry: [
      "mason",
      "masonry",
      "brick",
      "construction",
      "राजमिस्त्री",
      "गवंडी",
    ],
    painting: [
      "painter",
      "painting",
      "paint",
      "रंगारी",
      "पेंटर",
    ],
    "general labour / helper": [
      "general labour / helper",
      "labour",
      "labor",
      "helper",
      "hamal",
      "cleaning",
      "loading",
      "मजदूर",
      "हेल्पर",
      "हमाल",
    ],
  };

  let targetSynonyms: string[] = [j];

  for (const [, syns] of Object.entries(TRADE_SYNONYMS)) {
    if (syns.some((syn) => j.includes(syn) || syn.includes(j))) {
      targetSynonyms = syns;
      break;
    }
  }

  const tradeMatches = targetSynonyms.some(
    (syn) => wTrade.includes(syn) || syn.includes(wTrade),
  );

  if (tradeMatches) return true;

  return wSkills.some((skill) =>
    targetSynonyms.some(
      (syn) => skill.includes(syn) || syn.includes(skill),
    ),
  );
}

/**
 * Fetches available workers matching trade and location.
 */
export async function fetchEligibleEmergencyWorkers(
  jobTrade: string,
  jobLocation: string,
  excludedWorkerIds: string[] = [],
  jobExplicitCoords?: Coordinates | null,
): Promise<EligibleEmergencyWorker[]> {
  const excludedSet = new Set(excludedWorkerIds);

  let snap;

  try {
    const q = query(
      collection(db, "workers"),
      where("isAvailable", "==", true),
    );

    snap = await getDocs(q);
  } catch (err) {
    console.error("fetchEligibleEmergencyWorkers query error:", err);

    throw new Error(
      "Unable to query available workers. Check Firestore read permissions.",
    );
  }

  const candidates: EligibleEmergencyWorker[] = [];

  for (const wDoc of snap.docs) {
    const workerId = wDoc.id;

    if (excludedSet.has(workerId)) continue;

    const wData = wDoc.data();

    if (wData.isAvailable !== true) continue;

    const workerTrade = (
      wData.primarySkill ||
      (Array.isArray(wData.skills) && wData.skills.length > 0
        ? wData.skills[0]
        : "") ||
      ""
    ).trim();

    const workerSkills = Array.isArray(wData.skills)
      ? wData.skills
      : [];

    if (!isTradeMatch(workerTrade, workerSkills, jobTrade)) {
      continue;
    }

    const dailyRate = Number(wData.dailyRate) || 0;

    if (dailyRate <= 0) continue;

    const locationText = (
      wData.location ||
      wData.address ||
      ""
    ).trim();

    if (!locationText) continue;

    let userName = "";
let userPhone = "";
let isActive = false;
let userType = "";

    try {
      const userSnap = await getDoc(
        doc(db, "users", workerId),
      );

      if (!userSnap.exists()) continue;

      const u = userSnap.data();

      userName = (u.name || "").trim();
      userPhone = u.phone || "";

      isActive = u.isActive !== false;
userType = u.userType || "";
    } catch (err) {
      console.warn(
        "Could not fetch user information:",
        workerId,
        err,
      );

      continue;
    }

    if (!isActive || userType !== "worker" || !userName) {
      continue;
    }

    const prox = evaluateProximity(
      jobLocation,
      locationText,
      wData.address,
      jobExplicitCoords,
      wData.coordinates || null,
    );

    candidates.push({
      id: workerId,
      name: userName,
      phone: userPhone,
      trade: workerTrade,
      skills: workerSkills,
      experience: Number(wData.experience) || 0,
      dailyRate,
      location: locationText,
      address: wData.address || "",
      rating: Number(wData.rating) || 0,
      totalJobs: Number(wData.totalJobs) || 0,
      distanceKm: prox.distanceKm,
      distanceLabel: prox.distanceLabel,
      isCalculatedDistance: prox.isCalculatedDistance,
      proximityRank: prox.proximityRank,
    });
  }
  
  console.table(
  candidates.map((worker) => ({
    id: worker.id,
    name: worker.name,
    trade: worker.trade,
    location: worker.location,
  })),
);

  return candidates.sort((a, b) => {
    if (a.proximityRank !== b.proximityRank) {
      return a.proximityRank - b.proximityRank;
    }

    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }

    return b.experience - a.experience;
  });
}

/**
 * Creates an emergency job and sends an offer to the nearest eligible worker.
 * Offers do not expire automatically.
 */
export async function createAndDispatchEmergencyJob(
  input: EmergencyJobCreateInput,
): Promise<EmergencyDispatchResult> {
  console.log("[Emergency Debug] Fetching eligible workers");

  const targetOpenings = Math.max(1, input.openings || 1);

  const eligibleWorkers = await fetchEligibleEmergencyWorkers(
    input.trade,
    input.location,
    [],
    input.coordinates,
  );

  const eligibleCount = eligibleWorkers.length;

  const firstWorker =
    eligibleWorkers.length > 0
      ? eligibleWorkers[0]
      : null;

  const emergencyStatus = firstWorker
    ? "dispatching"
    : "exhausted";

  const offeredWorkerIds = firstWorker
    ? [firstWorker.id]
    : [];

  console.log(
    "[Emergency Debug] Eligible workers:",
    eligibleCount,
  );

  const jobId = await postJobDoc({
    employerId: input.employerId,
    employerName: input.employerName,
    title: input.title.startsWith("🚨 EMERGENCY:")
      ? input.title
      : `🚨 EMERGENCY: ${input.title}`,
    trade: input.trade,
    location: input.location,
    wage: input.wage,
    openings: targetOpenings,
    duration: input.duration || "Immediate (Within 2 Hours)",
    description:
      input.description ||
      "Emergency hiring broadcast. Instant payout upon completion.",
    urgency: "emergency",
  });

  const jobRef = doc(db, "jobs", jobId);

  await updateDoc(jobRef, {
    employerId: input.employerId,
    emergencyStatus,
    currentWorkerId: firstWorker?.id || null,
    currentOfferExpiresAt: null,
    offeredWorkerIds,
    assignedWorkerIds: [],
    eligibleWorkersCount: eligibleCount,
    updatedAt: serverTimestamp(),
  });

  if (!firstWorker) {
    await createNotification(
      input.employerId,
      "emergency_dispatch_exhausted",
      "Emergency Hiring: No Available Workers",
      `No available workers found for "${input.title}" (${input.trade}) in ${input.location}. Please consider adjusting the trade or wage.`,
      jobId,
      null,
      "KaamSetu SOS",
    );

    return {
      jobId,
      eligibleCount: 0,
      dispatched: false,
      dispatchedWorker: null,
      status: "exhausted",
      message:
        "No available workers matching your criteria were found.",
    };
  }

  const appId = `${jobId}_${firstWorker.id}`;
  const appRef = doc(db, "applications", appId);

  await setDoc(appRef, {
    jobId,
    workerId: firstWorker.id,
    employerId: input.employerId,
    jobTitle: input.title,
    wage: input.wage,
    urgency: "emergency",
    expiresAt: null,
    status: "offered",
    appliedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await createNotification(
    firstWorker.id,
    "emergency_job_offer",
    `🚨 Emergency Job: ${input.title}`,
    `Urgent requirement for ${input.trade} at ${input.location}. Daily wage: ₹${input.wage}. Open the app to accept or reject this offer.`,
    jobId,
    input.employerId,
    input.employerName,
  );

  return {
    jobId,
    eligibleCount,
    dispatched: true,
    dispatchedWorker: {
      id: firstWorker.id,
      name: firstWorker.name,
      distanceLabel: firstWorker.distanceLabel,
    },
    status: "dispatching",
    message: `Emergency offer sent to ${firstWorker.name}.`,
  };
}

/**
 * Worker accepts an emergency job offer.
 * There is no expiry check.
 */
export async function acceptEmergencyJobOfferDoc(
  applicationId: string,
  workerId: string,
): Promise<{
  success: boolean;
  message: string;
  jobId: string;
}> {
  const appRef = doc(db, "applications", applicationId);

  const result = await runTransaction(db, async (tx) => {
    const appSnap = await tx.get(appRef);

    if (!appSnap.exists()) {
      throw new Error("Application record not found.");
    }

    const a = appSnap.data();

    if (a.workerId !== workerId) {
      throw new Error("This offer does not belong to you.");
    }

    if (a.status !== "offered") {
      throw new Error(
        "This offer is no longer pending or was already processed.",
      );
    }

    const jobId = a.jobId;
    const jobRef = doc(db, "jobs", jobId);
    const jobSnap = await tx.get(jobRef);

    if (!jobSnap.exists()) {
      throw new Error("Job not found.");
    }

    const j = jobSnap.data();

    const openings = Number(j.openings) || 1;
    const hired = Number(j.hiredCount) || 0;

    if (hired >= openings) {
      throw new Error(
        "All positions for this emergency job have already been filled.",
      );
    }

    const workerRef = doc(db, "workers", workerId);
    const workerSnap = await tx.get(workerRef);

    if (!workerSnap.exists()) {
      throw new Error("Worker profile not found.");
    }

    const w = workerSnap.data();

    if (w.isAvailable !== true) {
      throw new Error(
        "You are currently marked unavailable or busy.",
      );
    }

    const newHired = hired + 1;
    const isNowFilled = newHired >= openings;

    tx.update(appRef, {
      status: "in_progress",
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    tx.update(jobRef, {
      hiredCount: newHired,
      status: isNowFilled ? "filled" : "open",
      updatedAt: serverTimestamp(),
    });

    tx.update(workerRef, {
      isAvailable: false,
      updatedAt: serverTimestamp(),
    });

    return {
      jobId,
      employerId: a.employerId as string,
      jobTitle: a.jobTitle || "Emergency Job",
    };
  });

  let workerName = "A worker";

  try {
    const userSnap = await getDoc(
      doc(db, "users", workerId),
    );

    if (userSnap.exists()) {
      workerName = userSnap.data().name || workerName;
    }
  } catch (err) {
    console.warn("Could not fetch worker name:", err);
  }

  await createNotification(
    result.employerId,
    "offer_accepted",
    "Emergency Worker Assigned!",
    `${workerName} accepted your emergency job offer for "${result.jobTitle}". They are now assigned.`,
    result.jobId,
    workerId,
    workerName,
  );

  return {
    success: true,
    message: "Emergency job offer accepted! You are now assigned.",
    jobId: result.jobId,
  };
}

/**
 * Worker rejects an emergency job offer.
 * There is no expiry check.
 */
export async function rejectEmergencyJobOfferDoc(
  applicationId: string,
  workerId: string,
): Promise<{
  success: boolean;
  message: string;
}> {
  const appRef = doc(db, "applications", applicationId);

  const result = await runTransaction(db, async (tx) => {
    const appSnap = await tx.get(appRef);

    if (!appSnap.exists()) {
      throw new Error("Application not found.");
    }

    const a = appSnap.data();

    if (a.workerId !== workerId) {
      throw new Error("This offer does not belong to you.");
    }

    if (a.status !== "offered") {
      throw new Error("This offer is no longer pending.");
    }

    tx.update(appRef, {
      status: "offer_declined",
      declinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      jobId: a.jobId as string,
      employerId: a.employerId as string,
      jobTitle: a.jobTitle || "Emergency Job",
    };
  });

  await createNotification(
    result.employerId,
    "offer_rejected",
    "Emergency Offer Declined",
    `The worker declined your emergency job offer for "${result.jobTitle}".`,
    result.jobId,
    workerId,
    "Worker",
  );

  return {
    success: true,
    message: "Offer declined.",
  };
}

/**
 * Advances the emergency dispatch queue.
 *
 * This function must be called by an employer-authorized process.
 * It does not expire pending offers.
 */
export async function checkAndAdvanceEmergencyDispatch(
  jobId: string,
): Promise<{
  status: "dispatching" | "filled" | "exhausted" | "idle";
  dispatchedToWorkerId?: string;
  dispatchedToWorkerName?: string;
}> {
  const jobRef = doc(db, "jobs", jobId);

  const checkResult = await runTransaction(db, async (tx) => {
    const jobSnap = await tx.get(jobRef);

    if (!jobSnap.exists()) {
      return { action: "abort" as const };
    }

    const j = jobSnap.data();

    const openings = Number(j.openings) || 1;
    const hired = Number(j.hiredCount) || 0;

    if (
      j.status !== "open" ||
      hired >= openings ||
      j.urgency !== "emergency"
    ) {
      return {
        action: "abort" as const,
        status: "filled" as const,
      };
    }

    const currentWorkerId =
      (j.currentWorkerId as string | null) || null;

    // A pending offer remains active until accepted or rejected.
    if (currentWorkerId) {
      return {
        action: "wait" as const,
        status: "dispatching" as const,
      };
    }

    return {
      action: "dispatch_next" as const,
      job: j,
      offeredIds: (j.offeredWorkerIds || []) as string[],
      assignedIds: (j.assignedWorkerIds || []) as string[],
    };
  });

  if (checkResult.action === "abort") {
    return {
      status: checkResult.status || "idle",
    };
  }

  if (checkResult.action === "wait") {
    return { status: "dispatching" };
  }

  const job = checkResult.job;

  const excludedIds = [
    ...new Set([
      ...checkResult.offeredIds,
      ...checkResult.assignedIds,
    ]),
  ];

  const eligibleWorkers = await fetchEligibleEmergencyWorkers(
    job.trade,
    job.location,
    excludedIds,
  );

  if (eligibleWorkers.length === 0) {
    await updateDoc(jobRef, {
      emergencyStatus: "exhausted",
      currentWorkerId: null,
      currentOfferExpiresAt: null,
      updatedAt: serverTimestamp(),
    });

    await createNotification(
      job.employerId,
      "emergency_dispatch_exhausted",
      "Emergency Hiring: All Candidates Contacted",
      `All available workers for "${job.title}" have been contacted or no more workers are available in your area.`,
      jobId,
      null,
      "KaamSetu SOS",
    );

    return { status: "exhausted" };
  }

  const nextWorker = eligibleWorkers[0];

  const appId = `${jobId}_${nextWorker.id}`;
  const appRef = doc(db, "applications", appId);

  await runTransaction(db, async (tx) => {
    const jSnap = await tx.get(jobRef);

    if (!jSnap.exists()) return;

    const jData = jSnap.data();

    if (
      (jData.hiredCount ?? 0) >=
      (jData.openings ?? 1)
    ) {
      return;
    }

    tx.set(
      appRef,
      {
        jobId,
        workerId: nextWorker.id,
        employerId: job.employerId,
        jobTitle: job.title,
        wage: job.wage,
        urgency: "emergency",
        status: "offered",
        expiresAt: null,
        appliedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    tx.update(jobRef, {
      currentWorkerId: nextWorker.id,
      currentOfferExpiresAt: null,
      offeredWorkerIds: arrayUnion(nextWorker.id),
      emergencyStatus: "dispatching",
      updatedAt: serverTimestamp(),
    });
  });

  await createNotification(
    nextWorker.id,
    "emergency_job_offer",
    `🚨 Emergency Job: ${job.title}`,
    `Urgent requirement for ${job.trade} at ${job.location}. Daily wage: ₹${job.wage}. Open the app to accept or reject this offer.`,
    jobId,
    job.employerId,
    job.employerName || "Employer",
  );

  return {
    status: "dispatching",
    dispatchedToWorkerId: nextWorker.id,
    dispatchedToWorkerName: nextWorker.name,
  };
}

/**
 * Subscribes to real-time updates for an emergency job.
 */
export function subscribeToEmergencyJob(
  jobId: string,
  onUpdate: (
    job: FirestoreJob | null,
    currentWorkerInfo?: {
      id: string;
      name: string;
      expiresAt: number | null;
    } | null,
  ) => void,
): Unsubscribe {
  const jobRef = doc(db, "jobs", jobId);

  return onSnapshot(
    jobRef,
    async (snap) => {
      if (!snap.exists()) {
        onUpdate(null, null);
        return;
      }

      const job = {
        id: snap.id,
        ...snap.data(),
      } as FirestoreJob & {
        emergencyStatus?: string;
        currentWorkerId?: string | null;
        currentOfferExpiresAt?: number | null;
        assignedWorkerIds?: string[];
        offeredWorkerIds?: string[];
        eligibleWorkersCount?: number;
      };

      let workerInfo: {
        id: string;
        name: string;
        expiresAt: number | null;
      } | null = null;

      if (job.currentWorkerId) {
        try {
          const userSnap = await getDoc(
            doc(db, "users", job.currentWorkerId),
          );

          const name = userSnap.exists()
            ? userSnap.data().name || "Worker"
            : "Worker";

          workerInfo = {
            id: job.currentWorkerId,
            name,
            expiresAt: null,
          };
        } catch {
          workerInfo = {
            id: job.currentWorkerId,
            name: "Worker",
            expiresAt: null,
          };
        }
      }

      onUpdate(job, workerInfo);
    },
    (err) => {
      console.error(
        "subscribeToEmergencyJob listener error:",
        err,
      );
    },
  );
}