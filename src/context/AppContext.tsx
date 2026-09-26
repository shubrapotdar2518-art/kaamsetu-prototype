import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { User } from "firebase/auth";
import {
  registerWithEmail,
  loginWithEmail,
  logout,
  subscribeToAuthChanges,
} from "../services/authService";
import {
  createUserProfile,
  getUserProfile,
} from "../services/firestoreProfile";
import {
  createWorkerProfileDoc,
  createEmployerProfileDoc,
  getWorkerProfileDoc,
} from "../services/profileService";
import {
  postJobDoc,
  fetchOpenJobs,
  fetchEmployerJobs,
  applyToJobDoc,
  fetchMyAppliedJobIds,
  fetchEmployerApplications,
  updateApplicationStatusDoc,
  type FirestoreJob,
} from "../services/jobService";
import { computeMatchScore } from "../algorithms/recommendation";

export interface JobItem {
  id: string;
  titleKey: string;
  defaultTitle: string;
  category: string;
  wage: number;
  wageUnit: string;
  location: string;
  distance: string;
  matchPercentage?: number;
  badge?: "Match" | "New" | "Urgent";
  postedTime: string;
  employerName: string;
  applied?: boolean;
  description: string;
  workersNeeded: number;
}

export interface JobApplication {
  id: string;
  workerName: string;
  trade: string;
  experience: string;
  location: string;
  phone: string;
  rating: number;
  status: "New" | "Shortlisted" | "Hired" | "Rejected";
  appliedFor: string;
  appliedDate: string;
  avatar: string;
}

export interface EmployerJobPost {
  id: string;
  title: string;
  trade: string;
  applicationsCount: number;
  location: string;
  wage: number;
  status: "Active" | "Filled" | "Urgent";
  postedDate: string;
}

export interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  actionButtons?: { label: string; action: string }[];
}

export interface UserProfile {
  uid?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  landmark?: string;
  city: string;
  pincode: string;
  skills: string;
  experience: string;
  additionalSkills: string;
  dailyWage: string;
  photos: string[];
  avatar: string;
  verified: boolean;
  companyName?: string;
  companyCategory?: string;
  businessType?: string;
}

interface AppContextType {
  userRole: "worker" | "employer";
  setUserRole: (role: "worker" | "employer") => void;
  userProfile: UserProfile;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  jobs: JobItem[];
  applyToJob: (jobId: string) => Promise<void>;
  employerJobPosts: EmployerJobPost[];
  addEmployerJobPost: (
    post: Omit<EmployerJobPost, "id" | "applicationsCount" | "postedDate">,
  ) => void;
  addJobPost: (post: {
    title: string;
    trade: string;
    location: string;
    wage: number;
    openings?: number;
    duration?: string;
    description?: string;
    urgency?: "normal" | "emergency";
  }) => Promise<void>;
  applications: JobApplication[];
  updateApplicationStatus: (
    id: string,
    status: JobApplication["status"],
  ) => Promise<void>;
  chatMessages: ChatMessage[];
  sendChatMessage: (text: string) => void;
  toast: { message: string; type: "success" | "info" | "error" } | null;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
  clearToast: () => void;
  selectedPhotos: string[];
  setSelectedPhotos: React.Dispatch<React.SetStateAction<string[]>>;
  authLoading: boolean;
  registerAccount: (email: string, password: string) => Promise<void>;
  loginAccount: (
    email: string,
    password: string,
  ) => Promise<"worker" | "employer">;
  logoutAccount: () => Promise<void>;
  chooseRoleAndSave: (role: "worker" | "employer") => Promise<void>;
  saveWorkerProfile: (data: {
    skills: string;
    experience: string;
    additionalSkills: string;
    dailyWage: string;
  }) => Promise<void>;
  refreshJobs: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_JOBS: JobItem[] = [
  {
    id: "job-1",
    titleKey: "carpenterHomeWork",
    defaultTitle: "Carpenter for Home Work",
    category: "Carpentry",
    wage: 850,
    wageUnit: "dayWageUnit",
    location: "Andheri West, Mumbai",
    distance: "1.2 km away",
    matchPercentage: 96,
    badge: "Match",
    postedTime: "2 hours ago",
    employerName: "Sharma Interior Solutions",
    description:
      "Need skilled carpenter for modular kitchen fitting and wardrobe door alignment.",
    workersNeeded: 2,
  },
  {
    id: "job-2",
    titleKey: "furnitureInstallation",
    defaultTitle: "Furniture Installation & Fitting",
    category: "Carpentry",
    wage: 900,
    wageUnit: "dayWageUnit",
    location: "Bandra East, Mumbai",
    distance: "3.5 km away",
    matchPercentage: 92,
    badge: "Match",
    postedTime: "4 hours ago",
    employerName: "Apex Woodcraft Ltd",
    description:
      "Assembly of flat-pack office furniture and conference tables.",
    workersNeeded: 3,
  },
  {
    id: "job-3",
    titleKey: "electricianHelper",
    defaultTitle: "Electrician Helper Needed",
    category: "Electrical",
    wage: 650,
    wageUnit: "dayWageUnit",
    location: "Goregaon, Mumbai",
    distance: "2.8 km away",
    badge: "New",
    postedTime: "30 mins ago",
    employerName: "Bright Power Electricals",
    description:
      "Assist master electrician with conduit wiring and switchboard installation.",
    workersNeeded: 2,
  },
  {
    id: "job-4",
    titleKey: "buildingPainter",
    defaultTitle: "Building Exterior Painter",
    category: "Painting",
    wage: 800,
    wageUnit: "dayWageUnit",
    location: "Powai, Mumbai",
    distance: "4.1 km away",
    badge: "New",
    postedTime: "1 hour ago",
    employerName: "Skyline Renovations",
    description:
      "Exterior weather-coat painting for 4-storey commercial building.",
    workersNeeded: 4,
  },
  {
    id: "job-5",
    titleKey: "helperNeeded",
    defaultTitle: "Construction Site Helper",
    category: "General Labour",
    wage: 600,
    wageUnit: "dayWageUnit",
    location: "Malad West, Mumbai",
    distance: "1.8 km away",
    badge: "Urgent",
    postedTime: "Just now",
    employerName: "Amit Enterprises",
    description:
      "Urgent helper needed for material unloading and concrete mixing.",
    workersNeeded: 5,
  },
];

const INITIAL_APPLICATIONS: JobApplication[] = [
  {
    id: "app-1",
    workerName: "Ravi Kumar",
    trade: "Carpenter",
    experience: "3 Years Experience",
    location: "Mumbai, Maharashtra",
    phone: "+91 98765 43210",
    rating: 4.8,
    status: "Shortlisted",
    appliedFor: "Carpenter for Home Work",
    appliedDate: "Today, 9:30 AM",
    avatar: "",
  },
  {
    id: "app-2",
    workerName: "Suresh Yadav",
    trade: "Mason",
    experience: "5 Years Experience",
    location: "Thane, Maharashtra",
    phone: "+91 98234 56781",
    rating: 4.9,
    status: "New",
    appliedFor: "Mason Needed (6 Applications)",
    appliedDate: "Today, 10:15 AM",
    avatar: "",
  },
  {
    id: "app-3",
    workerName: "Imran Sheikh",
    trade: "Plumber",
    experience: "4 Years Experience",
    location: "Kurla, Mumbai",
    phone: "+91 97654 32190",
    rating: 4.7,
    status: "New",
    appliedFor: "Plumber Needed (3 Applications)",
    appliedDate: "Yesterday",
    avatar: "",
  },
  {
    id: "app-4",
    workerName: "Manoj Patel",
    trade: "Electrician",
    experience: "4 Years Experience",
    location: "Borivali, Mumbai",
    phone: "+91 99123 45678",
    rating: 4.6,
    status: "Shortlisted",
    appliedFor: "Electrician Needed",
    appliedDate: "2 days ago",
    avatar: "",
  },
];

const INITIAL_EMPLOYER_POSTS: EmployerJobPost[] = [
  {
    id: "ep-1",
    title: "Electrician Needed",
    trade: "Electrical",
    applicationsCount: 5,
    location: "Andheri East, Mumbai",
    wage: 850,
    status: "Active",
    postedDate: "Yesterday",
  },
  {
    id: "ep-2",
    title: "Plumber Needed",
    trade: "Plumbing",
    applicationsCount: 3,
    location: "Bandra, Mumbai",
    wage: 800,
    status: "Active",
    postedDate: "2 days ago",
  },
  {
    id: "ep-3",
    title: "Mason Needed",
    trade: "Masonry",
    applicationsCount: 6,
    location: "Goregaon West, Mumbai",
    wage: 900,
    status: "Active",
    postedDate: "3 days ago",
  },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

const timeAgo = (seconds?: number | null): string => {
  if (!seconds) return "Just now";
  const m = Math.floor((Date.now() / 1000 - seconds) / 60);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} mins ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hours ago`;
  return `${Math.floor(h / 24)} days ago`;
};

const statusToUi = (s: string): JobApplication["status"] => {
  if (s === "accepted") return "Shortlisted";
  if (s === "in_progress" || s === "completed") return "Hired";
  if (s === "rejected") return "Rejected";
  return "New";
};

const uiToStatus = (s: JobApplication["status"]): string => {
  if (s === "Shortlisted") return "accepted";
  if (s === "Hired") return "in_progress";
  if (s === "Rejected") return "rejected";
  return "pending";
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userRole, setUserRole] = useState<"worker" | "employer">("worker");
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [workerDoc, setWorkerDoc] = useState<Record<string, any> | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    uid: undefined,
    name: "",
    phone: "",
    email: "",
    address: "",
    landmark: "",
    city: "",
    pincode: "",
    skills: "",
    experience: "",
    additionalSkills: "",
    dailyWage: "",
    photos: [],
    avatar: "",
    verified: true,
    companyName: "",
    companyCategory: "",
    businessType: "",
  });

  const [jobs, setJobs] = useState<JobItem[]>(INITIAL_JOBS);
  const [employerJobPosts, setEmployerJobPosts] = useState<EmployerJobPost[]>(
    INITIAL_EMPLOYER_POSTS,
  );
  const [applications, setApplications] =
    useState<JobApplication[]>(INITIAL_APPLICATIONS);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "info" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const clearToast = () => setToast(null);

  const updateUserProfile = (updates: Partial<UserProfile>) =>
    setUserProfile((prev) => ({ ...prev, ...updates }));

  // ─── Load real data from Firestore (falls back to sample data if DB is empty) ───

  const refreshJobs = useCallback(async () => {
    const uid = userProfile.uid;
    if (!uid) return;

    try {
      if (userRole === "worker") {
        const [open, appliedIds] = await Promise.all([
          fetchOpenJobs(),
          fetchMyAppliedJobIds(uid),
        ]);

        // Keep demo data if database is empty — good for presentation
        if (open.length === 0) return;

        const w = workerDoc;
        const mapped: JobItem[] = open.map((j: FirestoreJob) => {
          const match = w
            ? computeMatchScore(
                {
                  primarySkill: w.primarySkill ?? "",
                  skills: w.skills ?? [],
                  location: w.location ?? "",
                  isAvailable: w.isAvailable ?? true,
                  rating: w.rating ?? 0,
                  totalJobs: w.totalJobs ?? 0,
                },
                { trade: j.trade, location: j.location, urgency: j.urgency },
              )
            : undefined;

          return {
            id: j.id,
            titleKey: "customJob",
            defaultTitle: j.title,
            category: j.trade,
            wage: j.wage,
            wageUnit: "dayWageUnit",
            location: j.location,
            distance: j.location,
            matchPercentage: match,
            badge:
              j.urgency === "emergency"
                ? "Urgent"
                : match && match >= 75
                  ? "Match"
                  : "New",
            postedTime: timeAgo(j.postedAt?.seconds),
            employerName: j.employerName,
            applied: appliedIds.includes(j.id),
            description: j.description,
            workersNeeded: j.openings,
          };
        });

        // Show highest match first
        mapped.sort(
          (a, b) => (b.matchPercentage ?? 0) - (a.matchPercentage ?? 0),
        );
        setJobs(mapped);
      } else {
        // Employer: load their jobs and applications
        const [mine, apps] = await Promise.all([
          fetchEmployerJobs(uid),
          fetchEmployerApplications(uid),
        ]);

        if (mine.length > 0) {
          setEmployerJobPosts(
            mine.map((j) => ({
              id: j.id,
              title: j.title,
              trade: j.trade,
              location: j.location,
              wage: j.wage,
              applicationsCount: apps.filter((a) => a.jobId === j.id).length,
              status:
                j.urgency === "emergency"
                  ? "Urgent"
                  : j.status === "open"
                    ? "Active"
                    : "Filled",
              postedDate: timeAgo(j.postedAt?.seconds),
            })),
          );
        }

        if (apps.length > 0) {
          setApplications(
            apps.map((a) => ({
              id: a.id,
              workerName: a.workerName,
              trade: a.workerTrade,
              experience: `${a.workerExperience} Years Experience`,
              location: a.workerLocation,
              phone: a.workerPhone,
              rating: 0,
              status: statusToUi(a.status),
              appliedFor: a.jobTitle,
              appliedDate: timeAgo(a.appliedAt?.seconds),
              avatar: "",
            })),
          );
        }
      }
    } catch (err) {
      console.error("refreshJobs failed:", err);
    }
  }, [userProfile.uid, userRole, workerDoc]);

  useEffect(() => {
    refreshJobs();
  }, [refreshJobs]);

  // ─── Restore session on page refresh ─────────────────────────────────────

  const applyFirestoreUser = async (
    firebaseUser: User,
  ): Promise<"worker" | "employer"> => {
    const profile = (await getUserProfile(firebaseUser.uid)) as any;

    setUserProfile((prev) => ({
      ...prev,
      uid: firebaseUser.uid,
      name: profile?.name ?? prev.name,
      email: profile?.email ?? firebaseUser.email ?? prev.email,
      phone: profile?.phone ?? prev.phone,
      city: profile?.location ?? prev.city,
    }));

    const role: string = profile?.userType ?? "";

    if (role === "worker" || role === "employer") {
      setUserRole(role as "worker" | "employer");
      if (role === "worker") {
        const wd = await getWorkerProfileDoc(firebaseUser.uid);
        setWorkerDoc(wd);
      }
      return role as "worker" | "employer";
    }

    return "worker";
  };

  useEffect(() => {
    const unsub = subscribeToAuthChanges(async (u) => {
      if (u) {
        try {
          await applyFirestoreUser(u);
        } catch (e) {
          console.error("Session restore error:", e);
        }
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // ─── Auth functions ───────────────────────────────────────────────────────

  const registerAccount = async (email: string, password: string) => {
    const u = await registerWithEmail(email, password);
    setUserProfile((prev) => ({ ...prev, uid: u.uid, email }));
  };

  const loginAccount = async (
    email: string,
    password: string,
  ): Promise<"worker" | "employer"> => {
    const u = await loginWithEmail(email, password);
    return applyFirestoreUser(u);
  };

  const logoutAccount = async () => {
    await logout();
    setUserProfile((prev) => ({ ...prev, uid: undefined }));
    setWorkerDoc(null);
    // Restore demo data so app still looks complete after logout
    setJobs(INITIAL_JOBS);
    setEmployerJobPosts(INITIAL_EMPLOYER_POSTS);
    setApplications(INITIAL_APPLICATIONS);
  };

  const chooseRoleAndSave = async (role: "worker" | "employer") => {
    if (!userProfile.uid) throw new Error("Please sign up with email first.");

    await createUserProfile(userProfile.uid, {
      name: userProfile.name,
      email: userProfile.email,
      phone: userProfile.phone,
      userType: role,
      location: userProfile.city,
    });

    if (role === "employer") {
      await createEmployerProfileDoc(userProfile.uid, {
        companyName: userProfile.companyName || userProfile.name,
        contactPerson: userProfile.name,
        location: userProfile.city,
        address: userProfile.address,
      });
    }

    setUserRole(role);
  };

  const saveWorkerProfile = async (data: {
    skills: string;
    experience: string;
    additionalSkills: string;
    dailyWage: string;
  }) => {
    if (!userProfile.uid) throw new Error("Please login first.");

    const extra = data.additionalSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    await createWorkerProfileDoc(userProfile.uid, {
      primarySkill: data.skills,
      skills: [data.skills, ...extra],
      experience: Number(data.experience) || 0,
      dailyRate: Number(data.dailyWage) || 0,
      location: userProfile.city,
      address: userProfile.address,
    });

    const wd = await getWorkerProfileDoc(userProfile.uid);
    setWorkerDoc(wd);
    updateUserProfile(data);
  };

  // ─── Job actions ──────────────────────────────────────────────────────────

  const applyToJob = async (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!userProfile.uid || !job) return;

    try {
      // If it starts with 'job-' it is a demo job (not in Firestore)
      if (jobId.startsWith("job-")) {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, applied: true } : j)),
        );
        showToast("Applied successfully!");
        return;
      }

      // Real job — check employer id from Firestore
      const open = await fetchOpenJobs();
      const fj = open.find((j) => j.id === jobId);
      if (!fj) throw new Error("Job no longer available.");

      await applyToJobDoc(jobId, userProfile.uid, fj.employerId, fj.title);
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, applied: true } : j)),
      );
      showToast(
        "Applied successfully! Employer has received your verified profile.",
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not apply.",
        "error",
      );
    }
  };

  const addJobPost = async (post: {
    title: string;
    trade: string;
    location: string;
    wage: number;
    openings?: number;
    duration?: string;
    description?: string;
    urgency?: "normal" | "emergency";
  }) => {
    if (!userProfile.uid) {
      showToast("Please login first.", "error");
      return;
    }

    try {
      await postJobDoc({
        employerId: userProfile.uid,
        employerName:
          userProfile.companyName || userProfile.name || "Verified Employer",
        title: post.title,
        trade: post.trade,
        location: post.location,
        wage: post.wage,
        openings: post.openings ?? 1,
        duration: post.duration ?? "",
        description: post.description ?? "",
        urgency: post.urgency ?? "normal",
      });

      showToast("Job posted successfully! Broadcasted to local workers.");
      await refreshJobs();
    } catch (err) {
      console.error("addJobPost error:", err);
      showToast("Failed to post job. Please try again.", "error");
    }
  };

  const addEmployerJobPost = (
    post: Omit<EmployerJobPost, "id" | "applicationsCount" | "postedDate">,
  ) => {
    addJobPost({
      title: post.title,
      trade: post.trade,
      location: post.location,
      wage: post.wage,
      urgency: post.status === "Urgent" ? "emergency" : "normal",
    });
  };

  const updateApplicationStatus = async (
    id: string,
    status: JobApplication["status"],
  ) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)),
    );

    // Real Firestore application IDs contain an underscore (jobId_workerId)
    if (id.includes("_")) {
      try {
        await updateApplicationStatusDoc(id, uiToStatus(status));
      } catch (e) {
        console.error("updateApplicationStatus error:", e);
      }
    }

    showToast(`Worker status updated to ${status}`);
  };

  // ─── Chatbot ──────────────────────────────────────────────────────────────

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "m-1",
      sender: "bot",
      text: "Hi! Welcome to KaamSetu Assistant. How can I help you find work or claim benefits today?",
      time: "10:00 AM",
      actionButtons: [
        { label: "Show me nearby jobs", action: "jobs" },
        { label: "How to get paid?", action: "payment" },
        { label: "Welfare schemes for workers", action: "welfare" },
      ],
    },
  ]);

  const sendChatMessage = (text: string) => {
    const now = () =>
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setChatMessages((prev) => [
      ...prev,
      { id: `msg-${Date.now()}`, sender: "user", text, time: now() },
    ]);

    setTimeout(() => {
      const lower = text.toLowerCase();
      let reply =
        "I am checking available options for you on KaamSetu. You have 5 high-paying daily jobs nearby!";

      if (lower.includes("job") || lower.includes("work")) {
        const top = jobs
          .slice(0, 2)
          .map(
            (j, i) =>
              `${i + 1}. ${j.defaultTitle} (₹${j.wage}/day - ${j.location})`,
          )
          .join("\n");
        reply = `Here are your top matches:\n${top}\nOpen Recommended Jobs tab to apply.`;
      } else if (lower.includes("paid") || lower.includes("payment")) {
        reply =
          "Employers release daily wages via UPI, bank transfer, or cash after job completion. No middlemen fees!";
      } else if (
        lower.includes("scheme") ||
        lower.includes("welfare") ||
        lower.includes("insurance")
      ) {
        reply =
          "Check the Welfare Schemes tab for E-Shram, PM Shram Yogi Maandhan, and Ayushman Bharat eligibility details.";
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: "bot",
          text: reply,
          time: now(),
        },
      ]);
    }, 600);
  };

  // ─── Provider value ───────────────────────────────────────────────────────

  return (
    <AppContext.Provider
      value={{
        userRole,
        setUserRole,
        userProfile,
        updateUserProfile,
        jobs,
        applyToJob,
        employerJobPosts,
        addEmployerJobPost,
        addJobPost,
        applications,
        updateApplicationStatus,
        chatMessages,
        sendChatMessage,
        toast,
        showToast,
        clearToast,
        selectedPhotos,
        setSelectedPhotos,
        authLoading,
        registerAccount,
        loginAccount,
        logoutAccount,
        chooseRoleAndSave,
        saveWorkerProfile,
        refreshJobs,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
