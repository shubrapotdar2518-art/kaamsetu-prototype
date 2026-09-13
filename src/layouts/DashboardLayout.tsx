import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { MobileBottomNav } from '../components/MobileBottomNav';

interface DashboardLayoutProps {
  children: React.ReactNode;
  type: 'worker' | 'employer';
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, type }) => {
  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col lg:flex-row antialiased text-[#1A2E20]">
      {/* Desktop Left Sidebar */}
      <Sidebar type={type} />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar type={type} />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav type={type} />
    </div>
  );
};
