// test.js
import { addWorker, addJob, getAllWorkers, getOpenJobs } from "./database.js";
import { auth } from "./firebase-config.js";
import { signInAnonymously } from "firebase/auth";
console.log("🧪 Testing KaamSetu Database...\n");

async function runTest() {
    console.log("Signing in anonymously...");

  const userCredential = await signInAnonymously(auth);

  console.log("✅ Signed in as test user:", userCredential.user.uid);
  // TEST 1: Add a worker
  console.log("Test 1: Adding a worker...");
  await addWorker({
    name: "Ramesh Kumar",
    skill: "Plumber",
    location: "Mumbai",
    dailyRate: 600,
    isAvailable: true,
    phone: "9876543210"
  });

  // TEST 2: Add a job
  console.log("\nTest 2: Adding a job...");
  await addJob({
    title: "Need Plumber for Bathroom",
    skillRequired: "Plumber",
    location: "Andheri, Mumbai",
    dailyWage: 700,
    duration: "2 days"
  });

  // TEST 3: Get all workers
  console.log("\nTest 3: Fetching all workers...");
  const workers = await getAllWorkers();
  console.log("Total workers:", workers.length);
  console.log("Workers:", workers);

  // TEST 4: Get all open jobs
  console.log("\nTest 4: Fetching open jobs...");
  const jobs = await getOpenJobs();
  console.log("Total jobs:", jobs.length);
  console.log("Jobs:", jobs);

  console.log("\n🎉 All tests completed!");
}

runTest();
