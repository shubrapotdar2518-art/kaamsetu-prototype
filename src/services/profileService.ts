import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseClient";

export async function createWorkerProfileDoc(
  uid: string,
  data: {
    primarySkill: string;
    skills: string[];
    experience: number;
    dailyRate: number;
    location: string;
    address: string;
  },
) {
  await setDoc(doc(db, "workers", uid), {
    userId: uid,
    skills: data.skills.map((s) => s.toLowerCase()),
    primarySkill: data.primarySkill,
    experience: data.experience,
    dailyRate: data.dailyRate,
    location: data.location,
    address: data.address,
    isAvailable: true,
    rating: 0,
    totalJobs: 0,
    bio: "",
    languages: [],
    hasOwnTools: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function createEmployerProfileDoc(
  uid: string,
  data: {
    companyName: string;
    contactPerson: string;
    location: string;
    address: string;
  },
) {
  await setDoc(doc(db, "employers", uid), {
    userId: uid,
    companyName: data.companyName,
    companyType: "",
    contactPerson: data.contactPerson,
    location: data.location,
    address: data.address,
    totalJobsPosted: 0,
    activeJobs: 0,
    rating: 0,
    verified: false,
    bio: "",
    gstNumber: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getWorkerProfileDoc(uid: string) {
  const snap = await getDoc(doc(db, "workers", uid));
  return snap.exists() ? (snap.data() as Record<string, any>) : null;
}
