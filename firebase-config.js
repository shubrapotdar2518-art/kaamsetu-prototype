// firebase-config.js

// 1. Import the tools we need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 2. PASTE YOUR KEYS HERE (Replace the values below)
const firebaseConfig = {
  apiKey: "AIzaSyCsYqKRE3wlkwiZW-Ttpsq8TccU9u4zsOg",
  authDomain: "kaamsetu-89594.firebaseapp.com",
  projectId: "kaamsetu-89594",
  storageBucket: "kaamsetu-89594.firebasestorage.app",
  messagingSenderId: "566008278150",
  appId: "1:566008278150:web:0d7f8f0418646cc417b507",
};

// 3. Start the engine
const app = initializeApp(firebaseConfig);

// 4. Connect the Security Guard (Auth) and Filing Clerk (Firestore)
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("🔥 Firebase Connected Successfully!");
