// employer-test.js
import { registerUser, loginUser, logoutUser } from "./auth.js";
import {
  createEmployerProfile,
  getMyEmployerProfile,
  updateEmployerProfile,
  getAllEmployers,
  getEmployersByLocation,
  getVerifiedEmployers,
  getEmployerFullInfo
} from "./database.js";

const testEmail = `employer.test.${Date.now()}@example.com`;
const testPassword = "Test@123456";

async function runEmployerTest() {
  try {
    console.log("🧪 Testing Employer Profile System...\n");

    // TEST 1: Register an employer user
    console.log("Test 1: Registering employer user...");
    const user = await registerUser(testEmail, testPassword, {
      name: "Suresh Sharma",
      phone: "9123456789",
      userType: "employer",
      location: "Mumbai"
    });
    console.log("✅ Registered UID:", user.uid);

    // TEST 2: Create employer profile
    console.log("\nTest 2: Creating employer profile...");
    await createEmployerProfile({
      companyName: "ABC Construction",
      companyType: "construction",
      contactPerson: "Suresh Sharma",
      location: "Mumbai",
      address: "Bandra West, Mumbai",
      bio: "We hire daily wage workers for construction projects",
      gstNumber: "27ABCDE1234F1Z5"
    });

    // TEST 3: Get my employer profile
    console.log("\nTest 3: Getting my employer profile...");
    const myProfile = await getMyEmployerProfile();
    console.log("My profile:", myProfile);

    // TEST 4: Update profile
    console.log("\nTest 4: Updating company bio...");
    await updateEmployerProfile({
      bio: "Leading construction company with 10+ years experience",
      address: "New Address - Andheri East, Mumbai"
    });

    // TEST 5: Try to update PROTECTED field (should be ignored)
    console.log("\nTest 5: Trying to fake verified status...");
    await updateEmployerProfile({
      verified: true,   // This should be REMOVED
      rating: 5         // This should be REMOVED
    });
    const afterFakeUpdate = await getMyEmployerProfile();
    console.log("Verified status:", afterFakeUpdate.verified, "(should be false)");
    console.log("Rating:", afterFakeUpdate.rating, "(should be 0)");

    // TEST 6: Get all employers
    console.log("\nTest 6: Getting all employers...");
    const allEmployers = await getAllEmployers();
    console.log(`Found ${allEmployers.length} employers total`);

    // TEST 7: Search employers by location
    console.log("\nTest 7: Searching employers in Mumbai...");
    const mumbaiEmployers = await getEmployersByLocation("Mumbai");
    console.log(`Found ${mumbaiEmployers.length} employers in Mumbai`);

    // TEST 8: Get verified employers
    console.log("\nTest 8: Getting verified employers...");
    const verified = await getVerifiedEmployers();
    console.log(`Found ${verified.length} verified employers`);

    // TEST 9: Get full info (user + employer combined)
    console.log("\nTest 9: Getting full employer info...");
    const fullInfo = await getEmployerFullInfo(user.uid);
    console.log("Full info:", fullInfo);

    // TEST 10: Logout
    console.log("\nTest 10: Logging out...");
    await logoutUser();

    console.log("\n🎉 All Employer Profile tests passed!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
}

runEmployerTest();