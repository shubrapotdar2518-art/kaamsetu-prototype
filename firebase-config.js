// firebase-config.js

// 1. Import the tools we need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 2. PASTE YOUR KEYS HERE (Replace the values below)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 3. Start the engine
const app = initializeApp(firebaseConfig);

// 4. Connect the Security Guard (Auth) and Filing Clerk (Firestore)
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("🔥 Firebase Connected Successfully!");
