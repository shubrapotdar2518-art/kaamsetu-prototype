// src/services/firestoreProfile.ts

import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseClient";

export interface FirestoreUserData {
  name: string;
  email?: string;
  phone?: string;
  userType: "worker" | "employer" | "admin";
  location?: string;
}

/**
 * Creates the users/{uid} document.
 * This matches the exact field names in docs/firestore-schema.md
 */
export async function createUserProfile(
  uid: string,
  data: FirestoreUserData,
): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    userId: uid,
    email: data.email ?? "",
    name: data.name,
    phone: data.phone ?? "",
    userType: data.userType,
    location: data.location ?? "",
    isActive: true,
    createdAt: serverTimestamp(),
  });
}

/**
 * Reads the users/{uid} document.
 */
export async function getUserProfile(uid: string) {
  const snapshot = await getDoc(doc(db, "users", uid));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}
