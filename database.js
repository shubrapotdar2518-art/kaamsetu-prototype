// database.js
import { db } from "./firebase-config.js";
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
  where 
} from "firebase/firestore";

// ==========================================
// 👤 USER FUNCTIONS (Base for Everyone)
// ==========================================

// ➕ CREATE A NEW USER (works for both workers and employers)
export async function createUser(userData) {
  try {
    // userData should have: name, phone, email, userType
    const docRef = await addDoc(collection(db, "users"), {
      ...userData,
      createdAt: new Date(),
      isActive: true
    });
    console.log("✅ User created! ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error creating user:", error);
    throw error;
  }
}

// 📋 GET USER BY ID
export async function getUserById(userId) {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log("❌ User not found");
      return null;
    }
  } catch (error) {
    console.error("❌ Error getting user:", error);
  }
}

// 📋 GET ALL USERS
export async function getAllUsers() {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    console.error("❌ Error getting users:", error);
    return [];
  }
}

// 🔍 GET USER BY PHONE
export async function getUserByPhone(phone) {
  try {
    const q = query(
      collection(db, "users"),
      where("phone", "==", phone)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("❌ No user found with phone:", phone);
      return null;
    }
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users[0]; // Return first match
  } catch (error) {
    console.error("❌ Error getting user by phone:", error);
  }
}

// 🔍 GET USERS BY TYPE (all workers OR all employers)
export async function getUsersByType(userType) {
  try {
    const q = query(
      collection(db, "users"),
      where("userType", "==", userType)
    );
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    console.error("❌ Error getting users by type:", error);
    return [];
  }
}

// ✏️ UPDATE USER
export async function updateUser(userId, updatedData) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, updatedData);
    console.log("✅ User updated!");
    return true;
  } catch (error) {
    console.error("❌ Error updating user:", error);
    return false;
  }
}

// 🗑️ DEACTIVATE USER (soft delete - safer than actual delete)
export async function deactivateUser(userId) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { isActive: false });
    console.log("✅ User deactivated!");
    return true;
  } catch (error) {
    console.error("❌ Error deactivating user:", error);
    return false;
  }
}


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