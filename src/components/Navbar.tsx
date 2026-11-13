import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bell, Search, User, X, Clock, Zap } from "lucide-react";
import { KaamSetuLogo } from "./KaamSetuLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useApp } from "../context/AppContext";
import { useLanguage } from "../i18n/LanguageContext";
import {
  getMyNotifications,
  markNotificationRead,
  archiveNotification,
  type AppNotification,
} from "../services/notificationService";
import { getApplicationStatusDoc } from "../services/jobService";

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
  const {
    userProfile,
    userRole,
    acceptJobOffer,
    rejectJobOffer,
    acceptEmergencyJobOffer,
    rejectEmergencyJobOffer,
  } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Current system epoch seconds for live countdown timers
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(
    Math.floor(Date.now() / 1000),
  );

  // Live timer tick when dropdown is open
  useEffect(() => {
    if (!showDropdown) return;
    const interval = setInterval(() => {
      setCurrentTimeSeconds(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [showDropdown]);

  // ─── Job offer (Accept / Reject) support ───
  // Current Firestore status of each offer, keyed by application id (jobId_workerId)
  const [offerStatuses, setOfferStatuses] = useState<Record<string, string>>({});
  // Which offer is being processed right now (disables its buttons)
  const [busyOfferId, setBusyOfferId] = useState<string | null>(null);

  // Build the application id for an offer notification
  const getOfferApplicationId = (n: AppNotification): string | null =>
    n.relatedId && userProfile.uid ? `${n.relatedId}_${userProfile.uid}` : null;

  // Whenever notifications change, look up the real status of each offer
  useEffect(() => {
    if (!userProfile.uid) return;
    const offers = notifications.filter(
      (n) => n.type === "job_offer" || n.type === "emergency_job_offer",
    );
    offers.forEach(async (n) => {
      const appId = getOfferApplicationId(n);
      if (!appId) return;
      const status = await getApplicationStatusDoc(appId);
      if (status) {
        setOfferStatuses((prev) => ({ ...prev, [appId]: status }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications, userProfile.uid]);

  const handleAcceptOffer = async (
    e: React.MouseEvent,
    n: AppNotification,
  ) => {
    e.stopPropagation();
    const appId = getOfferApplicationId(n);
    if (!appId || busyOfferId) return;
    setBusyOfferId(appId);

    const isEmergency = n.type === "emergency_job_offer";
    const ok = isEmergency
      ? await acceptEmergencyJobOffer(appId)
      : await acceptJobOffer(appId);

    if (ok) {
      setOfferStatuses((prev) => ({ ...prev, [appId]: "in_progress" }));
      try {
        await archiveNotification(n.id);
        setNotifications((prev) => prev.filter((x) => x.id !== n.id));
      } catch (err) {
        console.error("Failed to archive notification:", err);
      }
    }
    setBusyOfferId(null);
  };

  const handleRejectOffer = async (
    e: React.MouseEvent,
    n: AppNotification,
  ) => {
    e.stopPropagation();
    const appId = getOfferApplicationId(n);
    if (!appId || busyOfferId) return;
    setBusyOfferId(appId);

    const isEmergency = n.type === "emergency_job_offer";
    const ok = isEmergency
      ? await rejectEmergencyJobOffer(appId)
      : await rejectJobOffer(appId);

    if (ok) {
      setOfferStatuses((prev) => ({ ...prev, [appId]: "offer_declined" }));
      try {
        await archiveNotification(n.id);
        setNotifications((prev) => prev.filter((x) => x.id !== n.id));
      } catch (err) {
        console.error("Failed to archive notification:", err);
      }
    }
    setBusyOfferId(null);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Load notifications whenever the logged-in user changes or route changes
  useEffect(() => {
    if (!userProfile.uid) return;
    getMyNotifications(userProfile.uid)
      .then(setNotifications)
      .catch((err) => console.error("Failed to load notifications:", err));
  }, [userProfile.uid, location.pathname]);

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
    const willOpen = !showDropdown;
    setShowDropdown(willOpen);

    // Fetch the latest notifications each time the bell is opened
    if (willOpen && userProfile.uid) {
      getMyNotifications(userProfile.uid)
        .then(setNotifications)
        .catch((err) => console.error("Failed to refresh notifications:", err));
    }
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    // 1. Job offers (normal and emergency): must remain visible until worker explicitly accepts or rejects them, or until expired.
    if (notification.type === "job_offer" || notification.type === "emergency_job_offer") {
      const appId = getOfferApplicationId(notification);
      const currentStatus = appId ? offerStatuses[appId] : undefined;

      const expiresAtSec =
        typeof notification.expiresAt === "number"
          ? notification.expiresAt
          : notification.expiresAt?.seconds;
      const isExpired =
        notification.type === "emergency_job_offer" &&
        (currentStatus === "expired" ||
          (expiresAtSec !== undefined && currentTimeSeconds > expiresAtSec));

      // If pending and unexpired, mark as read so badge decrements, but do NOT archive or hide.
      if (!isExpired && (!currentStatus || currentStatus === "offered")) {
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
        return;
      }

      // If already resolved, expired, or unavailable, clicking it archives it
      try {
        await archiveNotification(notification.id);
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id),
        );
      } catch (err) {
        console.error("Failed to archive notification:", err);
      }
      setShowDropdown(false);
      return;
    }

    // 2. New message: archive notification and navigate to the conversation
    if (notification.type === "new_message") {
      setShowDropdown(false);
      try {
        await archiveNotification(notification.id);
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id),
        );
      } catch (err) {
        console.error("Failed to archive message notification:", err);
      }

      if (notification.relatedId) {
        const isEmployer = window.location.pathname.startsWith("/employer");
        navigate(isEmployer ? "/employer-messages" : "/messages", {
          state: { conversationId: notification.relatedId },
        });
      }
      return;
    }

    // 3. Informational notifications: archive when clicked
    setShowDropdown(false);
    try {
      await archiveNotification(notification.id);
      setNotifications((prev) =>
        prev.filter((n) => n.id !== notification.id),
      );
    } catch (err) {
      console.error("Failed to archive notification:", err);
    }
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

                      {notifications.map((n) => {
                        const isJobOffer = n.type === "job_offer";
                        const isEmergencyOffer = n.type === "emergency_job_offer";
                        const offerAppId =
                          isJobOffer || isEmergencyOffer
                            ? getOfferApplicationId(n)
                            : null;
                        const offerStatus = offerAppId
                          ? offerStatuses[offerAppId]
                          : undefined;
                        const isBusy =
                          offerAppId !== null && busyOfferId === offerAppId;

                        const expiresAtSec =
                          typeof n.expiresAt === "number"
                            ? n.expiresAt
                            : n.expiresAt?.seconds;
                        const remainingSeconds = expiresAtSec
                          ? Math.max(0, expiresAtSec - currentTimeSeconds)
                          : 0;
                        const isEmergencyExpired =
                          isEmergencyOffer &&
                          (offerStatus === "expired" ||
                            (expiresAtSec !== undefined && remainingSeconds <= 0));

                        const mins = Math.floor(remainingSeconds / 60);
                        const secs = remainingSeconds % 60;
                        const formattedCountdown = `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;

                        const canDismiss =
                          (!isJobOffer && !isEmergencyOffer) ||
                          isEmergencyExpired ||
                          offerStatus === "in_progress" ||
                          offerStatus === "offer_declined";

                        return (
                          <div
                            key={n.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleNotificationClick(n)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleNotificationClick(n);
                            }}
                            className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                              !n.isRead
                                ? isEmergencyOffer
                                  ? "bg-orange-50/60"
                                  : "bg-emerald-50/50"
                                : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <p
                                    className={`text-[11px] font-semibold ${
                                      isEmergencyOffer
                                        ? "text-orange-600"
                                        : "text-[#15803D]"
                                    }`}
                                  >
                                    {n.senderName || "KaamSetu"}
                                  </p>
                                  {isEmergencyOffer && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-orange-100 text-orange-700 border border-orange-300">
                                      🚨 SOS
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-bold text-gray-900">
                                  {n.title}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {!n.isRead && (
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      isEmergencyOffer
                                        ? "bg-orange-500"
                                        : "bg-[#15803D]"
                                    }`}
                                  />
                                )}
                                {canDismiss && (
                                  <button
                                    type="button"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        await archiveNotification(n.id);
                                        setNotifications((prev) =>
                                          prev.filter((x) => x.id !== n.id),
                                        );
                                      } catch (err) {
                                        console.error(
                                          "Failed to dismiss notification:",
                                          err,
                                        );
                                      }
                                    }}
                                    className="text-gray-300 hover:text-gray-600 p-0.5 rounded transition-colors"
                                    title="Dismiss"
                                    aria-label="Dismiss notification"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {n.message}
                            </p>

                            {/* Normal Job Offer Controls */}
                            {isJobOffer && offerStatus === "offered" && (
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={(e) => handleAcceptOffer(e, n)}
                                  className="px-3 py-1.5 rounded-lg bg-[#15803D] hover:bg-[#166534] disabled:opacity-50 text-white text-[11px] font-bold transition-colors"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={(e) => handleRejectOffer(e, n)}
                                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 disabled:opacity-50 text-red-600 border border-red-200 text-[11px] font-bold transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            )}

                            {isJobOffer && offerStatus === "in_progress" && (
                              <p className="text-[11px] font-bold text-[#15803D] mt-2">
                                ✓ Offer accepted
                              </p>
                            )}
                            {isJobOffer && offerStatus === "offer_declined" && (
                              <p className="text-[11px] font-bold text-red-600 mt-2">
                                ✕ Offer declined
                              </p>
                            )}
                            {isJobOffer &&
                              offerStatus !== undefined &&
                              !["offered", "in_progress", "offer_declined"].includes(
                                offerStatus,
                              ) && (
                                <p className="text-[11px] font-bold text-gray-500 mt-2">
                                  Offer no longer available
                                </p>
                              )}

                            {/* Emergency Job Offer Controls */}
                            {isEmergencyOffer &&
                              offerStatus === "offered" &&
                              !isEmergencyExpired && (
                                <div className="mt-2 space-y-2">
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold">
                                    <Clock className="w-3.5 h-3.5 animate-pulse text-orange-600" />
                                    <span>
                                      Response window: {formattedCountdown} remaining
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={(e) => handleAcceptOffer(e, n)}
                                      className="px-3 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 text-white text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1"
                                    >
                                      <Zap className="w-3 h-3" />
                                      Accept Emergency Offer
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={(e) => handleRejectOffer(e, n)}
                                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 disabled:opacity-50 text-red-600 border border-red-200 text-[11px] font-bold transition-colors"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              )}

                            {isEmergencyOffer && isEmergencyExpired && (
                              <div className="mt-2 p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 text-xs font-semibold flex items-center justify-between">
                                <span className="flex items-center gap-1 text-red-600 font-bold">
                                  ✕ Offer Expired (5-minute window passed)
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  Next worker alerted
                                </span>
                              </div>
                            )}

                            {isEmergencyOffer && offerStatus === "in_progress" && (
                              <p className="text-[11px] font-bold text-[#15803D] mt-2">
                                ✓ Emergency offer accepted — Assigned!
                              </p>
                            )}

                            {isEmergencyOffer && offerStatus === "offer_declined" && (
                              <p className="text-[11px] font-bold text-red-600 mt-2">
                                ✕ Offer declined
                              </p>
                            )}

                            <p className="text-[10px] text-gray-400 mt-1">
                              {timeAgo(n.createdAt?.seconds)}
                            </p>
                          </div>
                        );
                      })}
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
