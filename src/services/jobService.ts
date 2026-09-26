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
  );
  return snap.docs
    .map(toJob)
    .sort((a, b) => (b.postedAt?.seconds ?? 0) - (a.postedAt?.seconds ?? 0));
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
  await createNotification(
    employerId,
    "application_received",
    "New application received",
    `A worker applied for "${jobTitle}".`,
    jobId,
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
    const [userSnap, workerSnap] = await Promise.all([
      getDoc(doc(db, "users", a.workerId)),
      getDoc(doc(db, "workers", a.workerId)),
    ]);
    const u = userSnap.data() ?? {};
    const w = workerSnap.data() ?? {};
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
      await createNotification(
        a.workerId,
        status === "accepted"
          ? "application_accepted"
          : status === "rejected"
            ? "application_rejected"
            : "job_completed",
        "Application update",
        `Your application for "${a.jobTitle}" was ${label}.`,
        a.jobId,
      );
    }
  }
}
