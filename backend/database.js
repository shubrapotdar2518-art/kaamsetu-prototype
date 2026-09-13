// database.js
import { db, auth } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from "firebase/firestore";

// ==========================================
// 👤 USER FUNCTIONS
// ==========================================

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  try {
    const docSnap = await getDoc(doc(db, "users", userId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("❌ Error getting user:", error);
    throw error;
  }
}

/**
 * Get all users
 */
export async function getAllUsers() {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting users:", error);
    return [];
  }
}


// ==========================================
// 👷 WORKER PROFILE FUNCTIONS
// ==========================================

/**
 * Create worker profile for logged-in user
 * Document ID = User's Firebase UID
 */
export async function createWorkerProfile(workerData) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Please login first to create worker profile");
    }

    // Check if user is actually a "worker" type
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!userDoc.exists() || userDoc.data().userType !== "worker") {
      throw new Error("Only worker-type users can create worker profile");
    }

    // Prepare worker profile data
    const profile = {
      userId: currentUser.uid,
      skills: workerData.skills || [],
      primarySkill: workerData.primarySkill || "",
      experience: workerData.experience || 0,
      dailyRate: workerData.dailyRate || 0,
      location: workerData.location || "",
      address: workerData.address || "",
      isAvailable: workerData.isAvailable ?? true,
      rating: 0,
      totalJobs: 0,
      bio: workerData.bio || "",
      languages: workerData.languages || [],
      hasOwnTools: workerData.hasOwnTools ?? false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Save with UID as document ID
    await setDoc(doc(db, "workers", currentUser.uid), profile);

    console.log("✅ Worker profile created for:", currentUser.uid);
    return currentUser.uid;
  } catch (error) {
    console.error("❌ Error creating worker profile:", error);
    throw error;
  }
}

/**
 * Get worker profile by userId
 */
export async function getWorkerProfile(userId) {
  try {
    const docSnap = await getDoc(doc(db, "workers", userId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("❌ Error getting worker profile:", error);
    throw error;
  }
}

/**
 * Get current logged-in worker's profile
 */
export async function getMyWorkerProfile() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Please login first");
  }
  return await getWorkerProfile(currentUser.uid);
}

/**
 * Update worker profile (only own profile)
 */
export async function updateWorkerProfile(updatedData) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Please login first");
    }

    // Never allow changing these fields
    const protectedFields = ["userId", "createdAt", "rating", "totalJobs"];
    protectedFields.forEach(field => delete updatedData[field]);

    updatedData.updatedAt = serverTimestamp();

    await updateDoc(doc(db, "workers", currentUser.uid), updatedData);
    console.log("✅ Worker profile updated!");
    return true;
  } catch (error) {
    console.error("❌ Error updating worker profile:", error);
    throw error;
  }
}

/**
 * Toggle worker availability (available/busy)
 */
export async function toggleAvailability() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Please login first");
    }

    const profile = await getMyWorkerProfile();
    if (!profile) {
      throw new Error("Worker profile not found");
    }

    const newStatus = !profile.isAvailable;
    await updateDoc(doc(db, "workers", currentUser.uid), {
      isAvailable: newStatus,
      updatedAt: serverTimestamp()
    });

    console.log(`✅ Availability changed to: ${newStatus ? "AVAILABLE" : "BUSY"}`);
    return newStatus;
  } catch (error) {
    console.error("❌ Error toggling availability:", error);
    throw error;
  }
}

/**
 * Get all workers
 */
export async function getAllWorkers() {
  try {
    const snapshot = await getDocs(collection(db, "workers"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting workers:", error);
    return [];
  }
}

/**
 * Get workers by skill (only available ones)
 */
export async function getWorkersBySkill(skill) {
  try {
    const q = query(
      collection(db, "workers"),
      where("skills", "array-contains", skill.toLowerCase()),
      where("isAvailable", "==", true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting workers by skill:", error);
    return [];
  }
}

/**
 * Get workers by location (only available)
 */
export async function getWorkersByLocation(location) {
  try {
    const q = query(
      collection(db, "workers"),
      where("location", "==", location),
      where("isAvailable", "==", true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting workers by location:", error);
    return [];
  }
}

/**
 * Search workers by skill AND location
 */
export async function searchWorkers(skill, location) {
  try {
    const q = query(
      collection(db, "workers"),
      where("skills", "array-contains", skill.toLowerCase()),
      where("location", "==", location),
      where("isAvailable", "==", true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error searching workers:", error);
    return [];
  }
}

/**
 * Get worker with FULL info (user + worker profile combined)
 */
export async function getWorkerFullInfo(userId) {
  try {
    const userProfile = await getUserById(userId);
    const workerProfile = await getWorkerProfile(userId);

    if (!userProfile || !workerProfile) {
      return null;
    }

    return {
      ...userProfile,
      ...workerProfile,
      id: userId
    };
  } catch (error) {
    console.error("❌ Error getting worker full info:", error);
    return null;
  }
}


// ==========================================
// 🏢 EMPLOYER PROFILE FUNCTIONS
// ==========================================

/**
 * Create employer profile for logged-in user
 * Document ID = User's Firebase UID
 */
export async function createEmployerProfile(employerData) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Please login first to create employer profile");
    }

    // Check if user is actually an "employer" type
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!userDoc.exists() || userDoc.data().userType !== "employer") {
      throw new Error("Only employer-type users can create employer profile");
    }

    // Prepare employer profile data
    const profile = {
      userId: currentUser.uid,
      companyName: employerData.companyName || "",
      companyType: employerData.companyType || "",
      contactPerson: employerData.contactPerson || "",
      location: employerData.location || "",
      address: employerData.address || "",
      totalJobsPosted: 0,
      activeJobs: 0,
      rating: 0,
      verified: false,
      bio: employerData.bio || "",
      gstNumber: employerData.gstNumber || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Save with UID as document ID
    await setDoc(doc(db, "employers", currentUser.uid), profile);

    console.log("✅ Employer profile created for:", currentUser.uid);
    return currentUser.uid;
  } catch (error) {
    console.error("❌ Error creating employer profile:", error);
    throw error;
  }
}

/**
 * Get employer profile by userId
 */
export async function getEmployerProfile(userId) {
  try {
    const docSnap = await getDoc(doc(db, "employers", userId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("❌ Error getting employer profile:", error);
    throw error;
  }
}

/**
 * Get current logged-in employer's profile
 */
export async function getMyEmployerProfile() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Please login first");
  }
  return await getEmployerProfile(currentUser.uid);
}

/**
 * Update employer profile (only own profile)
 */
export async function updateEmployerProfile(updatedData) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Please login first");
    }

    // Never allow changing these fields
    const protectedFields = [
      "userId",
      "createdAt",
      "rating",
      "totalJobsPosted",
      "activeJobs",
      "verified"
    ];
    protectedFields.forEach(field => delete updatedData[field]);

    updatedData.updatedAt = serverTimestamp();

    await updateDoc(doc(db, "employers", currentUser.uid), updatedData);
    console.log("✅ Employer profile updated!");
    return true;
  } catch (error) {
    console.error("❌ Error updating employer profile:", error);
    throw error;
  }
}

/**
 * Get all employers (for admin/browsing)
 */
export async function getAllEmployers() {
  try {
    const snapshot = await getDocs(collection(db, "employers"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting employers:", error);
    return [];
  }
}

/**
 * Get employers by location
 */
export async function getEmployersByLocation(location) {
  try {
    const q = query(
      collection(db, "employers"),
      where("location", "==", location)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting employers by location:", error);
    return [];
  }
}

/**
 * Get verified employers only
 */
export async function getVerifiedEmployers() {
  try {
    const q = query(
      collection(db, "employers"),
      where("verified", "==", true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting verified employers:", error);
    return [];
  }
}

/**
 * Get employer with FULL info (user + employer profile combined)
 */
export async function getEmployerFullInfo(userId) {
  try {
    const userProfile = await getUserById(userId);
    const employerProfile = await getEmployerProfile(userId);

    if (!userProfile || !employerProfile) {
      return null;
    }

    return {
      ...userProfile,
      ...employerProfile,
      id: userId
    };
  } catch (error) {
    console.error("❌ Error getting employer full info:", error);
    return null;
  }
}


// ==========================================
// 💼 JOB FUNCTIONS (Basic - Will expand in Feature 5)
// ==========================================

/**
 * Add a new job
 */
export async function addJob(jobData) {
  try {
    const docRef = await addDoc(collection(db, "jobs"), {
      ...jobData,
      status: "open",
      postedDate: serverTimestamp()
    });
    console.log("✅ Job added! ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error adding job:", error);
  }
}

/**
 * Get all open jobs
 */
export async function getOpenJobs() {
  try {
    const q = query(
      collection(db, "jobs"),
      where("status", "==", "open")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting jobs:", error);
    return [];
  }
}