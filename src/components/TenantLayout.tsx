"use client";

import type React from "react";
import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, ChevronDown, Home, FileText, CreditCard, Bell, X, MessageSquare } from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "../hooks/useAuth";
import { notificationApi } from "../lib/tenantApi";
import type { AppNotificationItem } from "../lib/tenantApi";
import { useEffect } from "react";

const TenantLayout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const result = await notificationApi.list();
        setNotifications(result.data);
        setUnreadCount(result.unreadCount);
      } catch { /* ignore */ }
    };
    loadNotifications();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/tenant/login");
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const handleDismiss = async (id: number) => {
    try {
      await notificationApi.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const navLink = (path: string) =>
    `flex items-center gap-2 text-sm font-medium transition-colors duration-200 ${
      location.pathname === path || location.pathname.startsWith(path + "/")
        ? "text-white"
        : "text-white/50 hover:text-white"
    }`;

  const unread = notifications.filter(n => !n.read);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Persistent background video */}
      <video
        className="fixed inset-0 w-full h-full object-cover"
        autoPlay loop muted playsInline
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4"
      />
      <div className="fixed inset-0" style={{ background: "rgba(5,5,5,0.72)" }} />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Tenant Navbar */}
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
              <Link to="/tenant/dashboard" className="flex items-center">
                <Logo size="lg" height="5rem" />
              </Link>

              {/* Center Nav */}
              <div className="hidden md:flex items-center gap-7">
                <Link to="/tenant/dashboard" className={navLink("/tenant/dashboard")}>
                  <Home className="w-4 h-4" /> Dashboard
                </Link>
                <Link to="/tenant/rent" className={navLink("/tenant/rent")}>
                  <CreditCard className="w-4 h-4" /> Rent
                </Link>
                <Link to="/tenant/documents" className={navLink("/tenant/documents")}>
                  <FileText className="w-4 h-4" /> Documents
                </Link>
                <Link to="/tenant/chat" className={navLink("/tenant/chat")}>
                  <MessageSquare className="w-4 h-4" /> Chat & Agreement
                </Link>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-1.5">
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => { setIsBellOpen(o => !o); setIsMenuOpen(false); }}
                    className="relative p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-[8px] font-bold text-black leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {isBellOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsBellOpen(false)} />
                      <div
                        className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl z-50 overflow-hidden"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}
                      >
                        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <span className="text-sm font-semibold text-white">Notifications</span>
                          {unread.length > 0 && (
                            <button onClick={handleMarkAllRead} className="text-xs text-white/30 hover:text-white/60 transition-colors">
                              Mark all read
                            </button>
                          )}
                        </div>
                        {unread.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <Bell className="w-7 h-7 text-white/10 mx-auto mb-2" />
                            <p className="text-sm text-white/30">No new notifications</p>
                          </div>
                        ) : (
                          <ul className="max-h-72 overflow-y-auto divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                            {unread.map(n => (
                              <li key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-white/80 truncate">{n.title}</p>
                                  <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{n.message}</p>
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
                      </div>
                    </>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    onClick={() => { setIsMenuOpen(o => !o); setIsBellOpen(false); }}
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <span className="text-[10px] font-semibold text-emerald-400">
                        {user?.username?.[0]?.toUpperCase() || "T"}
                      </span>
                    </div>
                    <span className="hidden sm:inline text-xs">{user?.email || "Tenant"}</span>
                    <ChevronDown className="h-3 w-3 text-white/30" />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                      <div
                        className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-2xl z-50 py-1 overflow-hidden"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}
                      >
                        <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <p className="text-xs font-medium text-white truncate">{user?.username || "Tenant"}</p>
                          <p className="text-xs text-white/30 truncate mt-0.5">{user?.email}</p>
                          <span className="inline-block mt-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            Tenant
                          </span>
                        </div>
                        {/* Mobile nav */}
                        <div className="md:hidden py-1" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <Link to="/tenant/dashboard" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">Dashboard</Link>
                          <Link to="/tenant/rent" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">Rent</Link>
                          <Link to="/tenant/documents" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">Documents</Link>
                          <Link to="/tenant/chat" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">Chat & Agreement</Link>
                        </div>
                        <button
                          onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 flex items-center gap-2 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TenantLayout;
