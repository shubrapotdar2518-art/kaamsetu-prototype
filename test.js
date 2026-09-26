// test.js
import { registerUser } from "./auth.js";
import {
  createWorkerProfile,
  getUserById,
  getWorkerProfile,
} from "./database.js";

async function runDatabaseTest() {
  console.log("🚀 Starting KaamSetu Database Test...");

  try {
    // 1. Create a unique email for testing (to avoid "email already in use" errors)
    const testEmail =
      "worker_" + Math.floor(Math.random() * 1000) + "@test.com";
    const password = "password123";

    const profileData = {
      name: "Ramesh Kumar",
      phone: "9876543210",
      userType: "worker",
      location: "Mumbai",
    };

    console.log("⏳ Step 1: Registering a new worker user...");
    const user = await registerUser(testEmail, password, profileData);
    console.log(
      "✅ User created in Auth and 'users' collection. UID:",
      user.uid,
    );

    // 2. Create the Worker Profile
    console.log("⏳ Step 2: Creating the detailed Worker Profile...");
    const workerData = {
      skills: ["Plumbing", "Pipe Repair"],
      primarySkill: "Plumber",
      experience: 5,
      dailyRate: 600,
      location: "Mumbai",
      bio: "Expert plumber with 5 years experience",
    };

    const workerId = await createWorkerProfile(workerData);
    console.log("✅ Worker Profile created in 'workers' collection!");

    // 3. Verify data retrieval
    console.log("⏳ Step 3: Fetching data back from database...");
    const fetchedUser = await getUserById(user.uid);
    const fetchedWorker = await getWorkerProfile(user.uid);

    console.log("📋 Data Found for User:", fetchedUser.name);
    console.log("📋 Skills Found in Profile:", fetchedWorker.skills.join(", "));

    alert("🎉 TEST SUCCESSFUL! Check your Firebase Console now!");
  } catch (error) {
    console.error("❌ Test Failed:", error.message);
    alert("Test Failed: " + error.message);
  }
}

// Make the function available globally so we can trigger it
window.runDatabaseTest = runDatabaseTest;
