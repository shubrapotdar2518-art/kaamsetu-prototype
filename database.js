// database.js
import { db } from "./firebase-config.js";
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query, 
  where 
} from "firebase/firestore";

// ==========================================
// 👷 WORKER FUNCTIONS
// ==========================================

// ➕ ADD A NEW WORKER
export async function addWorker(workerData) {
  try {
    const docRef = await addDoc(collection(db, "workers"), workerData);
    console.log("✅ Worker added! ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error adding worker:", error);
  }
}

// 📋 GET ALL WORKERS
export async function getAllWorkers() {
  try {
    const querySnapshot = await getDocs(collection(db, "workers"));
    const workers = [];
    querySnapshot.forEach((doc) => {
      workers.push({ id: doc.id, ...doc.data() });
    });
    return workers;
  } catch (error) {
    console.error("❌ Error getting workers:", error);
    return [];
  }
}

// 🔍 GET WORKERS BY SKILL
export async function getWorkersBySkill(skill) {
  try {
    const q = query(
      collection(db, "workers"),
      where("skill", "==", skill),
      where("isAvailable", "==", true)
    );
    const querySnapshot = await getDocs(q);
    const workers = [];
    querySnapshot.forEach((doc) => {
      workers.push({ id: doc.id, ...doc.data() });
    });
    return workers;
  } catch (error) {
    console.error("❌ Error getting workers by skill:", error);
    return [];
  }
}

// ✏️ UPDATE WORKER
export async function updateWorker(workerId, updatedData) {
  try {
    const workerRef = doc(db, "workers", workerId);
    await updateDoc(workerRef, updatedData);
    console.log("✅ Worker updated!");
  } catch (error) {
    console.error("❌ Error updating worker:", error);
  }
}

// 🗑️ DELETE WORKER
export async function deleteWorker(workerId) {
  try {
    await deleteDoc(doc(db, "workers", workerId));
    console.log("✅ Worker deleted!");
  } catch (error) {
    console.error("❌ Error deleting worker:", error);
  }
}


// ==========================================
// 💼 JOB FUNCTIONS
// ==========================================

// ➕ ADD A NEW JOB
export async function addJob(jobData) {
  try {
    const docRef = await addDoc(collection(db, "jobs"), {
      ...jobData,
      status: "open",
      postedDate: new Date()
    });
    console.log("✅ Job added! ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error adding job:", error);
  }
}

// 📋 GET ALL OPEN JOBS
export async function getOpenJobs() {
  try {
    const q = query(
      collection(db, "jobs"),
      where("status", "==", "open")
    );
    const querySnapshot = await getDocs(q);
    const jobs = [];
    querySnapshot.forEach((doc) => {
      jobs.push({ id: doc.id, ...doc.data() });
    });
    return jobs;
  } catch (error) {
    console.error("❌ Error getting jobs:", error);
    return [];
  }
}

// 🔍 GET JOBS BY SKILL
export async function getJobsBySkill(skill) {
  try {
    const q = query(
      collection(db, "jobs"),
      where("skillRequired", "==", skill),
      where("status", "==", "open")
    );
    const querySnapshot = await getDocs(q);
    const jobs = [];
    querySnapshot.forEach((doc) => {
      jobs.push({ id: doc.id, ...doc.data() });
    });
    return jobs;
  } catch (error) {
    console.error("❌ Error getting jobs by skill:", error);
    return [];
  }
}

// 🔍 GET JOBS BY LOCATION
export async function getJobsByLocation(location) {
  try {
    const q = query(
      collection(db, "jobs"),
      where("location", "==", location),
      where("status", "==", "open")
    );
    const querySnapshot = await getDocs(q);
    const jobs = [];
    querySnapshot.forEach((doc) => {
      jobs.push({ id: doc.id, ...doc.data() });
    });
    return jobs;
  } catch (error) {
    console.error("❌ Error getting jobs by location:", error);
    return [];
  }
}

// ✏️ UPDATE JOB STATUS
export async function updateJobStatus(jobId, newStatus) {
  try {
    const jobRef = doc(db, "jobs", jobId);
    await updateDoc(jobRef, { status: newStatus });
    console.log("✅ Job status updated to:", newStatus);
  } catch (error) {
    console.error("❌ Error updating job:", error);
  }
}


// ==========================================
// 📋 APPLICATION FUNCTIONS
// ==========================================

// ➕ WORKER APPLIES FOR JOB
export async function applyForJob(jobId, workerId) {
  try {
    const docRef = await addDoc(collection(db, "applications"), {
      jobId: jobId,
      workerId: workerId,
      status: "pending",
      appliedDate: new Date()
    });
    console.log("✅ Application submitted! ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error applying for job:", error);
  }
}

// 📋 GET APPLICATIONS FOR A JOB
export async function getJobApplications(jobId) {
  try {
    const q = query(
      collection(db, "applications"),
      where("jobId", "==", jobId)
    );
    const querySnapshot = await getDocs(q);
    const applications = [];
    querySnapshot.forEach((doc) => {
      applications.push({ id: doc.id, ...doc.data() });
    });
    return applications;
  } catch (error) {
    console.error("❌ Error getting applications:", error);
    return [];
  }
}


// ==========================================
// 🎯 RECOMMENDATION FUNCTION
// ==========================================

// 🎯 GET RECOMMENDED JOBS FOR WORKER (based on skill + location)
export async function getRecommendedJobs(workerSkill, workerLocation) {
  try {
    // Get all open jobs with matching skill
    const q = query(
      collection(db, "jobs"),
      where("skillRequired", "==", workerSkill),
      where("status", "==", "open")
    );
    const querySnapshot = await getDocs(q);
    const jobs = [];
    querySnapshot.forEach((doc) => {
      jobs.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort: same location jobs first
    const sameLocation = jobs.filter(j => 
      j.location.toLowerCase().includes(workerLocation.toLowerCase())
    );
    const otherLocations = jobs.filter(j => 
      !j.location.toLowerCase().includes(workerLocation.toLowerCase())
    );
    
    return [...sameLocation, ...otherLocations];
  } catch (error) {
    console.error("❌ Error getting recommendations:", error);
    return [];
  }
}