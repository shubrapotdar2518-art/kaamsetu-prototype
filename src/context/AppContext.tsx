import React, { createContext, useContext, useState, useEffect } from "react";
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
  applyToJob: (jobId: string) => void;
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
  }) => void;
  applications: JobApplication[];
  updateApplicationStatus: (
    id: string,
    status: JobApplication["status"],
  ) => void;
  chatMessages: ChatMessage[];
  sendChatMessage: (text: string) => void;
  toast: { message: string; type: "success" | "info" | "error" } | null;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
  clearToast: () => void;
  selectedPhotos: string[];
  setSelectedPhotos: React.Dispatch<React.SetStateAction<string[]>>;

  // ===== NEW: Real Firebase authentication =====
  authLoading: boolean;
  registerAccount: (email: string, password: string) => Promise<void>;
  loginAccount: (email: string, password: string) => Promise<void>;
  logoutAccount: () => Promise<void>;
  chooseRoleAndSave: (role: "worker" | "employer") => Promise<void>;
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
      "Need skilled carpenter for modular kitchen fitting and wardrobe door alignment. Full day work, lunch provided.",
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
      "Assembly of flat-pack office furniture and conference tables. Tools will be provided on site.",
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
      "Assist master electrician with conduit wiring and switchboard installation in a residential complex.",
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
      "Exterior weather-coat painting for 4-storey commercial building. Safety harnesses provided.",
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
      "Urgent helper needed for material unloading and concrete mixing assistance. Immediate cash payout at 6 PM.",
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userRole, setUserRole] = useState<"worker" | "employer">("worker");
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [authLoading, setAuthLoading] = useState(true);

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
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const clearToast = () => setToast(null);

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...updates }));
  };

  // ===== NEW: Restore login session on page refresh =====
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(
      async (firebaseUser: User | null) => {
        if (firebaseUser) {
          try {
            const profile = await getUserProfile(firebaseUser.uid);

            if (profile) {
              setUserProfile((prev) => ({
                ...prev,
                uid: firebaseUser.uid,
                name: (profile as any).name ?? prev.name,
                email: (profile as any).email ?? prev.email,
                phone: (profile as any).phone ?? prev.phone,
                city: (profile as any).location ?? prev.city,
              }));

              const savedRole = (profile as any).userType;
              if (savedRole === "worker" || savedRole === "employer") {
                setUserRole(savedRole);
              }
            } else {
              setUserProfile((prev) => ({ ...prev, uid: firebaseUser.uid }));
            }
          } catch (error) {
            console.error("Error restoring session:", error);
          }
        }
        setAuthLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // ===== NEW: Create real Firebase account =====
  const registerAccount = async (email: string, password: string) => {
    const firebaseUser = await registerWithEmail(email, password);
    setUserProfile((prev) => ({ ...prev, uid: firebaseUser.uid, email }));
  };

  // ===== NEW: Login with real Firebase account =====
  const loginAccount = async (email: string, password: string) => {
    const firebaseUser = await loginWithEmail(email, password);
    const profile = await getUserProfile(firebaseUser.uid);

    setUserProfile((prev) => ({
      ...prev,
      uid: firebaseUser.uid,
      name: (profile as any)?.name ?? prev.name,
      email: (profile as any)?.email ?? email,
      phone: (profile as any)?.phone ?? prev.phone,
      city: (profile as any)?.location ?? prev.city,
    }));

    const savedRole = (profile as any)?.userType;
    if (savedRole === "worker" || savedRole === "employer") {
      setUserRole(savedRole);
    }
  };

  // ===== NEW: Logout =====
  const logoutAccount = async () => {
    await logout();
    setUserProfile((prev) => ({ ...prev, uid: undefined }));
  };

  // ===== NEW: Save role + create Firestore users/{uid} document =====
  const chooseRoleAndSave = async (role: "worker" | "employer") => {
    if (!userProfile.uid) {
      throw new Error("Please sign up with email first.");
    }

    await createUserProfile(userProfile.uid, {
      name: userProfile.name,
      email: userProfile.email,
      phone: userProfile.phone,
      userType: role,
      location: userProfile.city,
    });

    setUserRole(role);
  };

  const applyToJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === jobId ? { ...job, applied: true } : job)),
    );
    showToast(
      "Applied successfully! Employer has received your verified profile.",
    );
  };

  const addEmployerJobPost = (
    post: Omit<EmployerJobPost, "id" | "applicationsCount" | "postedDate">,
  ) => {
    const newPost: EmployerJobPost = {
      ...post,
      id: `ep-${Date.now()}`,
      applicationsCount: 0,
      postedDate: "Just now",
    };
    setEmployerJobPosts((prev) => [newPost, ...prev]);
    showToast(
      "Job requirement posted! Instant SMS sent to 18 verified nearby workers.",
    );
  };

  const addJobPost = (post: {
    title: string;
    trade: string;
    location: string;
    wage: number;
    openings?: number;
    duration?: string;
    description?: string;
  }) => {
    const newPost: EmployerJobPost = {
      id: `ep-${Date.now()}`,
      title: post.title,
      trade: post.trade,
      location: post.location,
      wage: post.wage,
      applicationsCount: 0,
      status: "Active",
      postedDate: "Just now",
    };
    setEmployerJobPosts((prev) => [newPost, ...prev]);

    const newJobItem: JobItem = {
      id: `job-${Date.now()}`,
      titleKey: "customJob",
      defaultTitle: post.title,
      category: post.trade,
      wage: post.wage,
      wageUnit: "dayWageUnit",
      location: post.location,
      distance: "0.8 km away",
      badge: "New",
      postedTime: "Just now",
      employerName:
        userProfile.name || userProfile.companyName || "Verified Employer",
      description:
        post.description || "Direct requirement posted by verified employer.",
      workersNeeded: post.openings || 1,
    };
    setJobs((prev) => [newJobItem, ...prev]);
    showToast("Job posted successfully! Broadcasted to local workers.");
  };

  const updateApplicationStatus = (
    id: string,
    status: JobApplication["status"],
  ) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status } : app)),
    );
    showToast(`Worker status updated to ${status}`);
  };

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
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChatMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      let botResponse =
        "I am checking available options for you on KaamSetu. You have 5 high-paying daily jobs nearby!";
      const lower = text.toLowerCase();

      if (lower.includes("job") || lower.includes("work")) {
        botResponse =
          "Here are the top matches for you in Andheri & Bandra:\n1. Carpenter for Home Work (₹850/day - 1.2km)\n2. Furniture Installation & Fitting (₹900/day - 3.5km)\nWould you like me to apply on your behalf?";
      } else if (lower.includes("paid") || lower.includes("payment")) {
        botResponse =
          "With KaamSetu Guaranteed Payouts, employers release daily wages via UPI/Direct Bank Transfer or Cash upon job completion before 7:00 PM. No middlemen fees!";
      } else if (
        lower.includes("scheme") ||
        lower.includes("welfare") ||
        lower.includes("insurance")
      ) {
        botResponse =
          "You are eligible for Ayushman Shramik Health Cover (₹5 Lakhs free hospitalization) and PMSYM Pension (₹3,000/month after age 60). Check the Welfare Schemes tab to apply in 1-click!";
      }

      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "bot",
        text: botResponse,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setChatMessages((prev) => [...prev, botMsg]);
    }, 600);
  };

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
