// auth-test.js

import {
  registerUser,
  loginUser,
  logoutUser,
  getMyProfile
} from "./auth.js";

// A unique test email is generated each time.
const testEmail = `kaamsetu.test.${Date.now()}@example.com`;
const testPassword = "Test@123456";

async function runAuthenticationTest() {
  try {
    console.log("🧪 Starting authentication test...\n");

    // Test 1: Register
    console.log("Test 1: Registering worker...");

    const registeredUser = await registerUser(
      testEmail,
      testPassword,
      {
        name: "Authentication Test Worker",
        phone: "9999999999",
        userType: "worker",
        location: "Mumbai"
      }
    );

    console.log("Registered UID:", registeredUser.uid);

    // Test 2: Read profile
    console.log("\nTest 2: Reading profile...");

    const profile = await getMyProfile();

    console.log("Profile:", profile);

    // Test 3: Logout
    console.log("\nTest 3: Logging out...");

    await logoutUser();

    // Test 4: Login again
    console.log("\nTest 4: Logging in again...");

    await loginUser(testEmail, testPassword);

    // Test 5: Read profile after login
    console.log("\nTest 5: Reading profile after login...");

    const profileAfterLogin = await getMyProfile();

    console.log("Logged-in profile:", profileAfterLogin);

    console.log("\n🎉 All authentication tests passed!");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Authentication test failed.");
    console.error("Code:", error.code);
    console.error("Message:", error.message);

    process.exit(1);
  }
}

runAuthenticationTest();