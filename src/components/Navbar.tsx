"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Shield, ChevronDown, Bell, DollarSign, FileText, X } from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "../hooks/useAuth";
import { rentSchedulesApi, documentsApi } from "../lib/api";
import type { RentReminder } from "../lib/documentTypes";
import type { PropertyDocument } from "../lib/documentTypes";

// ─── Notification types ───────────────────────────────────────────────────────

interface AppNotification {
  id: string;
  type: "rent" | "document";
  title: string;
  body: string;
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Load notifications once on mount
  useEffect(() => {
    const load = async () => {
      const results: AppNotification[] = [];

      // Rent reminders
      try {
        const reminders: RentReminder[] = await rentSchedulesApi.reminders();
        reminders.forEach((r) => {
          results.push({
            id: `rent-${r.id}`,
            type: "rent",
            title: `Rent due — ${r.roomName}`,
            body: `${r.tenantName} · £${r.amount.toLocaleString()} due ${new Date(r.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
          });
        });
      } catch { /* silently ignore */ }

      // Document expiry reminders (client-side, from all docs)
      try {
        const docs: PropertyDocument[] = await documentsApi.list();
        const today = new Date();
        docs.forEach((doc) => {
          if (!doc.expiryDate) return;
          const daysLeft = Math.ceil(
            (new Date(doc.expiryDate).getTime() - today.getTime()) / 86_400_000
          );
          const threshold = doc.reminderDays ?? 30;
          if (daysLeft > 0 && daysLeft <= threshold) {
            results.push({
              id: `doc-${doc.id}`,
              type: "document",
              title: `Document expiring — ${doc.name}`,
              body: `Expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"} (${new Date(doc.expiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })})`,
            });
          }
        });
      } catch { /* silently ignore */ }

      setNotifications(results);
    };

    load();
  }, []);

  const visible = notifications.filter((n) => !dismissed.has(n.id));

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Logo />
            </Link>
            <div className="hidden sm:flex items-center gap-1.5 ml-2 px-2.5 py-1 bg-gradient-to-r from-pink-50 to-purple-50 rounded-full border border-pink-100">
              <Shield className="w-3 h-3 text-pink-500" />
              <span className="text-xs font-medium text-pink-600">Admin</span>
            </div>
          </div>

          {/* Center Nav */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/admin"
              className={`text-sm font-medium transition-colors ${location.pathname === "/admin"
                  ? "text-pink-500"
                  : "text-gray-600 hover:text-pink-500"
                }`}
            >
              Properties
            </Link>
            <Link
              to="/admin/management"
              className={`text-sm font-medium transition-colors ${isActive("/admin/management")
                  ? "text-pink-500"
                  : "text-gray-600 hover:text-pink-500"
                }`}
            >
              Management
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => { setIsBellOpen((o) => !o); setIsMenuOpen(false); }}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 text-gray-600" />
                {visible.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[9px] font-bold text-white leading-none">
                    {visible.length > 9 ? "9+" : visible.length}
                  </span>
                )}
              </button>

              {isBellOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsBellOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-900">Notifications</span>
                      {visible.length > 0 && (
                        <button
                          onClick={() => setDismissed(new Set(notifications.map((n) => n.id)))}
                          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    {visible.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No new notifications</p>
                      </div>
                    ) : (
                      <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                        {visible.map((n) => (
                          <li key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${n.type === "rent" ? "bg-amber-50" : "bg-purple-50"}`}>
                              {n.type === "rent"
                                ? <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                                : <FileText className="w-3.5 h-3.5 text-purple-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">{n.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                            </div>
                            <button
                              onClick={() => setDismissed((prev) => new Set([...prev, n.id]))}
                              className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors mt-0.5"
                              aria-label="Dismiss"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="border-t border-gray-100 px-4 py-2.5">
                      <button
                        onClick={() => { setIsBellOpen(false); navigate("/admin/management"); }}
                        className="text-xs text-pink-600 hover:text-pink-700 font-medium transition-colors"
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
                className="flex items-center gap-2 border border-gray-200 rounded-full px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => { setIsMenuOpen((o) => !o); setIsBellOpen(false); }}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {user?.username?.[0]?.toUpperCase() || "A"}
                  </span>
                </div>
                <span className="hidden sm:inline text-gray-600 text-xs">
                  {user?.email || "Admin"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>

              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {user?.username || "Admin"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    {/* Mobile nav links */}
                    <div className="md:hidden border-b border-gray-100 py-1">
                      <Link
                        to="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Properties
                      </Link>
                      <Link
                        to="/admin/management"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Management
                      </Link>
                    </div>
                    <button
                      onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
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
