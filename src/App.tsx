import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { AppProvider } from './context/AppContext';
import { Toast } from './components/Toast';

// Onboarding Pages
import { WelcomePage } from './pages/onboarding/WelcomePage';
import { LanguagePage } from './pages/onboarding/LanguagePage';
import { SignUpOptionsPage } from './pages/onboarding/SignUpOptionsPage';
import { CreateAccountPage } from './pages/onboarding/CreateAccountPage';
import { VerifyOtpPage } from './pages/onboarding/VerifyOtpPage';
import { BasicDetailsPage } from './pages/onboarding/BasicDetailsPage';
import { ChooseRolePage } from './pages/onboarding/ChooseRolePage';
import { WorkerDetailsPage } from './pages/onboarding/WorkerDetailsPage';

// Worker Pages
import { WorkerDashboardPage } from './pages/worker/WorkerDashboardPage';
import { RecommendedJobsPage } from './pages/worker/RecommendedJobsPage';
import { AvailableJobsPage } from './pages/worker/AvailableJobsPage';
import { ChatAssistantPage } from './pages/worker/ChatAssistantPage';
import { WelfareSchemesPage } from './pages/worker/WelfareSchemesPage';
import { MessagesPage } from './pages/worker/MessagesPage';
import { WorkerProfilePage } from './pages/worker/WorkerProfilePage';

// Employer Pages
import { EmployerDashboardPage } from './pages/employer/EmployerDashboardPage';
import { PostJobPage } from './pages/employer/PostJobPage';
import { EmergencyHiringPage } from './pages/employer/EmergencyHiringPage';
import { EmployerMessagesPage } from './pages/employer/EmployerMessagesPage';
import { EmployerProfilePage } from './pages/employer/EmployerProfilePage';

// Common Settings
import { SettingsPage } from './pages/common/SettingsPage';

export function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/welcome" replace />} />

            {/* Onboarding Flow */}
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/language" element={<LanguagePage />} />
            <Route path="/signup-options" element={<SignUpOptionsPage />} />
            <Route path="/create-account" element={<CreateAccountPage />} />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/basic-details" element={<BasicDetailsPage />} />
            <Route path="/choose-role" element={<ChooseRolePage />} />
            <Route path="/worker-details" element={<WorkerDetailsPage />} />

            {/* Worker Flow */}
            <Route path="/worker-dashboard" element={<WorkerDashboardPage />} />
            <Route path="/recommended-jobs" element={<RecommendedJobsPage />} />
            <Route path="/available-jobs" element={<AvailableJobsPage />} />
            <Route path="/chat" element={<ChatAssistantPage />} />
            <Route path="/welfare-schemes" element={<WelfareSchemesPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/worker-profile" element={<WorkerProfilePage />} />
            <Route path="/settings" element={<SettingsPage type="worker" />} />

            {/* Employer Flow */}
            <Route path="/employer-dashboard" element={<EmployerDashboardPage />} />
            <Route path="/post-job" element={<PostJobPage />} />
            <Route path="/emergency-hiring" element={<EmergencyHiringPage />} />
            <Route path="/employer-messages" element={<EmployerMessagesPage />} />
            <Route path="/employer-profile" element={<EmployerProfilePage />} />
            <Route path="/employer-settings" element={<SettingsPage type="employer" />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/welcome" replace />} />
          </Routes>

          {/* Global Toast Component */}
          <Toast />
        </BrowserRouter>
      </AppProvider>
    </LanguageProvider>
  );
}

export default App;
