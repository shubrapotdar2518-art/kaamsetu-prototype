// test.js
import { 
  createUser, 
  getUserById, 
  getAllUsers,
  getUserByPhone,
  getUsersByType,
  updateUser
} from "./database.js";
import { auth } from "./firebase-config.js";
import { signInAnonymously } from "firebase/auth";

console.log("🧪 Testing KaamSetu USER System...\n");

async function runTest() {
  
  // Sign in first
  console.log("Signing in anonymously...");
  const userCredential = await signInAnonymously(auth);
  console.log("✅ Signed in:", userCredential.user.uid, "\n");

  // TEST 1: Create a WORKER user
  console.log("Test 1: Creating a WORKER user...");
  const workerUserId = await createUser({
    name: "Ramesh Kumar",
    phone: "9876543210",
    email: "ramesh@gmail.com",
    userType: "worker",
    location: "Mumbai"
  });

  // TEST 2: Create an EMPLOYER user
  console.log("\nTest 2: Creating an EMPLOYER user...");
  const employerUserId = await createUser({
    name: "Suresh Sharma",
    phone: "9123456789",
    email: "suresh@company.com",
    userType: "employer",
    location: "Mumbai"
  });

  // TEST 3: Get user by ID
  console.log("\nTest 3: Getting worker user by ID...");
  const workerUser = await getUserById(workerUserId);
  console.log("Found user:", workerUser);

  // TEST 4: Get user by phone
  console.log("\nTest 4: Getting user by phone number...");
  const userByPhone = await getUserByPhone("9876543210");
  console.log("Found by phone:", userByPhone);

  // TEST 5: Get all workers (userType = "worker")
  console.log("\nTest 5: Getting all WORKER type users...");
  const allWorkerUsers = await getUsersByType("worker");
  console.log("Total worker users:", allWorkerUsers.length);

  // TEST 6: Get all employers
  console.log("\nTest 6: Getting all EMPLOYER type users...");
  const allEmployerUsers = await getUsersByType("employer");
  console.log("Total employer users:", allEmployerUsers.length);

  // TEST 7: Update user info
  console.log("\nTest 7: Updating user's location...");
  await updateUser(workerUserId, { location: "Delhi" });
  const updatedUser = await getUserById(workerUserId);
  console.log("Updated user location:", updatedUser.location);

  // TEST 8: Get all users
  console.log("\nTest 8: Getting ALL users in database...");
  const allUsers = await getAllUsers();
  console.log("Total users in DB:", allUsers.length);

  console.log("\n🎉 All USER tests completed!");
  process.exit(0);  // Cleanly exit
}

runTest();