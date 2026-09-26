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
  serverTimestamp,
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
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
      updatedAt: serverTimestamp(),
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
    protectedFields.forEach((field) => delete updatedData[field]);

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
      updatedAt: serverTimestamp(),
    });

    console.log(
      `✅ Availability changed to: ${newStatus ? "AVAILABLE" : "BUSY"}`,
    );
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
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
      where("isAvailable", "==", true),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
      where("isAvailable", "==", true),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
      where("isAvailable", "==", true),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
      id: userId,
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
      updatedAt: serverTimestamp(),
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
      "verified",
    ];
    protectedFields.forEach((field) => delete updatedData[field]);

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
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
      where("location", "==", location),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
    const q = query(collection(db, "employers"), where("verified", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
      id: userId,
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
      postedDate: serverTimestamp(),
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
    const q = query(collection(db, "jobs"), where("status", "==", "open"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting jobs:", error);
    return [];
  }
}

// ==========================================
// 💼 JOBS COLLECTION
// ==========================================

/**
 * Post a new job (Employer only)
 */
export async function postJob(jobData) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Please login first to post a job");
    }

    const job = {
      employerId: currentUser.uid,
      title: jobData.title || "",
      trade: jobData.trade || "",
      location: jobData.location || "",
      address: jobData.address || "",
      wage: jobData.wage || 0,
      openings: jobData.openings || 1,
      duration: jobData.duration || "",
      description: jobData.description || "",
      urgency: jobData.urgency || "normal",
      requiredDate: jobData.requiredDate || "",
      status: "open",
      applicantsCount: 0,
      hiredCount: 0,
      postedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "jobs"), job);
    console.log("✅ Job posted! ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error posting job:", error);
    throw error;
  }
}

/**
 * Get all open jobs
 */
export async function getAllOpenJobs() {
  try {
    const q = query(
      collection(db, "jobs"),
      where("status", "==", "open"),
      orderBy("postedAt", "desc"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting open jobs:", error);
    return [];
  }
}

/**
 * Get all emergency jobs
 */
export async function getEmergencyJobs() {
  try {
    const q = query(
      collection(db, "jobs"),
      where("status", "==", "open"),
      where("urgency", "==", "emergency"),
      orderBy("postedAt", "desc"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting emergency jobs:", error);
    return [];
  }
}

/**
 * Get jobs posted by current employer
 */
export async function getMyPostedJobs() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Please login first");

    const q = query(
      collection(db, "jobs"),
      where("employerId", "==", currentUser.uid),
      orderBy("postedAt", "desc"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting my jobs:", error);
    return [];
  }
}

/**
 * Get a single job by ID
 */
export async function getJobById(jobId) {
  try {
    const docSnap = await getDoc(doc(db, "jobs", jobId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("❌ Error getting job:", error);
    throw error;
  }
}

/**
 * Get jobs by trade/skill
 */
export async function getJobsByTrade(trade) {
  try {
    const q = query(
      collection(db, "jobs"),
      where("trade", "==", trade),
      where("status", "==", "open"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting jobs by trade:", error);
    return [];
  }
}

/**
 * Update job status
 */
export async function updateJobStatus(jobId, newStatus) {
  try {
    await updateDoc(doc(db, "jobs", jobId), {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
    console.log("✅ Job status updated to:", newStatus);
    return true;
  } catch (error) {
    console.error("❌ Error updating job status:", error);
    throw error;
  }
}

/**
 * Delete a job (only by the employer who posted it)
 */
export async function deleteJob(jobId) {
  try {
    await deleteDoc(doc(db, "jobs", jobId));
    console.log("✅ Job deleted:", jobId);
    return true;
  } catch (error) {
    console.error("❌ Error deleting job:", error);
    throw error;
  }
}

// ==========================================
// 📋 APPLICATIONS COLLECTION
// ==========================================

/**
 * Worker applies for a job
 */
export async function applyForJob(jobId, message = "") {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Please login first");

    // Prevent duplicate applications
    const applicationId = jobId + "_" + currentUser.uid;
    const existingApp = await getDoc(doc(db, "applications", applicationId));

    if (existingApp.exists()) {
      throw new Error("You have already applied for this job");
    }

    const application = {
      jobId: jobId,
      workerId: currentUser.uid,
      message: message,
      status: "pending",
      appliedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "applications", applicationId), application);
    console.log("✅ Application submitted!");
    return applicationId;
  } catch (error) {
    console.error("❌ Error applying for job:", error);
    throw error;
  }
}

/**
 * Get all applications for a specific job (for employer)
 */
export async function getApplicationsForJob(jobId) {
  try {
    const q = query(
      collection(db, "applications"),
      where("jobId", "==", jobId),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting applications:", error);
    return [];
  }
}

/**
 * Get all jobs a worker has applied to
 */
export async function getMyApplications() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Please login first");

    const q = query(
      collection(db, "applications"),
      where("workerId", "==", currentUser.uid),
      orderBy("appliedAt", "desc"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting my applications:", error);
    return [];
  }
}

/**
 * Employer accepts or rejects an application
 */
export async function updateApplicationStatus(applicationId, newStatus) {
  try {
    const allowedStatuses = [
      "pending",
      "accepted",
      "rejected",
      "in_progress",
      "completed",
      "cancelled",
    ];

    if (!allowedStatuses.includes(newStatus)) {
      throw new Error("Invalid status: " + newStatus);
    }

    await updateDoc(doc(db, "applications", applicationId), {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Application status updated to:", newStatus);
    return true;
  } catch (error) {
    console.error("❌ Error updating application:", error);
    throw error;
  }
}

/**
 * Worker withdraws their application
 */
export async function withdrawApplication(jobId) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Please login first");

    const applicationId = jobId + "_" + currentUser.uid;
    await updateDoc(doc(db, "applications", applicationId), {
      status: "withdrawn",
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Application withdrawn");
    return true;
  } catch (error) {
    console.error("❌ Error withdrawing application:", error);
    throw error;
  }
}

// ==========================================
// ⭐ RATINGS COLLECTION
// ==========================================

/**
 * Submit a rating after job completion
 */
export async function submitRating(jobId, revieweeId, rating, comment = "") {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Please login first");

    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const ratingId = jobId + "_" + currentUser.uid;
    const ratingData = {
      jobId: jobId,
      reviewerId: currentUser.uid,
      revieweeId: revieweeId,
      rating: rating,
      comment: comment,
      status: "published",
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, "ratings", ratingId), ratingData);
    console.log("✅ Rating submitted!");
    return ratingId;
  } catch (error) {
    console.error("❌ Error submitting rating:", error);
    throw error;
  }
}

/**
 * Get all ratings for a specific user
 */
export async function getRatingsForUser(userId) {
  try {
    const q = query(
      collection(db, "ratings"),
      where("revieweeId", "==", userId),
      where("status", "==", "published"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting ratings:", error);
    return [];
  }
}

/**
 * Calculate average rating for a user
 */
export async function calculateAverageRating(userId) {
  try {
    const ratings = await getRatingsForUser(userId);
    if (ratings.length === 0) return 0;

    const total = ratings.reduce((sum, r) => sum + r.rating, 0);
    const average = total / ratings.length;
    return Math.round(average * 10) / 10;
  } catch (error) {
    console.error("❌ Error calculating rating:", error);
    return 0;
  }
}

// ==========================================
// 🔔 NOTIFICATIONS COLLECTION
// ==========================================

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId,
  type,
  title,
  message,
  relatedId = null,
) {
  try {
    const notification = {
      userId: userId,
      type: type,
      title: title,
      message: message,
      relatedId: relatedId,
      isRead: false,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "notifications"), notification);
    console.log("✅ Notification created:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    throw error;
  }
}

/**
 * Get all notifications for current user
 */
export async function getMyNotifications() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Please login first");

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(20),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting notifications:", error);
    return [];
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId) {
  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      isRead: true,
    });
    return true;
  } catch (error) {
    console.error("❌ Error marking notification:", error);
    throw error;
  }
}

// ==========================================
// 🎁 WELFARE SCHEMES COLLECTION
// ==========================================

/**
 * Get all active welfare schemes
 */
export async function getAllWelfareSchemes() {
  try {
    const q = query(
      collection(db, "welfareSchemes"),
      where("isActive", "==", true),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting welfare schemes:", error);
    return [];
  }
}

/**
 * Get a single welfare scheme by ID
 */
export async function getWelfareSchemeById(schemeId) {
  try {
    const docSnap = await getDoc(doc(db, "welfareSchemes", schemeId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("❌ Error getting scheme:", error);
    throw error;
  }
}

/**
 * Add a welfare scheme (Admin only)
 */
export async function addWelfareScheme(schemeData) {
  try {
    const scheme = {
      name: schemeData.name || "",
      category: schemeData.category || "",
      summary: schemeData.summary || "",
      eligibility: schemeData.eligibility || [],
      benefits: schemeData.benefits || [],
      documentsRequired: schemeData.documentsRequired || [],
      applicationSteps: schemeData.applicationSteps || [],
      officialUrl: schemeData.officialUrl || "",
      isActive: true,
      createdAt: serverTimestamp(),
      lastUpdatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "welfareSchemes"), scheme);
    console.log("✅ Welfare scheme added:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error adding welfare scheme:", error);
    throw error;
  }
}

// ==========================================
// 🤖 CHATBOT FAQs COLLECTION
// ==========================================

/**
 * Get all active chatbot FAQs
 */
export async function getAllFAQs() {
  try {
    const q = query(
      collection(db, "chatbotFAQs"),
      where("isActive", "==", true),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting FAQs:", error);
    return [];
  }
}

/**
 * Search FAQs by keyword
 */
export async function searchFAQs(keyword) {
  try {
    const allFAQs = await getAllFAQs();
    const lowerKeyword = keyword.toLowerCase();

    return allFAQs.filter(
      (faq) =>
        faq.keywords?.some((k) => k.toLowerCase().includes(lowerKeyword)) ||
        faq.question?.toLowerCase().includes(lowerKeyword),
    );
  } catch (error) {
    console.error("❌ Error searching FAQs:", error);
    return [];
  }
}

/**
 * Add a FAQ (Admin only)
 */
export async function addFAQ(faqData) {
  try {
    const faq = {
      question: faqData.question || "",
      answer: faqData.answer || "",
      keywords: faqData.keywords || [],
      category: faqData.category || "general",
      language: faqData.language || "en",
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "chatbotFAQs"), faq);
    console.log("✅ FAQ added:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error adding FAQ:", error);
    throw error;
  }
}

// ==========================================
// 🚨 REPORTS COLLECTION
// ==========================================

/**
 * Submit a report or complaint
 */
export async function submitReport(reportData) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Please login first");

    const report = {
      reporterId: currentUser.uid,
      reportedUserId: reportData.reportedUserId || null,
      jobId: reportData.jobId || null,
      reportType: reportData.reportType || "other",
      description: reportData.description || "",
      status: "open",
      adminNote: null,
      createdAt: serverTimestamp(),
      resolvedAt: null,
    };

    const docRef = await addDoc(collection(db, "reportsComplaints"), report);
    console.log("✅ Report submitted:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error submitting report:", error);
    throw error;
  }
}

/**
 * Get all open reports (Admin only)
 */
export async function getAllOpenReports() {
  try {
    const q = query(
      collection(db, "reportsComplaints"),
      where("status", "==", "open"),
      orderBy("createdAt", "desc"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting reports:", error);
    return [];
  }
}
