// src/services/messageService.ts
// Handles chat conversations between an employer and a worker.
//
// Firestore structure:
//
// conversations/{conversationId}
//   employerId, workerId, employerName, workerName,
//   jobId (optional), jobTitle (optional),
//   lastMessage, lastMessageAt, lastSenderId
//
// conversations/{conversationId}/messages/{messageId}
//   senderId, text, sentAt

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  type Unsubscribe,
} from "firebase/firestore";
import { db, auth } from "../firebase/firebaseClient";
import {
  createNotification,
  archiveNotificationsByRelatedId,
} from "./notificationService";

export interface Conversation {
  id: string;
  employerId: string;
  workerId: string;
  employerName: string;
  workerName: string;
  jobId?: string | null;
  jobTitle?: string | null;
  lastMessage: string;
  lastMessageAt?: { seconds: number } | null;
  lastSenderId: string;
}

export interface ChatMessageDoc {
  id: string;
  senderId: string;
  text: string;
  sentAt?: { seconds: number } | null;
}

/**
 * Builds a deterministic conversation ID from the two user IDs, so
 * whichever side starts chatting first, they always land in the same thread.
 */
export function getConversationId(employerId: string, workerId: string) {
  return [employerId, workerId].sort().join("_");
}

/**
 * Creates the conversation document if it doesn't exist yet.
 * Safe to call every time before sending a message.
 */
export async function ensureConversation(params: {
  employerId: string;
  workerId: string;
  employerName: string;
  workerName: string;
  jobId?: string | null;
  jobTitle?: string | null;
}): Promise<string> {
  const id = getConversationId(params.employerId, params.workerId);
  const ref = doc(db, "conversations", id);
  const existing = await getDoc(ref);

  if (!existing.exists()) {
    await setDoc(ref, {
      employerId: params.employerId,
      workerId: params.workerId,
      employerName: params.employerName || "Employer",
      workerName: params.workerName || "Worker",
      jobId: params.jobId ?? null,
      jobTitle: params.jobTitle ?? null,
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      lastSenderId: "",
    });
  }
  return id;
}

/**
 * Sends one chat message and updates the conversation's "last message" preview.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  receiverId: string,
  text: string,
): Promise<void> {
  if (!text.trim()) return;

  await addDoc(collection(db, "conversations", conversationId, "messages"), {
    senderId,
    text: text.trim(),
    sentAt: serverTimestamp(),
  });

  await setDoc(
    doc(db, "conversations", conversationId),
    {
      lastMessage: text.trim(),
      lastMessageAt: serverTimestamp(),
      lastSenderId: senderId,
    },
    { merge: true },
  );

    // 🔔 Notify the other person about the new message
  try {
    if (receiverId) {
      const conversationSnap = await getDoc(
        doc(db, "conversations", conversationId),
      );

      const conversationData = conversationSnap.data();
      const unreadField =
  receiverId === conversationData?.workerId
    ? "unreadForWorker"
    : "unreadForEmployer";

await setDoc(
  doc(db, "conversations", conversationId),
  {
    [unreadField]: increment(1),
  },
  { merge: true },
);

      const senderName =
        conversationData?.employerId === senderId
          ? conversationData?.employerName ?? "Employer"
          : conversationData?.workerName ?? "Worker";

      await createNotification(
        receiverId,
        "new_message",
        "New message",
        text.trim().slice(0, 80),
        conversationId,
        senderId,
        senderName,
      );
    }
  } catch (notifErr) {
    console.warn("Failed to create message notification:", notifErr);
  }
}

/**
 * Live-subscribes to all messages in a conversation, oldest first.
 * Call the returned function to stop listening (e.g. when leaving the page).
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: ChatMessageDoc[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("sentAt", "asc"),
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ChatMessageDoc, "id">),
        })),
      );
    },
    (err) => {
      console.error("Error subscribing to messages:", err);
    },
  );
}

/**
 * Gets all conversations a user (employer or worker) is part of,
 * for showing the conversation list, newest first.
 */
export async function getMyConversations(
  userId: string,
  role: "employer" | "worker",
): Promise<Conversation[]> {
  const field = role === "employer" ? "employerId" : "workerId";
  const q = query(collection(db, "conversations"), where(field, "==", userId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Conversation, "id">) }))
    .sort(
      (a, b) =>
        (b.lastMessageAt?.seconds ?? 0) - (a.lastMessageAt?.seconds ?? 0),
    );
}

/**
 * Resets the unread message count and archives any pending message notifications
 * when a user opens a conversation.
 */
export async function markConversationRead(
  conversationId: string,
  role: "employer" | "worker",
  userId?: string,
): Promise<void> {
  const unreadField =
    role === "worker" ? "unreadForWorker" : "unreadForEmployer";

  await setDoc(
    doc(db, "conversations", conversationId),
    {
      [unreadField]: 0,
    },
    { merge: true },
  );

  const targetUid = userId || auth.currentUser?.uid;
  if (targetUid) {
    try {
      await archiveNotificationsByRelatedId(
        targetUid,
        conversationId,
        "new_message",
      );
    } catch (err) {
      console.warn("Failed to archive message notifications:", err);
    }
  }
}

/**
 * Live count of conversations with unread messages for a user.
 */
export function subscribeToUnreadConversations(
  userId: string,
  role: "worker" | "employer",
  callback: (count: number) => void,
): Unsubscribe {
  const userField = role === "worker" ? "workerId" : "employerId";
  const unreadField =
    role === "worker" ? "unreadForWorker" : "unreadForEmployer";

  const q = query(
    collection(db, "conversations"),
    where(userField, "==", userId),
  );

  return onSnapshot(
    q,
    (snap) => {
      const count = snap.docs.filter(
        (d) => (d.data()[unreadField] ?? 0) > 0,
      ).length;

      callback(count);
    },
    (err) => {
      console.error("Failed to subscribe to unread conversations:", err);
    },
  );
}
