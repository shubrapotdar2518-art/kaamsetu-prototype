# KaamSetu Firestore Database Schema

This is the single source of truth for all collection and field names.
All team members (frontend, backend, database) MUST use these exact names.

Firebase Project: KaamSetu
Database: Cloud Firestore
Config file: firebase-config.js (loads keys from .env)
Functions file: database.js and auth.js

---

## Important Rules

1. Never store passwords in Firestore. Firebase Authentication handles passwords.
2. Use these exact field names. Do NOT invent new names like `jobTitle` or `userRole`.
3. Document IDs for `users`, `workers`, and `employers` are always the Firebase Auth UID.
4. All timestamps use `serverTimestamp()`.
5. Only admin can be created by manually changing `userType` in Firebase Console.

---

## Allowed Values (Use Exactly These)

### userType

- `worker`
- `employer`
- `admin`

### job urgency

- `normal`
- `emergency`

### job status

- `open`
- `assigned`
- `in_progress`
- `completed`
- `cancelled`

### application status

- `pending`
- `accepted`
- `rejected`
- `withdrawn`
- `in_progress`
- `completed`
- `cancelled`

### rating status

- `published`
- `flagged`
- `removed`

### report status

- `open`
- `under_review`
- `resolved`
- `rejected`

### report type

- `fake_profile`
- `unsafe_job`
- `misconduct`
- `payment_issue`
- `abusive_review`
- `spam`
- `other`

---

## 1. users

Document ID: Firebase Auth UID
Created by: registerUser() in auth.js

| Field     | Type      | Example            |
| --------- | --------- | ------------------ |
| userId    | string    | "abc123xyz"        |
| name      | string    | "Ramesh Kumar"     |
| email     | string    | "ramesh@gmail.com" |
| phone     | string    | "9876543210"       |
| userType  | string    | "worker"           |
| location  | string    | "Mumbai"           |
| isActive  | boolean   | true               |
| createdAt | timestamp | serverTimestamp()  |

---

## 2. workers

Document ID: Firebase Auth UID (same as users)
Created by: createWorkerProfile() in database.js

| Field        | Type             | Example                     |
| ------------ | ---------------- | --------------------------- |
| userId       | string           | "abc123xyz"                 |
| skills       | array of strings | ["plumbing", "pipe repair"] |
| primarySkill | string           | "Plumber"                   |
| experience   | number           | 5                           |
| dailyRate    | number           | 800                         |
| location     | string           | "Mumbai"                    |
| address      | string           | "Andheri East, Mumbai"      |
| isAvailable  | boolean          | true                        |
| rating       | number           | 0 (system-controlled)       |
| totalJobs    | number           | 0 (system-controlled)       |
| bio          | string           | "Expert plumber"            |
| languages    | array of strings | ["Hindi", "Marathi"]        |
| hasOwnTools  | boolean          | true                        |
| createdAt    | timestamp        | serverTimestamp()           |
| updatedAt    | timestamp        | serverTimestamp()           |

Note: `rating` and `totalJobs` cannot be changed by the worker (protected by security rules).

---

## 3. employers

Document ID: Firebase Auth UID (same as users)
Created by: createEmployerProfile() in database.js

| Field           | Type      | Example                      |
| --------------- | --------- | ---------------------------- |
| userId          | string    | "def456uvw"                  |
| companyName     | string    | "Sharma Construction"        |
| companyType     | string    | "Construction"               |
| contactPerson   | string    | "Amit Sharma"                |
| location        | string    | "Mumbai"                     |
| address         | string    | "Dadar, Mumbai"              |
| totalJobsPosted | number    | 0 (system-controlled)        |
| activeJobs      | number    | 0 (system-controlled)        |
| rating          | number    | 0 (system-controlled)        |
| verified        | boolean   | false (admin-controlled)     |
| bio             | string    | "Local construction company" |
| gstNumber       | string    | ""                           |
| createdAt       | timestamp | serverTimestamp()            |
| updatedAt       | timestamp | serverTimestamp()            |

---

## 4. jobs

Document ID: Auto-generated
Created by: postJob() in database.js

| Field           | Type      | Example                    |
| --------------- | --------- | -------------------------- |
| employerId      | string    | "def456uvw"                |
| title           | string    | "Urgent Plumber Required"  |
| trade           | string    | "Plumbing"                 |
| location        | string    | "Andheri East, Mumbai"     |
| address         | string    | "Lokhandwala Complex"      |
| wage            | number    | 900                        |
| openings        | number    | 1                          |
| duration        | string    | "1 Day"                    |
| description     | string    | "Fix leaking kitchen pipe" |
| urgency         | string    | "emergency"                |
| requiredDate    | string    | "2026-09-20"               |
| status          | string    | "open"                     |
| applicantsCount | number    | 0                          |
| hiredCount      | number    | 0                          |
| postedAt        | timestamp | serverTimestamp()          |
| updatedAt       | timestamp | serverTimestamp()          |

Frontend note: The Post Job form uses `trade` (not `category`).

---

## 5. applications

Document ID: `{jobId}_{workerId}` (prevents duplicate applications)
Created by: applyForJob() in database.js

| Field     | Type      | Example                |
| --------- | --------- | ---------------------- |
| jobId     | string    | "job123"               |
| workerId  | string    | "abc123xyz"            |
| message   | string    | "I am available today" |
| status    | string    | "pending"              |
| appliedAt | timestamp | serverTimestamp()      |
| updatedAt | timestamp | serverTimestamp()      |

---

## 6. ratings

Document ID: `{jobId}_{reviewerId}` (one rating per person per job)
Created by: submitRating() in database.js

| Field      | Type      | Example            |
| ---------- | --------- | ------------------ |
| jobId      | string    | "job123"           |
| reviewerId | string    | "def456uvw"        |
| revieweeId | string    | "abc123xyz"        |
| rating     | number    | 5 (must be 1 to 5) |
| comment    | string    | "Good work"        |
| status     | string    | "published"        |
| createdAt  | timestamp | serverTimestamp()  |

---

## 7. notifications

Document ID: Auto-generated
Created by: createNotification() in database.js

| Field     | Type           | Example                         |
| --------- | -------------- | ------------------------------- |
| userId    | string         | "abc123xyz" (recipient)         |
| type      | string         | "application_received"          |
| title     | string         | "New application"               |
| message   | string         | "A worker applied for your job" |
| relatedId | string or null | "job123"                        |
| isRead    | boolean        | false                           |
| createdAt | timestamp      | serverTimestamp()               |

---

## 8. welfareSchemes

Document ID: Auto-generated
Created by: Admin via Firebase Console or addWelfareScheme()
Readable by: Everyone (public, no login required)

| Field             | Type             | Example                                     |
| ----------------- | ---------------- | ------------------------------------------- |
| name              | string           | "E-Shram"                                   |
| category          | string           | "Worker Registration"                       |
| summary           | string           | "National database for unorganised workers" |
| eligibility       | array of strings | ["Age 16-59", "Unorganised worker"]         |
| benefits          | array of strings | ["Accident insurance"]                      |
| documentsRequired | array of strings | ["Aadhaar", "Bank account"]                 |
| applicationSteps  | array of strings | ["Visit portal", "Enter Aadhaar"]           |
| officialUrl       | string           | "https://eshram.gov.in"                     |
| isActive          | boolean          | true                                        |
| createdAt         | timestamp        | serverTimestamp()                           |
| lastUpdatedAt     | timestamp        | serverTimestamp()                           |

---

## 9. chatbotFAQs

Document ID: Auto-generated
Created by: Admin via Firebase Console or addFAQ()
Readable by: Everyone (public, no login required)

| Field     | Type             | Example                      |
| --------- | ---------------- | ---------------------------- |
| question  | string           | "How do I apply for a job?"  |
| answer    | string           | "Open a job and click Apply" |
| keywords  | array of strings | ["apply", "job"]             |
| category  | string           | "jobs"                       |
| language  | string           | "en"                         |
| isActive  | boolean          | true                         |
| createdAt | timestamp        | serverTimestamp()            |
| updatedAt | timestamp        | serverTimestamp()            |

---

## 10. reportsComplaints

Document ID: Auto-generated
Created by: submitReport() in database.js

| Field          | Type              | Example                |
| -------------- | ----------------- | ---------------------- |
| reporterId     | string            | "abc123xyz"            |
| reportedUserId | string or null    | "def456uvw"            |
| jobId          | string or null    | "job123"               |
| reportType     | string            | "unsafe_job"           |
| description    | string            | "Employer did not pay" |
| status         | string            | "open"                 |
| adminNote      | string or null    | null                   |
| createdAt      | timestamp         | serverTimestamp()      |
| resolvedAt     | timestamp or null | null                   |

---

## Available Functions (Import from database.js / auth.js)

### Authentication (auth.js)

- registerUser(email, password, profileData)
- loginUser(email, password)
- logoutUser()
- getMyProfile()
- waitForAuthState()

### Users

- getUserById(userId)
- getAllUsers()

### Workers

- createWorkerProfile(workerData)
- getWorkerProfile(userId)
- getMyWorkerProfile()
- updateWorkerProfile(updatedData)
- toggleAvailability()
- getAllWorkers()
- getWorkersBySkill(skill)
- getWorkersByLocation(location)
- searchWorkers(skill, location)
- getWorkerFullInfo(userId)

### Employers

- createEmployerProfile(employerData)
- getEmployerProfile(userId)
- getMyEmployerProfile()
- updateEmployerProfile(updatedData)
- getAllEmployers()
- getEmployersByLocation(location)
- getVerifiedEmployers()
- getEmployerFullInfo(userId)

### Jobs

- postJob(jobData)
- getAllOpenJobs()
- getEmergencyJobs()
- getMyPostedJobs()
- getJobById(jobId)
- getJobsByTrade(trade)
- updateJobStatus(jobId, newStatus)
- deleteJob(jobId)

### Applications

- applyForJob(jobId, message)
- getApplicationsForJob(jobId)
- getMyApplications()
- updateApplicationStatus(applicationId, newStatus)
- withdrawApplication(jobId)

### Ratings

- submitRating(jobId, revieweeId, rating, comment)
- getRatingsForUser(userId)
- calculateAverageRating(userId)

### Notifications

- createNotification(userId, type, title, message, relatedId)
- getMyNotifications()
- markNotificationRead(notificationId)

### Welfare Schemes

- getAllWelfareSchemes()
- getWelfareSchemeById(schemeId)
- addWelfareScheme(schemeData)

### Chatbot

- getAllFAQs()
- searchFAQs(keyword)
- addFAQ(faqData)

### Reports

- submitReport(reportData)
- getAllOpenReports()

---

## Setup Instructions for Teammates

1. Pull the `database` branch.
2. Create a file named `.env` in the root folder.
3. Ask the database member for the 6 VITE*FIREBASE* values and paste them into `.env`.
4. Run `npm install`.
5. Run `npm run dev`.
6. Open http://localhost:5173/test-database.html and click "Test Connection" to verify.
