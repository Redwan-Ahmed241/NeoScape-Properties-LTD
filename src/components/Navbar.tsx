"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LogOut,
  ChevronDown,
  Bell,
  DollarSign,
  FileText,
  X,
} from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "../hooks/useAuth";
import { rentSchedulesApi, documentsApi } from "../lib/api";
import { notificationApi } from "../lib/tenantApi";
import type { RentReminder, PropertyDocument } from "../lib/documentTypes";

interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read?: boolean;
  link?: string;
}

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  useEffect(() => {
    const load = async () => {
      const results: AppNotification[] = [];

      // 1. Fetch real backend DB notifications
      try {
        const dbRes = await notificationApi.list();
        const unreadDb = dbRes.data.filter((n: any) => !n.read);
        unreadDb.forEach((n: any) => {
          results.push({
            id: `db-${n.id}`,
            type: n.type || "general",
            title: n.title,
            body: n.message,
            read: false,
            link: n.link || undefined,
          });
        });
      } catch (err) {
        console.error("Failed to load database notifications:", err);
      }

      // 2. Fetch calculated rent reminders
      try {
        const reminders: RentReminder[] = await rentSchedulesApi.reminders();
        const isLikelyUuid = (value: string) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            value,
          );
        const getTenantPrimaryLabel = (name?: string, email?: string) => {
          if (!name && !email) return "";
          if (email) return email;
          if (name && !isLikelyUuid(name)) return name;
          return "";
        };

        reminders.forEach((r) => {
          const tenantLabel =
            getTenantPrimaryLabel(r.tenantName) || r.tenantName;
          results.push({
            id: `rent-${r.id}`,
            type: "rent",
            title: `Rent due — ${r.roomName}`,
            body: `${tenantLabel} · £${r.amount.toLocaleString()} due ${new Date(r.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
            read: false,
          });
        });
      } catch {
        /* silently ignore */
      }

      // 3. Fetch expiring documents
      try {
        const docs: PropertyDocument[] = await documentsApi.list();
        const today = new Date();
        docs.forEach((doc) => {
          if (!doc.expiryDate) return;
          const daysLeft = Math.ceil(
            (new Date(doc.expiryDate).getTime() - today.getTime()) / 86_400_000,
          );
          const threshold = doc.reminderDays ?? 30;
          if (daysLeft > 0 && daysLeft <= threshold) {
            results.push({
              id: `doc-${doc.id}`,
              type: "document",
              title: `Document expiring — ${doc.name}`,
              body: `Expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"} (${new Date(doc.expiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })})`,
              read: false,
            });
          }
        });
      } catch {
        /* silently ignore */
      }

      setNotifications(results);
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const visible = notifications.filter((n) => !dismissed.has(n.id));

  const handleDismiss = async (id: string) => {
    if (id.startsWith("db-")) {
      const dbId = Number(id.replace("db-", ""));
      try {
        await notificationApi.markRead(dbId);
      } catch (err) {
        console.error("Failed to dismiss notification:", err);
      }
    }
    setDismissed((prev) => new Set([...prev, id]));
  };

  const handleClearAll = async () => {
    const allIds = visible.map((n) => n.id);
    setDismissed((prev) => new Set([...prev, ...allIds]));
    try {
      await notificationApi.markAllRead();
    } catch (err) {
      console.error("Failed to clear all database notifications:", err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const navLink = (path: string) =>
    `text-sm font-medium transition-colors duration-200 ${
      location.pathname === path || location.pathname.startsWith(path + "/")
        ? "text-white"
        : "text-white/50 hover:text-white"
    }`;

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(5,5,5,0.55)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link to="/admin" className="flex items-center">
            <Logo size="lg" height="5rem" />
          </Link>

          {/* Center Nav */}
          <div className="hidden md:flex items-center gap-7">
            <Link to="/admin" className={navLink("/admin")}>
              Properties
            </Link>
            <Link
              to="/admin/management"
              className={navLink("/admin/management")}
            >
              Document Management
            </Link>
            <Link to="/admin/tenants" className={navLink("/admin/tenants")}>
              Tenant Management
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-1.5">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsBellOpen((o) => !o);
                  setIsMenuOpen(false);
                }}
                className="relative p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {visible.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-[8px] font-bold text-black leading-none">
                    {visible.length > 9 ? "9+" : visible.length}
                  </span>
                )}
              </button>

              {isBellOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsBellOpen(false)}
                  />
                  <div
                    className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl z-50 overflow-hidden"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      <span className="text-sm font-semibold text-white">
                        Notifications
                      </span>
                      {visible.length > 0 && (
                        <button
                          onClick={handleClearAll}
                          className="text-xs text-white/30 hover:text-white/60 transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    {visible.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="w-7 h-7 text-white/10 mx-auto mb-2" />
                        <p className="text-sm text-white/30">
                          No new notifications
                        </p>
                      </div>
                    ) : (
                      <ul
                        className="max-h-72 overflow-y-auto divide-y"
                        style={{ borderColor: "var(--border-subtle)" }}
                      >
                        {visible.map((n) => (
                          <li
                            key={n.id}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
                          >
                            <div
                              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                                n.type === "rent" ||
                                n.type === "rent_due" ||
                                n.type === "rent_overdue"
                                  ? "bg-amber-500/10"
                                  : n.type === "document" ||
                                      n.type === "document_review"
                                    ? "bg-blue-500/10"
                                    : "bg-white/5"
                              }`}
                            >
                              {n.type === "rent" ||
                              n.type === "rent_due" ||
                              n.type === "rent_overdue" ? (
                                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 text-white/40" />
                              )}
                            </div>
                            <div
                              className="flex-1 min-w-0 cursor-pointer hover:text-white/90"
                              onClick={() => {
                                if (n.link) {
                                  setIsBellOpen(false);
                                  navigate(n.link);
                                  handleDismiss(n.id);
                                }
                              }}
                            >
                              <p className="text-xs font-medium text-white/80 truncate">
                                {n.title}
                              </p>
                              <p className="text-xs text-white/45 mt-0.5 leading-relaxed">
                                {n.body}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDismiss(n.id)}
                              className="shrink-0 text-white/20 hover:text-white/50 transition-colors mt-0.5"
                              aria-label="Dismiss"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div
                      className="px-4 py-2.5"
                      style={{ borderTop: "1px solid var(--border-subtle)" }}
                    >
                      <button
                        onClick={() => {
                          setIsBellOpen(false);
                          navigate("/admin/management?tab=interests");
                        }}
                        className="text-xs text-white/40 hover:text-white transition-colors font-medium"
                      >
                        View all in Management →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => {
                  setIsMenuOpen((o) => !o);
                  setIsBellOpen(false);
                }}
              >
                <div className="w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-white">
                    {user?.username?.[0]?.toUpperCase() || "A"}
                  </span>
                </div>
                <span className="hidden sm:inline text-xs">
                  {user?.email || "Admin"}
                </span>
                <ChevronDown className="h-3 w-3 text-white/30" />
              </button>

              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div
                    className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-2xl z-50 py-1 overflow-hidden"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    <div
                      className="px-3 py-2.5"
                      style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      <p className="text-xs font-medium text-white truncate">
                        {user?.username || "Admin"}
                      </p>
                      <p className="text-xs text-white/30 truncate mt-0.5">
                        {user?.email}
                      </p>
                    </div>
                    {/* Mobile nav */}
                    <div
                      className="md:hidden py-1"
                      style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      <Link
                        to="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Properties
                      </Link>
                      <Link
                        to="/admin/management"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Management
                      </Link>
                      <Link
                        to="/admin/tenants"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Tenant Management
                      </Link>
                    </div>
                    <Link
                      to="/admin/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
