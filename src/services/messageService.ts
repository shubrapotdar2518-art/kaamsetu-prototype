// src/services/messageService.ts
// Handles chat conversations between an employer and a worker.
//
// Firestore structure (new — add to firestore-schema.md):
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
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase/firebaseClient";
import { createNotification } from "./notificationService";

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
  jobId?: string;
  jobTitle?: string;
}): Promise<string> {
  const id = getConversationId(params.employerId, params.workerId);
  const ref = doc(db, "conversations", id);
  const existing = await getDoc(ref);

  if (!existing.exists()) {
    await setDoc(ref, {
      employerId: params.employerId,
      workerId: params.workerId,
      employerName: params.employerName,
      workerName: params.workerName,
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
  await createNotification(
    receiverId,
    "new_message",
    "New message",
    text.trim().slice(0, 80),
    conversationId,
  );
}

/**
 * Live-subscribes to all messages in a conversation, oldest first.
 * Call the returned function to stop listening (e.g. when leaving the page).
 *
 * Usage in a component:
 *   useEffect(() => {
 *     const unsub = subscribeToMessages(conversationId, setMessages);
 *     return unsub;
 *   }, [conversationId]);
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: ChatMessageDoc[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("sentAt", "asc"),
  );
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ChatMessageDoc, "id">),
      })),
    );
  });
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
