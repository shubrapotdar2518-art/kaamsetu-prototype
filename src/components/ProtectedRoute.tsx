import React from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

interface Props {
  children: React.ReactNode;
  allow?: "worker" | "employer";
}

export const ProtectedRoute: React.FC<Props> = ({ children, allow }) => {
  const { authLoading, userProfile, userRole } = useApp();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold">
        Loading...
      </div>
    );
  }
  if (!userProfile.uid) return <Navigate to="/login" replace />;
  if (allow && userRole !== allow) {
    return (
      <Navigate
        to={userRole === "worker" ? "/worker-dashboard" : "/employer-dashboard"}
        replace
      />
    );
  }
  return <>{children}</>;
};
