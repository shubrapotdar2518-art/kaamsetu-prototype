// src/services/notificationService.ts
// Handles creating and reading notifications for a user
// (e.g. "A worker applied to your job", "Your application was accepted").

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseClient";

export type NotificationType =
  | "application_received"
  | "application_accepted"
  | "application_rejected"
  | "job_completed"
  | "new_message";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId: string | null;
  isRead: boolean;
  createdAt?: { seconds: number } | null;
}

/**
 * Create a notification for a specific user.
 * Called automatically by other services (e.g. jobService) — you usually
 * won't call this directly from a page.
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedId: string | null = null,
): Promise<void> {
  await addDoc(collection(db, "notifications"), {
    userId,
    type,
    title,
    message,
    relatedId,
    isRead: false,
    createdAt: serverTimestamp(),
  });
}

/**
 * Get the most recent 20 notifications for one user, newest first.
 */
export async function getMyNotifications(
  userId: string,
): Promise<AppNotification[]> {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(20),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<AppNotification, "id">),
  }));
}

/**
 * Mark one notification as read (e.g. when the user taps on it).
 */
export async function markNotificationRead(
  notificationId: string,
): Promise<void> {
  await updateDoc(doc(db, "notifications", notificationId), {
    isRead: true,
  });
}
