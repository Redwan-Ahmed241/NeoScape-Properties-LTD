"use client";

import type React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AuthenticatedLayout from "./components/AuthenticatedLayout";
import AdminLogin from "./pages/AdminLogin";
import AdminSignUp from "./pages/AdminSignUp";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HeroPage from "./pages/HeroPage";
import VillaListPage from "./pages/VillaListPage";
import VillaRoomsPage from "./pages/VillaRoomsPage";
import RoomDetailPage from "./pages/RoomDetailPage";
import ManagementPage from "./pages/ManagementPage";
import ProfilePage from "./pages/ProfilePage";
import AuthProvider from "./components/AuthProvider";
import { useAuth } from "./hooks/useAuth";

// Tenant pages & component imports
import TenantLogin from "./pages/tenant/TenantLogin";
import TenantSignUp from "./pages/tenant/TenantSignUp";
import TenantDashboard from "./pages/tenant/TenantDashboard";
import TenantRentPage from "./pages/tenant/TenantRentPage";
import TenantDocumentsPage from "./pages/tenant/TenantDocumentsPage";
import ChatAndAgreementPage from "./pages/tenant/ChatAndAgreementPage";
import TenantLayout from "./components/TenantLayout";

// Admin tenant management page
import TenantManagementPage from "./pages/admin/TenantManagementPage";

// Public pages imports
import PublicPropertyListPage from "./pages/public/PublicPropertyListPage";
import PublicPropertyDetailPage from "./pages/public/PublicPropertyDetailPage";
import TenantReferencingForm from "./pages/public/TenantReferencingForm";

// ─── Shared video-background shell (used for loading / access-denied states) ─

const VideoShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center">
    <video
      className="fixed inset-0 w-full h-full object-cover"
      autoPlay
      loop
      muted
      playsInline
      src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4"
    />
    <div className="fixed inset-0" style={{ background: "rgba(5,5,5,0.72)" }} />
    <div className="relative z-10">{children}</div>
  </div>
);

// ─── Admin-only route guard ───────────────────────────────────────────────────

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading || (isAuthenticated && !user)) {
    return (
      <VideoShell>
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white/40 mx-auto" />
          <p className="text-sm text-white/40">Verifying access…</p>
        </div>
      </VideoShell>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (user?.role !== "admin") {
    return (
      <VideoShell>
        <div className="text-center max-w-md mx-auto px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 rounded-2xl mb-4 border border-white/10">
            <svg
              className="w-8 h-8 text-white/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Access Denied
          </h2>
          <p className="text-white/40 text-sm mb-6">
            This system is restricted to administrators only.
          </p>
          <button
            onClick={() => (window.location.href = "/admin/login")}
            className="px-6 py-2.5 bg-white text-black rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </VideoShell>
    );
  }

  return <>{children}</>;
};

// ─── Tenant-only route guard ───────────────────────────────────────────────────

const TenantRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading || (isAuthenticated && !user)) {
    return (
      <VideoShell>
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white/40 mx-auto" />
          <p className="text-sm text-white/40">Verifying access…</p>
        </div>
      </VideoShell>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/tenant/login" replace />;
  }

  if (user?.role !== "tenant") {
    return (
      <VideoShell>
        <div className="text-center max-w-md mx-auto px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 rounded-2xl mb-4 border border-white/10">
            <svg
              className="w-8 h-8 text-white/45"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Access Denied
          </h2>
          <p className="text-white/40 text-sm mb-6">
            This system is restricted to verified tenants only.
          </p>
          <button
            onClick={() => (window.location.href = "/tenant/login")}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Return to Login
          </button>
        </div>
      </VideoShell>
    );
  }

  return <>{children}</>;
};

// ─── Routes ───────────────────────────────────────────────────────────────────

const AppRoutes: React.FC = () => (
  <Router>
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<HeroPage />} />
      <Route path="/properties" element={<PublicPropertyListPage />} />
      <Route path="/properties/:name" element={<PublicPropertyDetailPage />} />
      <Route path="/referencing/:token" element={<TenantReferencingForm />} />

      {/* Public Auth Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/signup" element={<AdminSignUp />} />
      <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="/tenant/login" element={<TenantLogin />} />
      <Route path="/tenant/signup" element={<TenantSignUp />} />

      {/* Admin routes (sharing AuthenticatedLayout) */}
      <Route
        element={
          <AdminRoute>
            <AuthenticatedLayout />
          </AdminRoute>
        }
      >
        <Route path="/admin" element={<VillaListPage />} />
        <Route path="/admin/villa/:villaName" element={<VillaRoomsPage />} />
        <Route path="/admin/room/:roomId" element={<RoomDetailPage />} />
        <Route path="/admin/profile" element={<ProfilePage />} />
        <Route path="/admin/management" element={<ManagementPage />} />
        <Route path="/admin/tenants" element={<TenantManagementPage />} />
      </Route>

      {/* Tenant routes (sharing TenantLayout) */}
      <Route
        element={
          <TenantRoute>
            <TenantLayout />
          </TenantRoute>
        }
      >
        <Route path="/tenant/dashboard" element={<TenantDashboard />} />
        <Route path="/tenant/rent" element={<TenantRentPage />} />
        <Route path="/tenant/documents" element={<TenantDocumentsPage />} />
        <Route path="/tenant/chat" element={<ChatAndAgreementPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Router>
);

// ─── App ──────────────────────────────────────────────────────────────────────

const App: React.FC = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default App;
