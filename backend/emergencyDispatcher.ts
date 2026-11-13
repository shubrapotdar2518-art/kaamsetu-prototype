/**
 * KaamSetu Emergency Dispatcher Service (Background Server Daemon)
 *
 * This background process ensures the 5-minute expiry and sequential worker dispatch
 * continues running automatically even if all browser tabs are closed.
 *
 * Run locally or on a server via:
 *   npm run dispatch-worker
 *
 * For Firebase Cloud Functions deployment, see backend/cloudFunction.js.
 */

import "dotenv/config";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

// Firebase initialization from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const CHECK_INTERVAL_MS = 10000; // Check every 10 seconds
const FIVE_MINUTES_SECONDS = 300;

console.log("=================================================");
console.log("🚀 KaamSetu Emergency Dispatcher Service Started");
console.log(`⏱ Polling interval: ${CHECK_INTERVAL_MS / 1000}s`);
console.log("=================================================");

/**
 * Normalizes text to check if a worker's trade or skills match the requested job trade.
 */
function isTradeMatch(
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
    carpentry: ["carpenter", "carpentry", "furniture", "woodwork", "बढ़ई", "सुतार"],
    electrical: ["electrician", "electrical", "wiring", "power", "इलेक्ट्रीशियन", "बिजली"],
    plumbing: ["plumber", "plumbing", "pipe", "leak", "प्लंबर", "नल"],
    masonry: ["mason", "masonry", "brick", "construction", "राजमिस्त्री", "गवंडी"],
    painting: ["painter", "painting", "paint", "रंगारी", "पेंटर"],
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
    targetSynonyms.some((syn) => skill.includes(syn) || syn.includes(skill)),
  );
}

/**
 * Creates notification document in Firestore
 */
async function sendNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  relatedId: string | null = null,
  expiresAtSeconds: number | null = null,
) {
  try {
    const notifRef = doc(collection(db, "notifications"));
    await runTransaction(db, async (tx) => {
      tx.set(notifRef, {
        userId,
        senderId: null,
        senderName: "KaamSetu Dispatcher",
        type,
        title,
        message,
        relatedId,
        isRead: false,
        isArchived: false,
        archivedAt: null,
        expiresAt: expiresAtSeconds ? { seconds: expiresAtSeconds } : null,
        createdAt: serverTimestamp(),
      });
    });
  } catch (err) {
    console.error("Failed to send notification:", err);
  }
}

/**
 * Scans for active emergency jobs and handles expired offers
 */
async function processEmergencyJobsCycle() {
  const nowSeconds = Math.floor(Date.now() / 1000);

  try {
    // Query active emergency jobs in dispatching state
    const jobsSnap = await getDocs(
      query(
        collection(db, "jobs"),
        where("urgency", "==", "emergency"),
        where("status", "==", "open"),
      ),
    );

    if (jobsSnap.empty) {
      return;
    }

    for (const jobDoc of jobsSnap.docs) {
      const job = jobDoc.data();
      const jobId = jobDoc.id;

      const openings = job.openings ?? 1;
      const hiredCount = job.hiredCount ?? 0;

      if (hiredCount >= openings) {
        continue;
      }

      const currentWorkerId = job.currentWorkerId as string | null;
      const expiresAt = job.currentOfferExpiresAt as number | null;

      // Check if current offer expired
      if (currentWorkerId && expiresAt && nowSeconds > expiresAt) {
        console.log(
          `⏱ [Dispatcher] Job ${jobId}: Offer to worker ${currentWorkerId} has expired (5-minute window passed).`,
        );

        // Transaction to expire the current offer
        const appRef = doc(db, "applications", `${jobId}_${currentWorkerId}`);
        const jobRef = doc(db, "jobs", jobId);

        await runTransaction(db, async (tx) => {
          const aSnap = await tx.get(appRef);
          if (aSnap.exists() && aSnap.data().status === "offered") {
            tx.update(appRef, {
              status: "expired",
              updatedAt: serverTimestamp(),
            });
          }

          tx.update(jobRef, {
            currentWorkerId: null,
            currentOfferExpiresAt: null,
            updatedAt: serverTimestamp(),
          });
        });

        // Advance to next worker
        await dispatchNextWorker(jobId, job);
      } else if (!currentWorkerId && hiredCount < openings) {
        // Needs worker dispatched
        await dispatchNextWorker(jobId, job);
      }
    }
  } catch (err) {
    console.error("❌ [Dispatcher] Error during cycle:", err);
  }
}

/**
 * Selects and dispatches offer to the next nearest eligible worker
 */
async function dispatchNextWorker(jobId: string, jobData: any) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const jobRef = doc(db, "jobs", jobId);

  // Exclude workers already offered or assigned
  const offeredIds = new Set([
    ...(jobData.offeredWorkerIds || []),
    ...(jobData.assignedWorkerIds || []),
  ]);

  // Query available workers
  const workersSnap = await getDocs(
    query(collection(db, "workers"), where("isAvailable", "==", true)),
  );

  const eligibleWorkerIds: string[] = [];

  for (const wDoc of workersSnap.docs) {
    const wId = wDoc.id;
    if (offeredIds.has(wId)) continue;

    const w = wDoc.data();
    if (!w.isAvailable) continue;

    const workerTrade = (
      w.primarySkill ||
      (Array.isArray(w.skills) && w.skills.length > 0 ? w.skills[0] : "") ||
      ""
    ).trim();

    if (!isTradeMatch(workerTrade, w.skills || [], jobData.trade)) {
      continue;
    }

    // Check conflicting active assignments
    const appsSnap = await getDocs(
      query(collection(db, "applications"), where("workerId", "==", wId)),
    );

    let hasConflict = false;
    for (const aDoc of appsSnap.docs) {
      const a = aDoc.data();
      if (["in_progress", "completion_requested"].includes(a.status)) {
        hasConflict = true;
        break;
      }
      if (a.status === "offered") {
        const exp = typeof a.expiresAt === "number" ? a.expiresAt : a.expiresAt?.seconds;
        if (exp && nowSeconds <= exp) {
          hasConflict = true;
          break;
        }
      }
    }

    if (hasConflict) continue;

    eligibleWorkerIds.push(wId);
  }

  if (eligibleWorkerIds.length === 0) {
    console.log(`⚠️ [Dispatcher] Job ${jobId}: No more eligible workers available. Marking exhausted.`);

    await updateDoc(jobRef, {
      emergencyStatus: "exhausted",
      currentWorkerId: null,
      currentOfferExpiresAt: null,
      updatedAt: serverTimestamp(),
    });

    await sendNotification(
      jobData.employerId,
      "emergency_dispatch_exhausted",
      "Emergency Hiring: All Candidates Contacted",
      `All available workers for "${jobData.title}" have been contacted or no more workers are available nearby.`,
      jobId,
    );
    return;
  }

  // Next worker selected (first eligible)
  const nextWorkerId = eligibleWorkerIds[0];
  const newExpiresAt = nowSeconds + FIVE_MINUTES_SECONDS;
  const appId = `${jobId}_${nextWorkerId}`;
  const appRef = doc(db, "applications", appId);

  await runTransaction(db, async (tx) => {
    const currentJobSnap = await tx.get(jobRef);
    if (!currentJobSnap.exists()) return;
    const j = currentJobSnap.data();
    if ((j.hiredCount ?? 0) >= (j.openings ?? 1)) return;

    tx.set(
      appRef,
      {
        jobId,
        workerId: nextWorkerId,
        employerId: jobData.employerId,
        jobTitle: jobData.title,
        wage: jobData.wage,
        urgency: "emergency",
        status: "offered",
        expiresAt: newExpiresAt,
        appliedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    tx.update(jobRef, {
      currentWorkerId: nextWorkerId,
      currentOfferExpiresAt: newExpiresAt,
      offeredWorkerIds: arrayUnion(nextWorkerId),
      emergencyStatus: "dispatching",
      updatedAt: serverTimestamp(),
    });
  });

  console.log(
    `📢 [Dispatcher] Job ${jobId}: Dispatched emergency offer to worker ${nextWorkerId}. Expires in 5 minutes.`,
  );

  await sendNotification(
    nextWorkerId,
    "emergency_job_offer",
    `🚨 Emergency Job: ${jobData.title}`,
    `Urgent requirement for ${jobData.trade} at ${jobData.location}. Daily wage: ₹${jobData.wage}. You have exactly 5 minutes to respond.`,
    jobId,
    newExpiresAt,
  );
}

// Main execution loop
setInterval(processEmergencyJobsCycle, CHECK_INTERVAL_MS);
processEmergencyJobsCycle();
