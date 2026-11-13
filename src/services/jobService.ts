import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase/firebaseClient";
import { createNotification } from "./notificationService";

export interface FirestoreJob {
  id: string;
  employerId: string;
  employerName: string;
  title: string;
  trade: string;
  location: string;
  wage: number;
  openings: number;
  duration: string;
  description: string;
  urgency: "normal" | "emergency";
  status: string;
  postedAt?: { seconds: number } | null;
  hiredCount?: number;
  applicantsCount?: number;
}

export async function postJobDoc(
  data: Omit<FirestoreJob, "id" | "status" | "postedAt">,
) {
  const ref = await addDoc(collection(db, "jobs"), {
    ...data,
    status: "open", // required by security rules
    applicantsCount: 0,
    hiredCount: 0,
    postedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

function toJob(d: any): FirestoreJob {
  return { id: d.id, ...(d.data() as Omit<FirestoreJob, "id">) };
}

// Sorted in JS to avoid needing a Firestore composite index
export async function fetchOpenJobs(): Promise<FirestoreJob[]> {
  const snap = await getDocs(
    query(collection(db, "jobs"), where("status", "==", "open")),
  )
  console.table(
  snap.docs.map((d) => ({
    jobId: d.id,
    employerId: d.data().employerId,
    employerName: d.data().employerName,
  })),
);

  const jobs = snap.docs
    .map(toJob)
    .filter((j) => (j.hiredCount ?? 0) < (j.openings ?? 1));

  const validJobs = await Promise.all(
    jobs.map(async (job) => {
      if (!job.employerId) return null;

      const employerSnap = await getDoc(
        doc(db, "users", job.employerId),
      );

      if (!employerSnap.exists()) return null;

      const employerData = employerSnap.data();

      if (employerData.userType !== "employer") return null;

if (employerData.isActive === false) return null;

return job;
    }),
  );

  return validJobs
    .filter((job): job is FirestoreJob => job !== null)
    .sort(
      (a, b) =>
        (b.postedAt?.seconds ?? 0) - (a.postedAt?.seconds ?? 0),
    );
}

export async function fetchEmployerJobs(
  employerId: string,
): Promise<FirestoreJob[]> {
  const snap = await getDocs(
    query(collection(db, "jobs"), where("employerId", "==", employerId)),
  );
  return snap.docs
    .map(toJob)
    .sort((a, b) => (b.postedAt?.seconds ?? 0) - (a.postedAt?.seconds ?? 0));
}

// Document ID = jobId_workerId → duplicate applications are impossible
export async function applyToJobDoc(
  jobId: string,
  workerId: string,
  employerId: string,
  jobTitle: string,
) {
  // Disallow manual applications to emergency jobs (they are system-dispatched one by one)
  const jobSnap = await getDoc(doc(db, "jobs", jobId));
  if (jobSnap.exists() && jobSnap.data().urgency === "emergency") {
    throw new Error(
      "Emergency jobs are dispatched automatically to available workers nearby. Manual applications are not accepted.",
    );
  }

  const id = `${jobId}_${workerId}`;
  const existing = await getDoc(doc(db, "applications", id));
  if (existing.exists())
    throw new Error("You have already applied for this job.");
  await setDoc(doc(db, "applications", id), {
    jobId,
    workerId,
    employerId,
    jobTitle,
    message: "",
    status: "pending", // required by security rules
    appliedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

    // 🔔 Notify the employer that someone applied
  const workerSnap = await getDoc(doc(db, "users", workerId));
  const workerName = workerSnap.exists()
    ? workerSnap.data().name ?? "A worker"
    : "A worker";

  await createNotification(
    employerId,
    "application_received",
    "New application received",
    `${workerName} applied for "${jobTitle}".`,
    jobId,
    workerId,
    workerName,
  );
}

export async function fetchMyAppliedJobIds(
  workerId: string,
): Promise<string[]> {
  const snap = await getDocs(
    query(collection(db, "applications"), where("workerId", "==", workerId)),
  );
  return snap.docs.map((d) => d.data().jobId as string);
}

export async function fetchWorkerCompletedJobIds(
  workerId: string,
): Promise<string[]> {
  try {
    const snap = await getDocs(
      query(
        collection(db, "applications"),
        where("workerId", "==", workerId),
        where("status", "==", "completed"),
      ),
    );
    return snap.docs
      .filter((d) => d.data().paymentStatus === "paid")
      .map((d) => d.data().jobId as string);
  } catch (err) {
    console.error("fetchWorkerCompletedJobIds error:", err);
    return [];
  }
}

export interface WorkerAppliedJobItem {
  id: string;
  jobId: string;
  employerId: string;
  jobTitle: string;
  employerName: string;
  location: string;
  wage: number;
  status: string;
  appliedAt?: { seconds: number } | null;
  trade?: string;
  description?: string;
  completionOtpExpiry?: { seconds: number } | number | null;
  completionAttempts?: number;
  paymentStatus?: "pending" | "paid" | null;
  paymentMethod?: "qr_demo" | "cash" | null;
  completionRequestedAt?: { seconds: number } | null;
  completionVerifiedAt?: { seconds: number } | null;
  paymentConfirmedAt?: { seconds: number } | null;
  workerReviewSubmitted?: boolean;
  employerReviewSubmitted?: boolean;
}

export async function fetchWorkerApplications(
  workerId: string,
): Promise<WorkerAppliedJobItem[]> {
  const snap = await getDocs(
    query(collection(db, "applications"), where("workerId", "==", workerId)),
  );

  const results: WorkerAppliedJobItem[] = [];

  for (const d of snap.docs) {
    const a = d.data();
    let employerName = "Employer";
    let location = "Location not specified";
    let wage = 0;
    let trade = "";
    let description = "";
    let jobTitle = a.jobTitle || "Job";

    try {
      const jobSnap = await getDoc(doc(db, "jobs", a.jobId));
      if (jobSnap.exists()) {
        const j = jobSnap.data();
        jobTitle = j.title || jobTitle;
        employerName = j.employerName || employerName;
        location = j.location || location;
        wage = j.wage || 0;
        trade = j.trade || "";
        description = j.description || "";
      }
    } catch (err) {
      console.warn("Could not fetch job details for application:", a.jobId, err);
    }

    if (employerName === "Employer" && a.employerId) {
      try {
        const userSnap = await getDoc(doc(db, "users", a.employerId));
        if (userSnap.exists()) {
          employerName = userSnap.data().name || employerName;
        }
      } catch {
        // fallback ok
      }
    }

    results.push({
      id: d.id,
      jobId: a.jobId,
      employerId: a.employerId,
      jobTitle,
      employerName,
      location,
      wage,
      status: a.status || "pending",
      appliedAt: a.appliedAt ?? null,
      trade,
      description,
      completionOtpExpiry: a.completionOtpExpiry ?? null,
      completionAttempts: a.completionAttempts ?? 0,
      paymentStatus: a.paymentStatus ?? null,
      paymentMethod: a.paymentMethod ?? null,
      completionRequestedAt: a.completionRequestedAt ?? null,
      completionVerifiedAt: a.completionVerifiedAt ?? null,
      paymentConfirmedAt: a.paymentConfirmedAt ?? null,
      workerReviewSubmitted: !!a.workerReviewSubmitted,
      employerReviewSubmitted: !!a.employerReviewSubmitted,
    });
  }

  return results.sort(
    (a, b) => (b.appliedAt?.seconds ?? 0) - (a.appliedAt?.seconds ?? 0),
  );
}

export interface FirestoreApplication {
  id: string;
  jobId: string;
  workerId: string;
  employerId: string;
  jobTitle: string;
  status: string;
  appliedAt?: { seconds: number } | null;
  workerName: string;
  workerPhone: string;
  workerLocation: string;
  workerTrade: string;
  workerExperience: number;
  wage?: number;
  completionOtp?: string;
  completionOtpExpiry?: { seconds: number } | number | null;
  completionAttempts?: number;
  paymentStatus?: "pending" | "paid" | null;
  paymentMethod?: "qr_demo" | "cash" | null;
  completionRequestedAt?: { seconds: number } | null;
  completionVerifiedAt?: { seconds: number } | null;
  paymentConfirmedAt?: { seconds: number } | null;
  workerReviewSubmitted?: boolean;
  employerReviewSubmitted?: boolean;
}

export async function fetchEmployerApplications(
  employerId: string,
): Promise<FirestoreApplication[]> {
  const snap = await getDocs(
    query(
      collection(db, "applications"),
      where("employerId", "==", employerId),
    ),
  );
  const results: FirestoreApplication[] = [];
  for (const d of snap.docs) {
    const a = d.data();
    if (!a.workerId) continue;

    let u: any = {};
    let w: any = {};
    try {
      const [userSnap, workerSnap] = await Promise.all([
        getDoc(doc(db, "users", a.workerId)).catch(() => null),
        getDoc(doc(db, "workers", a.workerId)).catch(() => null),
      ]);
      if (userSnap && userSnap.exists()) u = userSnap.data();
      if (workerSnap && workerSnap.exists()) w = workerSnap.data();
    } catch {
      // safe fallback
    }

    let wage = 0;
    try {
      const jobSnap = await getDoc(doc(db, "jobs", a.jobId));
      if (jobSnap.exists()) {
        wage = jobSnap.data().wage || 0;
      }
    } catch {
      // fallback
    }

    results.push({
      id: d.id,
      jobId: a.jobId,
      workerId: a.workerId,
      employerId: a.employerId,
      jobTitle: a.jobTitle ?? "",
      status: a.status,
      appliedAt: a.appliedAt ?? null,
      workerName: u.name ?? "Worker",
      workerPhone: u.phone ?? "",
      workerLocation: u.location ?? "",
      workerTrade: w.primarySkill ?? "",
      workerExperience: w.experience ?? 0,
      wage,
      completionOtp: a.completionOtp ?? "",
      completionOtpExpiry: a.completionOtpExpiry ?? null,
      completionAttempts: a.completionAttempts ?? 0,
      paymentStatus: a.paymentStatus ?? null,
      paymentMethod: a.paymentMethod ?? null,
      completionRequestedAt: a.completionRequestedAt ?? null,
      completionVerifiedAt: a.completionVerifiedAt ?? null,
      paymentConfirmedAt: a.paymentConfirmedAt ?? null,
      workerReviewSubmitted: !!a.workerReviewSubmitted,
      employerReviewSubmitted: !!a.employerReviewSubmitted,
    });
  }
  return results.sort(
    (a, b) => (b.appliedAt?.seconds ?? 0) - (a.appliedAt?.seconds ?? 0),
  );
}

export async function updateApplicationStatusDoc(
  applicationId: string,
  status: string,
) {
  await updateDoc(doc(db, "applications", applicationId), {
    status,
    updatedAt: serverTimestamp(),
  });

  // 🔔 Notify the worker that their application status changed
  const appSnap = await getDoc(doc(db, "applications", applicationId));
  if (appSnap.exists()) {
    const a = appSnap.data();
    const friendlyStatus: Record<string, string> = {
      accepted: "accepted",
      rejected: "rejected",
      in_progress: "marked as in progress",
      completed: "marked as completed",
    };
    const label = friendlyStatus[status];
    if (label) {
            const employerSnap = await getDoc(doc(db, "users", a.employerId));
      const employerName = employerSnap.exists()
        ? employerSnap.data().name ?? "Employer"
        : "Employer";

      await createNotification(
        a.workerId,
        status === "accepted"
          ? "application_accepted"
          : status === "rejected"
            ? "application_rejected"
            : "job_completed",
        "Application update",
        `${employerName}: Your application for "${a.jobTitle}" was ${label}.`,
        a.jobId,
        a.employerId,
        employerName,
      );
        }
  }
}

// Employer sends a job offer to a worker who applied.
// The worker must accept it before they count as hired.
export async function sendJobOfferDoc(
  applicationId: string,
  employerId: string,
) {
  const appRef = doc(db, "applications", applicationId);
  const appSnap = await getDoc(appRef);
  if (!appSnap.exists()) throw new Error("Application not found.");

  const a = appSnap.data();
  if (a.employerId !== employerId) {
    throw new Error("You can only send offers for your own jobs.");
  }
  if (["offered", "in_progress", "completed"].includes(a.status)) {
    throw new Error("An offer was already sent to this worker.");
  }

  const jobSnap = await getDoc(doc(db, "jobs", a.jobId));
  if (!jobSnap.exists()) throw new Error("Job not found.");

  const j = jobSnap.data();
  if (j.status !== "open" || (j.hiredCount ?? 0) >= (j.openings ?? 1)) {
    throw new Error("All positions for this job are already filled.");
  }

  await updateDoc(appRef, {
    status: "offered",
    updatedAt: serverTimestamp(),
  });

  // 🔔 Notify the worker about the offer (Accept / Reject shown in the Navbar)
  const employerName = j.employerName ?? "An employer";

  await createNotification(
    a.workerId,
    "job_offer",
    "You have a job offer!",
    `${employerName} offered you the job "${a.jobTitle}".`,
    a.jobId,
    employerId,
    employerName,
  );
}

/**
 * Employer sends a direct job offer to a worker for one of their open jobs,
 * even if the worker has NOT previously applied.
 * Creates/updates the application document (id: {jobId}_{workerId}) with status "offered",
 * prevents duplicate active offers, and notifies the worker.
 */
export async function sendDirectJobOfferDoc(
  jobId: string,
  workerId: string,
  employerId: string,
): Promise<{ applicationId: string; jobTitle: string }> {
  // 1. Verify job exists and belongs to this employer
  const jobRef = doc(db, "jobs", jobId);
  const jobSnap = await getDoc(jobRef);
  if (!jobSnap.exists()) throw new Error("Job not found.");

  const j = jobSnap.data() as any;
  if (j.employerId !== employerId) {
    throw new Error("You can only send offers for your own jobs.");
  }
  if (j.status !== "open" || (j.hiredCount ?? 0) >= (j.openings ?? 1)) {
    throw new Error("All positions for this job are already filled.");
  }

  // 2. Application document ID is {jobId}_{workerId}
  const applicationId = `${jobId}_${workerId}`;
  const appRef = doc(db, "applications", applicationId);
  const appSnap = await getDoc(appRef);

  if (appSnap.exists()) {
    const a = appSnap.data();
    if (["offered", "in_progress", "completed", "accepted"].includes(a.status)) {
      throw new Error("An active offer or job already exists for this worker.");
    }
    // If previously rejected or declined, reset to offered
    await updateDoc(appRef, {
      status: "offered",
      updatedAt: serverTimestamp(),
    });
  } else {
    // Create new application record with status 'offered'
    await setDoc(appRef, {
      jobId,
      workerId,
      employerId,
      jobTitle: j.title || "Job Offer",
      message: "Direct job offer from employer",
      status: "offered",
      appliedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // 3. 🔔 Notify the worker (existing job_offer notification type)
  const employerName = j.employerName ?? "An employer";

  await createNotification(
    workerId,
    "job_offer",
    "You have a job offer!",
    `${employerName} offered you the job "${j.title || "Job Offer"}".`,
    jobId,
    employerId,
    employerName,
  );

  return { applicationId, jobTitle: j.title || "Job Offer" };
}

/**
 * Returns a map of `${jobId}_${workerId}` -> application status for an employer.
 * Used to easily check if an offer has already been sent to a worker for a job.
 */
export async function fetchEmployerJobOffers(
  employerId: string,
): Promise<Record<string, string>> {
  try {
    const snap = await getDocs(
      query(
        collection(db, "applications"),
        where("employerId", "==", employerId),
      ),
    );
    const map: Record<string, string> = {};
    for (const d of snap.docs) {
      const data = d.data();
      map[`${data.jobId}_${data.workerId}`] = data.status;
    }
    return map;
  } catch (err) {
    console.error("fetchEmployerJobOffers error:", err);
    return {};
  }
}

// Worker accepts a job offer.
// Updates the application, the job's hiredCount/status, then notifies the employer.
export async function acceptJobOfferDoc(
  applicationId: string,
  workerId: string,
) {
  const appRef = doc(db, "applications", applicationId);

  const info = await runTransaction(db, async (tx) => {
    // 1. Read everything first (Firestore requires reads before writes)
    const appSnap = await tx.get(appRef);
    if (!appSnap.exists()) throw new Error("Application not found.");
    const a = appSnap.data();

    if (a.workerId !== workerId) {
      throw new Error("This offer does not belong to you.");
    }
    if (a.status !== "offered") {
      throw new Error("This offer is no longer pending.");
    }

    const jobRef = doc(db, "jobs", a.jobId);
    const jobSnap = await tx.get(jobRef);
    if (!jobSnap.exists()) throw new Error("Job not found.");
    const j = jobSnap.data();

    const openings: number = j.openings ?? 1;
    const hired: number = j.hiredCount ?? 0;
    if (hired >= openings) {
      throw new Error("Sorry, all positions for this job are already filled.");
    }

    // 2. Then write
    const newHired = hired + 1;
    tx.update(appRef, {
      status: "in_progress",
      updatedAt: serverTimestamp(),
    });
    tx.update(jobRef, {
      hiredCount: newHired,
      status: newHired >= openings ? "filled" : "open",
      updatedAt: serverTimestamp(),
    });

    return {
      employerId: a.employerId as string,
      jobId: a.jobId as string,
      jobTitle: (a.jobTitle ?? "") as string,
    };
  });

  // 🔔 Notify the employer (only runs if the transaction succeeded)
  let workerName = "A worker";
  try {
    const userSnap = await getDoc(doc(db, "users", workerId));
    workerName = userSnap.data()?.name ?? workerName;
  } catch {
    // If the name can't be read, the generic text is fine
  }

    await createNotification(
    info.employerId,
    "offer_accepted",
    "Job offer accepted",
    `${workerName} accepted your offer for "${info.jobTitle}".`,
    info.jobId,
    workerId,
    workerName,
  );
}

// Worker rejects a job offer.
// The job is not changed, so it stays open for other workers.
export async function rejectJobOfferDoc(
  applicationId: string,
  workerId: string,
) {
  const appRef = doc(db, "applications", applicationId);
  const appSnap = await getDoc(appRef);
  if (!appSnap.exists()) throw new Error("Application not found.");

  const a = appSnap.data();
  if (a.workerId !== workerId) {
    throw new Error("This offer does not belong to you.");
  }
  if (a.status !== "offered") {
    throw new Error("This offer is no longer pending.");
  }

  await updateDoc(appRef, {
    status: "offer_declined",
    updatedAt: serverTimestamp(),
  });

  // 🔔 Notify the employer (job stays open)
  let workerName = "A worker";
  try {
    const userSnap = await getDoc(doc(db, "users", workerId));
    workerName = userSnap.data()?.name ?? workerName;
  } catch {
    // If the name can't be read, the generic text is fine
  }

    await createNotification(
    a.employerId,
    "offer_rejected",
    "Job offer declined",
    `${workerName} declined your offer for "${a.jobTitle}".`,
    a.jobId,
    workerId,
    workerName,
  );
}

// Read one application's current status (used by the Navbar to decide
// whether Accept / Reject buttons should still be shown for an offer).
export async function getApplicationStatusDoc(
  applicationId: string,
): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, "applications", applicationId));
    if (!snap.exists()) return null;
    return (snap.data().status ?? null) as string | null;
  } catch (err) {
    console.error("getApplicationStatusDoc failed:", err);
    return null;
  }
}

// ==========================================
// 🚀 JOB COMPLETION, OTP & PAYMENT WORKFLOW
// ==========================================

/**
 * DEMO LIMITATION NOTICE:
 * In a production architecture, OTP generation and verification would be executed
 * on a secure server/Firebase Cloud Function with SMS gateway integration and
 * server-side rate limiting. For this college project demonstration, the workflow
 * uses Firestore coordination with a 10-minute expiry timestamp and a 5-attempt limit.
 */

export interface CompletionRequestResult {
  applicationId: string;
  otp: string;
  expirySeconds: number;
}

/**
 * Worker requests job completion for a job that is in_progress.
 * Generates a random 6-digit OTP, sets 10-minute expiry, sets status to completion_requested,
 * and notifies the employer with the OTP.
 */
export async function requestJobCompletionDoc(
  jobId: string,
  workerId: string,
): Promise<CompletionRequestResult> {
  const applicationId = `${jobId}_${workerId}`;
  const appRef = doc(db, "applications", applicationId);
  const appSnap = await getDoc(appRef);

  if (!appSnap.exists()) {
    throw new Error("Job application not found.");
  }

  const appData = appSnap.data();
  if (appData.workerId !== workerId) {
    throw new Error("You can only request completion for your own jobs.");
  }

  if (appData.status === "completed") {
    throw new Error("This job is already completed.");
  }

  if (appData.status !== "in_progress" && appData.status !== "completion_requested") {
    throw new Error("Job must be in progress before requesting completion.");
  }

  // Generate random 6-digit demo OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // 10 minutes expiry timestamp (seconds)
  const expirySeconds = Math.floor(Date.now() / 1000) + 10 * 60;

  await updateDoc(appRef, {
    status: "completion_requested",
    completionOtp: otp,
    completionOtpExpiry: expirySeconds,
    completionAttempts: 0,
    completionRequestedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Fetch worker and job details for notifications
  let workerName = "Worker";
  try {
    const workerSnap = await getDoc(doc(db, "users", workerId));
    if (workerSnap.exists()) {
      workerName = workerSnap.data().name || workerName;
    }
  } catch {
    // fallback
  }

  const jobTitle = appData.jobTitle || "Job";

  // 🔔 Notify employer with the OTP
  await createNotification(
    appData.employerId,
    "completion_requested",
    "Worker requested job completion verification",
    `${workerName} has completed work for "${jobTitle}". Verification OTP: ${otp} (valid for 10 minutes). Please share this OTP with the worker to confirm completion.`,
    jobId,
    workerId,
    workerName,
  );

  return { applicationId, otp, expirySeconds };
}

/**
 * Worker verifies completion by submitting the 6-digit OTP given by the employer.
 * Validates expiration, attempt count (max 5), sets job to completed, and paymentStatus to pending.
 */
export async function verifyJobCompletionOtpDoc(
  jobId: string,
  workerId: string,
  enteredOtp: string,
): Promise<{ success: boolean; message: string }> {
  const applicationId = `${jobId}_${workerId}`;
  const appRef = doc(db, "applications", applicationId);
  const jobRef = doc(db, "jobs", jobId);

  const result = await runTransaction(db, async (tx) => {
    // READ 1: Application
    const appSnap = await tx.get(appRef);

    if (!appSnap.exists()) {
      throw new Error("Application not found.");
    }

    const appData = appSnap.data();

    if (appData.workerId !== workerId) {
      throw new Error(
        "Unauthorized: Only the assigned worker can verify this OTP.",
      );
    }

    if (appData.status === "completed") {
      throw new Error("This job is already verified and completed.");
    }

    if (appData.status !== "completion_requested") {
      throw new Error(
        "No active completion verification requested for this job.",
      );
    }

    const currentAttempts = appData.completionAttempts || 0;

    if (currentAttempts >= 5) {
      throw new Error(
        "Maximum verification attempts (5) exceeded. Please request a new completion verification.",
      );
    }

    const nowSeconds = Math.floor(Date.now() / 1000);

    const expirySeconds =
      typeof appData.completionOtpExpiry === "number"
        ? appData.completionOtpExpiry
        : appData.completionOtpExpiry?.seconds;

    if (!expirySeconds || nowSeconds > expirySeconds) {
      throw new Error(
        "Verification OTP has expired or is invalid. Please request a new completion verification.",
      );
    }

    const cleanEntered = enteredOtp.trim();

    // Incorrect OTP: save the attempt and return without throwing
    if (cleanEntered !== String(appData.completionOtp).trim()) {
      const nextAttempts = currentAttempts + 1;

      tx.update(appRef, {
        completionAttempts: nextAttempts,
        updatedAt: serverTimestamp(),
      });

      const remaining = 5 - nextAttempts;

      return {
        success: false,
        message: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      };
    }

        // All reads are now complete. Perform writes.
    tx.update(appRef, {
      status: "completed",
      paymentStatus: "pending",
      completionOtp: null,
      completionVerifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    
    return {
      success: true,
      message:
        "Job completion verified successfully! Payment is now pending.",
    };
  });

  // Throw outside the transaction so an incorrect attempt remains saved.
  if (!result.success) {
    throw new Error(result.message);
  }

  // Notifications are sent only after successful verification.
  const appSnap = await getDoc(appRef);
  const appData = appSnap.exists() ? appSnap.data() : {};
  const jobTitle = appData.jobTitle || "Job";

  let workerName = "Worker";
  let employerName = "Employer";

  try {
    const [wUser, eUser] = await Promise.all([
      getDoc(doc(db, "users", workerId)),
      getDoc(doc(db, "users", appData.employerId)),
    ]);

    if (wUser.exists()) {
      workerName = wUser.data().name || workerName;
    }

    if (eUser.exists()) {
      employerName = eUser.data().name || employerName;
    }
  } catch {
    // Use fallback names if user details cannot be fetched.
  }

  await createNotification(
    appData.employerId,
    "completion_verified",
    "Work Completed – Payment Pending",
    `${workerName} has completed "${jobTitle}". Please release daily wage payment to complete the job.`,
    jobId,
    workerId,
    workerName,
  );

  await createNotification(
    workerId,
    "completion_verified",
    "Job Verified – Payment Pending",
    `Verification successful for "${jobTitle}". ${employerName} will confirm your wage payout shortly.`,
    jobId,
    appData.employerId,
    employerName,
  );

  return result;
}

/**
 * Worker selects payment method (Cash or QR) after completion is verified.
 * Saves paymentMethod preference on the application document and sends a notification
 * to the employer requesting payment confirmation.
 */
export async function requestJobPaymentDoc(
  jobId: string,
  workerId: string,
  paymentMethod: "qr_demo" | "cash",
): Promise<void> {
  const applicationId = jobId.includes("_") ? jobId : `${jobId}_${workerId}`;
  const appRef = doc(db, "applications", applicationId);
  const appSnap = await getDoc(appRef);

  if (!appSnap.exists()) {
    throw new Error("Application record not found.");
  }

  const appData = appSnap.data();
  if (appData.workerId !== workerId) {
    throw new Error("Unauthorized: Only the assigned worker can request payment.");
  }

  if (appData.status !== "completed") {
    throw new Error("Job completion must be verified before requesting payment.");
  }

  await updateDoc(appRef, {
    paymentMethod,
    paymentStatus: "pending",
    paymentRequestedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 🔔 Notify employer that worker has requested payment confirmation
  let workerName = "Worker";
  try {
    const userSnap = await getDoc(doc(db, "users", workerId));
    if (userSnap.exists()) {
      workerName = userSnap.data().name || workerName;
    }
  } catch {
    // fallback ok
  }

  const methodLabel = paymentMethod === "qr_demo" ? "UPI / QR Code" : "Cash in Hand";
  const wage = appData.wage || 0;
  const jobTitle = appData.jobTitle || "Job";

  await createNotification(
    appData.employerId,
    "payment_requested",
    "Payment Confirmation Requested",
    `${workerName} has completed "${jobTitle}" and requested payout of ₹${wage} via ${methodLabel}. Please confirm payment in your dashboard.`,
    jobId,
    workerId,
    workerName,
  );
}

/**
 * Employer confirms receipt/disbursement of payment (Cash or UPI Demo).
 * Sets paymentStatus to 'paid', records timestamp & paymentMethod, unlocks mutual ratings.
 * Follows strict Firestore transaction rules (all reads before writes) and handles multi-worker jobs.
 */
export async function confirmJobPaymentDoc(
  jobId: string,
  workerId: string,
  employerId: string,
  paymentMethod: "qr_demo" | "cash",
): Promise<void> {
  const applicationId = jobId.includes("_") ? jobId : `${jobId}_${workerId}`;
  const actualJobId = jobId.includes("_") ? jobId.split("_")[0] : jobId;
  const actualWorkerId = jobId.includes("_") ? jobId.split("_")[1] : workerId;

  const appRef = doc(db, "applications", applicationId);
  const jobRef = doc(db, "jobs", actualJobId);

  let targetJobTitle = "Job";

  await runTransaction(db, async (tx) => {
    // 1. ALL READS FIRST (Strict Firestore transaction requirement)
    const appSnap = await tx.get(appRef);
    if (!appSnap.exists()) {
      throw new Error("Application record not found.");
    }

    const appData = appSnap.data();
    if (appData.employerId !== employerId) {
      throw new Error("Only the employer for this job can confirm payment.");
    }

    if (appData.status !== "completed") {
      throw new Error(
        "Job must be verified as completed before payment can be confirmed.",
      );
    }

    if (appData.paymentStatus === "paid") {
      throw new Error("Payment has already been confirmed for this job.");
    }

    targetJobTitle = appData.jobTitle || targetJobTitle;

    const jobSnap = await tx.get(jobRef);

    // 2. ALL WRITES AFTER READS
    tx.update(appRef, {
      paymentStatus: "paid",
      paymentMethod,
      paymentConfirmedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Multi-worker job safety:
    // Only update job-level paymentStatus if it's a single-opening job.
    // If openings > 1, do NOT mark entire job listing completed or overwrite status.
    if (jobSnap.exists()) {
      const jobData = jobSnap.data();
      const openings = jobData.openings ?? 1;
      if (openings <= 1) {
        tx.update(jobRef, {
          paymentStatus: "paid",
          paymentMethod,
          updatedAt: serverTimestamp(),
        });
      }
    }
  });

  // 🔔 Notify the worker (outside transaction)
  let employerName = "Employer";
  try {
    const eUser = await getDoc(doc(db, "users", employerId));
    if (eUser.exists()) {
      employerName = eUser.data().name || employerName;
    }
  } catch {
    // fallback
  }

  const methodLabel = paymentMethod === "qr_demo" ? "UPI (Demo)" : "Cash";
  await createNotification(
    actualWorkerId,
    "payment_confirmed",
    "Payment Confirmed!",
    `${employerName} has confirmed payment via ${methodLabel} for "${targetJobTitle}". Mutual ratings and reviews are now unlocked.`,
    actualJobId,
    employerId,
    employerName,
  );
}

// ==========================================
// 📜 JOB HISTORY TYPES & FETCHERS
// ==========================================

export interface WorkerJobHistoryItem {
  id: string;
  jobId: string;
  employerId: string;
  employerName: string;
  jobTitle: string;
  trade: string;
  location: string;
  wage: number;
  duration: string;
  description: string;
  completionDate: string;
  completionTimestamp?: number | null;
  paymentStatus: "pending" | "paid";
  paymentMethod?: "qr_demo" | "cash" | null;
  workerReviewSubmitted: boolean;
  employerReviewSubmitted: boolean;
  employerReview?: {
    rating: number;
    comment: string;
    categories?: any;
    createdAt?: { seconds: number } | null;
  } | null;
  workerReview?: {
    rating: number;
    comment: string;
    categories?: any;
    createdAt?: { seconds: number } | null;
  } | null;
}

export interface EmployerJobHistoryItem {
  id: string;
  jobId: string;
  workerId: string;
  workerName: string;
  workerPhone: string;
  jobTitle: string;
  trade: string;
  location: string;
  wage: number;
  duration: string;
  description: string;
  completionDate: string;
  completionTimestamp?: number | null;
  paymentStatus: "pending" | "paid";
  paymentMethod?: "qr_demo" | "cash" | null;
  workerReviewSubmitted: boolean;
  employerReviewSubmitted: boolean;
  workerReview?: {
    rating: number;
    comment: string;
    categories?: any;
    createdAt?: { seconds: number } | null;
  } | null;
  employerReview?: {
    rating: number;
    comment: string;
    categories?: any;
    createdAt?: { seconds: number } | null;
  } | null;
}

function formatDateString(seconds?: number | null): string {
  if (!seconds) return "Recently";
  const d = new Date(seconds * 1000);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Fetch all completed jobs for a worker.
 */
export async function fetchWorkerJobHistory(
  workerId: string,
): Promise<WorkerJobHistoryItem[]> {
  const snap = await getDocs(
    query(
      collection(db, "applications"),
      where("workerId", "==", workerId),
      where("status", "==", "completed"),
    ),
  );

  const history: WorkerJobHistoryItem[] = [];

  for (const d of snap.docs) {
    const a = d.data();
    let jobTitle = a.jobTitle || "Job";
    let employerName = "Employer";
    let location = "Location not specified";
    let wage = 0;
    let trade = "";
    let duration = "";
    let description = "";

    try {
      const jobSnap = await getDoc(doc(db, "jobs", a.jobId));
      if (jobSnap.exists()) {
        const j = jobSnap.data();
        jobTitle = j.title || jobTitle;
        employerName = j.employerName || employerName;
        location = j.location || location;
        wage = j.wage || 0;
        trade = j.trade || "";
        duration = j.duration || "";
        description = j.description || "";
      }
    } catch (err) {
      console.warn("Error fetching job details for history:", a.jobId, err);
    }

    if (employerName === "Employer" && a.employerId) {
      try {
        const uSnap = await getDoc(doc(db, "users", a.employerId));
        if (uSnap.exists()) {
          employerName = uSnap.data().name || employerName;
        }
      } catch {
        // fallback ok
      }
    }

    // Fetch mutual ratings (checks composite ID then fallback to legacy ID)
    let employerReview: any = null;
    let workerReview: any = null;

    try {
      const [eReviewSnap1, eReviewSnap2, wReviewSnap1, wReviewSnap2] =
        await Promise.all([
          getDoc(doc(db, "ratings", `${a.jobId}_${a.employerId}_${workerId}`)),
          getDoc(doc(db, "ratings", `${a.jobId}_${a.employerId}`)),
          getDoc(doc(db, "ratings", `${a.jobId}_${workerId}_${a.employerId}`)),
          getDoc(doc(db, "ratings", `${a.jobId}_${workerId}`)),
        ]);

      if (eReviewSnap1.exists()) {
        employerReview = eReviewSnap1.data();
      } else if (eReviewSnap2.exists()) {
        employerReview = eReviewSnap2.data();
      }

      if (wReviewSnap1.exists()) {
        workerReview = wReviewSnap1.data();
      } else if (wReviewSnap2.exists()) {
        workerReview = wReviewSnap2.data();
      }
    } catch (err) {
      console.warn("Error fetching ratings for history:", a.jobId, err);
    }

    const completionTimestamp =
      a.completionVerifiedAt?.seconds ?? a.updatedAt?.seconds ?? null;

    history.push({
      id: d.id,
      jobId: a.jobId,
      employerId: a.employerId,
      employerName,
      jobTitle,
      trade,
      location,
      wage,
      duration,
      description,
      completionDate: formatDateString(completionTimestamp),
      completionTimestamp,
      paymentStatus: a.paymentStatus || "pending",
      paymentMethod: a.paymentMethod || null,
      workerReviewSubmitted: !!a.workerReviewSubmitted,
      employerReviewSubmitted: !!a.employerReviewSubmitted,
      employerReview,
      workerReview,
    });
  }

  return history.sort(
    (a, b) => (b.completionTimestamp ?? 0) - (a.completionTimestamp ?? 0),
  );
}

/**
 * Fetch all completed posted jobs for an employer.
 */
export async function fetchEmployerJobHistory(
  employerId: string,
): Promise<EmployerJobHistoryItem[]> {
  const snap = await getDocs(
    query(
      collection(db, "applications"),
      where("employerId", "==", employerId),
      where("status", "==", "completed"),
    ),
  );

  const history: EmployerJobHistoryItem[] = [];

  for (const d of snap.docs) {
    const a = d.data();
    let jobTitle = a.jobTitle || "Job";
    let location = "Location not specified";
    let wage = 0;
    let trade = "";
    let duration = "";
    let description = "";

    try {
      const jobSnap = await getDoc(doc(db, "jobs", a.jobId));
      if (jobSnap.exists()) {
        const j = jobSnap.data();
        jobTitle = j.title || jobTitle;
        location = j.location || location;
        wage = j.wage || 0;
        trade = j.trade || "";
        duration = j.duration || "";
        description = j.description || "";
      }
    } catch (err) {
      console.warn("Error fetching job details for employer history:", a.jobId, err);
    }

    let workerName = "Worker";
    let workerPhone = "";

    try {
      const uSnap = await getDoc(doc(db, "users", a.workerId));
      if (uSnap.exists()) {
        workerName = uSnap.data().name || workerName;
        workerPhone = uSnap.data().phone || "";
      }
    } catch {
      // fallback
    }

    // Fetch mutual ratings (checks composite ID then fallback to legacy ID)
    let employerReview: any = null;
    let workerReview: any = null;

    try {
      const [eReviewSnap1, eReviewSnap2, wReviewSnap1, wReviewSnap2] =
        await Promise.all([
          getDoc(doc(db, "ratings", `${a.jobId}_${employerId}_${a.workerId}`)),
          getDoc(doc(db, "ratings", `${a.jobId}_${employerId}`)),
          getDoc(doc(db, "ratings", `${a.jobId}_${a.workerId}_${employerId}`)),
          getDoc(doc(db, "ratings", `${a.jobId}_${a.workerId}`)),
        ]);

      if (eReviewSnap1.exists()) {
        employerReview = eReviewSnap1.data();
      } else if (eReviewSnap2.exists()) {
        employerReview = eReviewSnap2.data();
      }

      if (wReviewSnap1.exists()) {
        workerReview = wReviewSnap1.data();
      } else if (wReviewSnap2.exists()) {
        workerReview = wReviewSnap2.data();
      }
    } catch (err) {
      console.warn("Error fetching ratings for employer history:", a.jobId, err);
    }

    const completionTimestamp =
      a.completionVerifiedAt?.seconds ?? a.updatedAt?.seconds ?? null;

    history.push({
      id: d.id,
      jobId: a.jobId,
      workerId: a.workerId,
      workerName,
      workerPhone,
      jobTitle,
      trade,
      location,
      wage,
      duration,
      description,
      completionDate: formatDateString(completionTimestamp),
      completionTimestamp,
      paymentStatus: a.paymentStatus || "pending",
      paymentMethod: a.paymentMethod || null,
      workerReviewSubmitted: !!a.workerReviewSubmitted,
      employerReviewSubmitted: !!a.employerReviewSubmitted,
      workerReview,
      employerReview,
    });
  }

  return history.sort(
    (a, b) => (b.completionTimestamp ?? 0) - (a.completionTimestamp ?? 0),
  );
}

// ==========================================
// 🚨 EMERGENCY HIRING RE-EXPORTS
// ==========================================
export {
  createAndDispatchEmergencyJob,
  acceptEmergencyJobOfferDoc,
  rejectEmergencyJobOfferDoc,
  checkAndAdvanceEmergencyDispatch,
  subscribeToEmergencyJob,
  fetchEligibleEmergencyWorkers,
  type EligibleEmergencyWorker,
  type EmergencyJobCreateInput,
  type EmergencyDispatchResult,
} from "./emergencyDispatchService";
