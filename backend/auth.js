// auth.js

import { auth, db } from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "firebase/firestore";

/**
 * Register a new user and create their Firestore profile.
 *
 * profileData should contain:
 * {
 *   name: "Ramesh Kumar",
 *   phone: "9876543210",
 *   userType: "worker",
 *   location: "Mumbai"
 * }
 */
export async function registerUser(email, password, profileData) {
  try {
    if (!["worker", "employer"].includes(profileData.userType)) {
      throw new Error("User type must be worker or employer.");
    }

    // Firebase securely creates the login account.
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const firebaseUser = userCredential.user;

    // The Firestore document ID is the same as Firebase Auth UID.
    await setDoc(doc(db, "users", firebaseUser.uid), {
      userId: firebaseUser.uid,
      email: firebaseUser.email,
      name: profileData.name,
      phone: profileData.phone,
      userType: profileData.userType,
      location: profileData.location ?? "",
      isActive: true,
      createdAt: serverTimestamp()
    });

    console.log("✅ Registration successful:", firebaseUser.uid);

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email
    };
  } catch (error) {
    console.error("❌ Registration failed:", error.message);
    throw error;
  }
}

/**
 * Log in an existing user.
 */
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    console.log("✅ Login successful:", userCredential.user.uid);

    return userCredential.user;
  } catch (error) {
    console.error("❌ Login failed:", error.message);
    throw error;
  }
}

/**
 * Log out the currently signed-in user.
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    console.log("✅ Logout successful");
  } catch (error) {
    console.error("❌ Logout failed:", error.message);
    throw error;
  }
}

/**
 * Read the signed-in user's Firestore profile.
 */
export async function getMyProfile() {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("No user is currently logged in.");
    }

    const profileSnapshot = await getDoc(
      doc(db, "users", currentUser.uid)
    );

    if (!profileSnapshot.exists()) {
      return null;
    }

    return {
      id: profileSnapshot.id,
      ...profileSnapshot.data()
    };
  } catch (error) {
    console.error("❌ Could not get profile:", error.message);
    throw error;
  }
}

/**
 * Wait until Firebase finishes checking login state.
 */
export function waitForAuthState() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}