// src/services/authService.ts

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "../firebase/firebaseClient";

/**
 * Creates a real Firebase Authentication account using email + password.
 */
export async function registerWithEmail(
  email: string,
  password: string,
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  return credential.user;
}

/**
 * Logs in an existing user with email + password.
 */
export async function loginWithEmail(
  email: string,
  password: string,
): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/**
 * Logs out the current user.
 */
export function logout(): Promise<void> {
  return signOut(auth);
}

/**
 * Subscribes to login/logout state changes.
 * Used once inside AppContext to restore session on page refresh.
 */
export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Converts Firebase error codes into friendly messages for the UI.
 */
export function getFriendlyAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";

  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please login instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters long.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/user-not-found":
      return "No account found with this email.";
    default:
      return "Something went wrong. Please try again.";
  }
}
