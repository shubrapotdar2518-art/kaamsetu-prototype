// src/services/welfareService.ts
// Handles reading welfare scheme info from Firestore.
// This data is PUBLIC — no login needed to read it.

import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseClient";

export interface WelfareScheme {
  id: string;
  name: string;
  category: string;
  summary: string;
  eligibility: string[];
  benefits: string[];
  documentsRequired: string[];
  applicationSteps: string[];
  officialUrl: string;
  isActive: boolean;
}

/**
 * Get all active welfare schemes (for the Welfare Schemes page list).
 */
export async function getAllWelfareSchemes(): Promise<WelfareScheme[]> {
  const snap = await getDocs(collection(db, "welfareSchemes"));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<WelfareScheme, "id">) }))
    .filter((s) => s.isActive);
}

/**
 * Get one welfare scheme by its Firestore document ID (for a detail screen).
 */
export async function getWelfareSchemeById(
  schemeId: string,
): Promise<WelfareScheme | null> {
  const snap = await getDoc(doc(db, "welfareSchemes", schemeId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<WelfareScheme, "id">) };
}
