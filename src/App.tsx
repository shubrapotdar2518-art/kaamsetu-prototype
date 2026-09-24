import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import { AppProvider } from "./context/AppContext";
import { Toast } from "./components/Toast";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { WelcomePage } from "./pages/onboarding/WelcomePage";
import { LanguagePage } from "./pages/onboarding/LanguagePage";
import { SignUpOptionsPage } from "./pages/onboarding/SignUpOptionsPage";
import { CreateAccountPage } from "./pages/onboarding/CreateAccountPage";
import { VerifyOtpPage } from "./pages/onboarding/VerifyOtpPage";
import { BasicDetailsPage } from "./pages/onboarding/BasicDetailsPage";
import { ChooseRolePage } from "./pages/onboarding/ChooseRolePage";
import { WorkerDetailsPage } from "./pages/onboarding/WorkerDetailsPage";
import { LoginPage } from "./pages/onboarding/LoginPage";

import { WorkerDashboardPage } from "./pages/worker/WorkerDashboardPage";
import { RecommendedJobsPage } from "./pages/worker/RecommendedJobsPage";
import { AvailableJobsPage } from "./pages/worker/AvailableJobsPage";
import { ChatAssistantPage } from "./pages/worker/ChatAssistantPage";
import { WelfareSchemesPage } from "./pages/worker/WelfareSchemesPage";
import { MessagesPage } from "./pages/worker/MessagesPage";
import { WorkerProfilePage } from "./pages/worker/WorkerProfilePage";

import { EmployerDashboardPage } from "./pages/employer/EmployerDashboardPage";
import { PostJobPage } from "./pages/employer/PostJobPage";
import { EmergencyHiringPage } from "./pages/employer/EmergencyHiringPage";
import { EmployerMessagesPage } from "./pages/employer/EmployerMessagesPage";
import { EmployerProfilePage } from "./pages/employer/EmployerProfilePage";
import { SettingsPage } from "./pages/common/SettingsPage";

const W = (el: React.ReactNode) => (
  <ProtectedRoute allow="worker">{el}</ProtectedRoute>
);
const E = (el: React.ReactNode) => (
  <ProtectedRoute allow="employer">{el}</ProtectedRoute>
);
const P = (el: React.ReactNode) => <ProtectedRoute>{el}</ProtectedRoute>;

export function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/welcome" replace />} />

            {/* Public / onboarding */}
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/language" element={<LanguagePage />} />
            <Route path="/signup-options" element={<SignUpOptionsPage />} />
            <Route path="/create-account" element={<CreateAccountPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/basic-details" element={P(<BasicDetailsPage />)} />
            <Route path="/choose-role" element={P(<ChooseRolePage />)} />
            <Route path="/worker-details" element={W(<WorkerDetailsPage />)} />

            {/* Worker */}
            <Route
              path="/worker-dashboard"
              element={W(<WorkerDashboardPage />)}
            />
            <Route
              path="/recommended-jobs"
              element={W(<RecommendedJobsPage />)}
            />
            <Route path="/available-jobs" element={W(<AvailableJobsPage />)} />
            <Route path="/chat" element={W(<ChatAssistantPage />)} />
            <Route
              path="/welfare-schemes"
              element={W(<WelfareSchemesPage />)}
            />
            <Route path="/messages" element={W(<MessagesPage />)} />
            <Route path="/worker-profile" element={W(<WorkerProfilePage />)} />
            <Route
              path="/settings"
              element={W(<SettingsPage type="worker" />)}
            />

            {/* Employer */}
            <Route
              path="/employer-dashboard"
              element={E(<EmployerDashboardPage />)}
            />
            <Route path="/post-job" element={E(<PostJobPage />)} />
            <Route
              path="/emergency-hiring"
              element={E(<EmergencyHiringPage />)}
            />
            <Route
              path="/employer-messages"
              element={E(<EmployerMessagesPage />)}
            />
            <Route
              path="/employer-profile"
              element={E(<EmployerProfilePage />)}
            />
            <Route
              path="/employer-settings"
              element={E(<SettingsPage type="employer" />)}
            />

            <Route path="*" element={<Navigate to="/welcome" replace />} />
          </Routes>
          <Toast />
        </BrowserRouter>
      </AppProvider>
    </LanguageProvider>
  );
}

export default App;
