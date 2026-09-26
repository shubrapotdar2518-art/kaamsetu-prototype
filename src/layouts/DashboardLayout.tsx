import React, { useState } from "react";

import { useNavigate } from "react-router-dom";

import { LogOut } from "lucide-react";

import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { useApp } from "../context/AppContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
  type: "worker" | "employer";
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  type,
}) => {
  const navigate = useNavigate();

  const { logoutAccount, showToast } = useApp();

  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await logoutAccount();

      navigate("/welcome", {
        replace: true,
      });
    } catch (caughtError) {
      console.error("Sign out failed:", caughtError);

      showToast("Could not sign out. Please try again.", "error");

      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col lg:flex-row antialiased text-[#1A2E20]">
      {/* Desktop left sidebar */}
      <Sidebar type={type} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar type={type} />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <LogOut className="w-4 h-4" />

              {isSigningOut ? "Signing out..." : "Sign out"}
            </button>
          </div>

          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav type={type} />
    </div>
  );
};
