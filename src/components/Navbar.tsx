import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Search, User } from "lucide-react";
import { KaamSetuLogo } from "./KaamSetuLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useApp } from "../context/AppContext";
import { useLanguage } from "../i18n/LanguageContext";
import {
  getMyNotifications,
  markNotificationRead,
  type AppNotification,
} from "../services/notificationService";

interface NavbarProps {
  showSidebarToggle?: boolean;
  type?: "worker" | "employer" | "onboarding";
}

const timeAgo = (seconds?: number | null): string => {
  if (!seconds) return "Just now";
  const m = Math.floor((Date.now() / 1000 - seconds) / 60);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export const Navbar: React.FC<NavbarProps> = ({ type = "worker" }) => {
  const { userProfile, userRole } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Load notifications whenever the logged-in user changes
  useEffect(() => {
    if (!userProfile.uid) return;
    getMyNotifications(userProfile.uid)
      .then(setNotifications)
      .catch((err) => console.error("Failed to load notifications:", err));
  }, [userProfile.uid]);

  // Close the dropdown if you click anywhere outside it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setShowDropdown((prev) => !prev);
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n,
          ),
        );
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }
    setShowDropdown(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Logo (for mobile or onboarding) */}
        <div className="flex items-center gap-3">
          <div className="lg:hidden">
            <KaamSetuLogo size="sm" />
          </div>
          {type !== "onboarding" && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs text-gray-400 w-48 md:w-64">
              <Search className="w-3.5 h-3.5" />
              <input
                type="text"
                placeholder={t("searchPlaceholder", "Search jobs, skills...")}
                className="bg-transparent text-gray-700 outline-none w-full text-xs placeholder:text-gray-400"
              />
            </div>
          )}
        </div>

        {/* Right Action Icons & Language Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Selector Dropdown */}
          <LanguageSwitcher variant="dropdown" />

          {type !== "onboarding" && (
            <>
              {/* Notification Bell */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={handleBellClick}
                  className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#F97316] text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-900">
                        Notifications
                      </h3>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 && (
                        <p className="px-4 py-6 text-xs text-gray-400 text-center">
                          No notifications yet.
                        </p>
                      )}

                      {notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => handleNotificationClick(n)}
                          className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                            !n.isRead ? "bg-emerald-50/50" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-gray-900">
                              {n.title}
                            </p>
                            {!n.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] mt-1 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {timeAgo(n.createdAt?.seconds)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Avatar Icon */}
              <Link
                to={
                  userRole === "worker"
                    ? "/worker-profile"
                    : "/employer-profile"
                }
                className="flex items-center gap-2 pl-1 group"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-300 bg-emerald-100 flex items-center justify-center text-emerald-800 text-xs font-bold">
                  {userProfile.avatar ? (
                    <img
                      src={userProfile.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
