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
  | "new_message"
  | "job_offer"
  | "offer_accepted"
  | "offer_rejected"
  | "completion_requested"
  | "completion_verified"
  | "payment_requested"
  | "payment_confirmed"
  | "rating_received";

export interface AppNotification {
  id: string;
  userId: string;
  senderId?: string;
  senderName?: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId: string | null;
  isRead: boolean;
  isArchived?: boolean;
  archivedAt?: { seconds: number } | null;
  createdAt?: { seconds: number } | null;
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedId: string | null = null,
  senderId: string | null = null,
  senderName: string = "KaamSetu",
): Promise<void> {
  await addDoc(collection(db, "notifications"), {
    userId,
    senderId,
    senderName,
    type,
    title,
    message,
    relatedId,
    isRead: false,
    isArchived: false,
    archivedAt: null,
    createdAt: serverTimestamp(),
  });
}

export async function getMyNotifications(
  userId: string,
): Promise<AppNotification[]> {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(40),
  );

  const snap = await getDocs(q);

  return snap.docs
    .map((d) => ({
      id: d.id,
      ...(d.data() as Omit<AppNotification, "id">),
    }))
    .filter((n) => !n.isArchived);
}

export async function markNotificationRead(
  notificationId: string,
): Promise<void> {
  await updateDoc(doc(db, "notifications", notificationId), {
    isRead: true,
  });
}

export async function archiveNotification(
  notificationId: string,
): Promise<void> {
  await updateDoc(doc(db, "notifications", notificationId), {
    isArchived: true,
    isRead: true,
    archivedAt: serverTimestamp(),
  });
}

export async function archiveNotificationsByRelatedId(
  userId: string,
  relatedId: string,
  type?: NotificationType,
): Promise<void> {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("relatedId", "==", relatedId),
    );

    const snap = await getDocs(q);

    const updatePromises = snap.docs
      .filter((d) => {
        const data = d.data();
        if (data.isArchived) return false;
        if (type && data.type !== type) return false;
        return true;
      })
      .map((d) =>
        updateDoc(d.ref, {
          isArchived: true,
          isRead: true,
          archivedAt: serverTimestamp(),
        }),
      );

    await Promise.all(updatePromises);
  } catch (err) {
    console.error("Error archiving notifications by relatedId:", err);
  }
}