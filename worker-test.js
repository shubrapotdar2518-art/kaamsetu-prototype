// worker-test.js
import { registerUser, loginUser, logoutUser } from "./auth.js";
import {
  createWorkerProfile,
  getMyWorkerProfile,
  updateWorkerProfile,
  toggleAvailability,
  getAllWorkers,
  getWorkersBySkill,
  getWorkersByLocation,
  searchWorkers,
  getWorkerFullInfo
} from "./database.js";

const testEmail = `worker.test.${Date.now()}@example.com`;
const testPassword = "Test@123456";

async function runWorkerTest() {
  try {
    console.log("🧪 Testing Worker Profile System...\n");

    // TEST 1: Register a worker user
    console.log("Test 1: Registering worker user...");
    const user = await registerUser(testEmail, testPassword, {
      name: "Ramesh Kumar",
      phone: "9876543210",
      userType: "worker",
      location: "Mumbai"
    });
    console.log("✅ Registered UID:", user.uid);

    // TEST 2: Create worker profile
    console.log("\nTest 2: Creating worker profile...");
    await createWorkerProfile({
      skills: ["plumber", "electrician"],
      primarySkill: "plumber",
      experience: 5,
      dailyRate: 600,
      location: "Mumbai",
      address: "Andheri West",
      bio: "5 years experienced plumber",
      languages: ["Hindi", "English"],
      hasOwnTools: true
    });

    // TEST 3: Get my profile
    console.log("\nTest 3: Getting my worker profile...");
    const myProfile = await getMyWorkerProfile();
    console.log("My profile:", myProfile);

    // TEST 4: Update profile
    console.log("\nTest 4: Updating daily rate to 700...");
    await updateWorkerProfile({
      dailyRate: 700,
      bio: "6 years experienced plumber - price increased"
    });

    // TEST 5: Toggle availability
    console.log("\nTest 5: Toggling availability...");
    const status = await toggleAvailability();
    console.log("Now available?", status);

    // Turn back to available for search tests
    await toggleAvailability();

    // TEST 6: Search by skill
    console.log("\nTest 6: Searching workers with skill 'plumber'...");
    const plumbers = await getWorkersBySkill("plumber");
    console.log(`Found ${plumbers.length} plumbers`);

    // TEST 7: Search by location
    console.log("\nTest 7: Searching workers in Mumbai...");
    const mumbaiWorkers = await getWorkersByLocation("Mumbai");
    console.log(`Found ${mumbaiWorkers.length} workers in Mumbai`);

    // TEST 8: Search by skill + location
    console.log("\nTest 8: Searching plumbers in Mumbai...");
    const results = await searchWorkers("plumber", "Mumbai");
    console.log(`Found ${results.length} plumbers in Mumbai`);

    // TEST 9: Get full info (user + worker combined)
    console.log("\nTest 9: Getting full worker info...");
    const fullInfo = await getWorkerFullInfo(user.uid);
    console.log("Full info:", fullInfo);

    // TEST 10: Logout
    console.log("\nTest 10: Logging out...");
    await logoutUser();

    console.log("\n🎉 All Worker Profile tests passed!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
}

runWorkerTest();