"use client";

import type React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import AdminLogin from "./pages/AdminLogin";
import AdminSignUp from "./pages/AdminSignUp";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VillaListPage from "./pages/VillaListPage";
import VillaRoomsPage from "./pages/VillaRoomsPage";
import RoomDetailPage from "./pages/RoomDetailPage";
import ManagementPage from "./pages/ManagementPage";
import AuthProvider from "./components/AuthProvider";
import { useAuth } from "./hooks/useAuth";

// Admin-only route guard — blocks non-admin users entirely
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // Show spinner while session is being resolved OR while authenticated but
  // user object hasn't been populated yet (backend /me fetch in progress)
  if (loading || (isAuthenticated && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white/40 mx-auto" />
          <p className="text-sm text-white/40">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Block non-admin users
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 rounded-2xl mb-4 border border-white/10">
            <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
          <p className="text-white/40 text-sm mb-6">
            This system is restricted to administrators only.
          </p>
          <button
            onClick={() => window.location.href = "/admin/login"}
            className="px-6 py-2.5 bg-white text-black rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Layout wrapper with admin navbar
const AdminLayout: React.FC = () => {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

// App Routes — admin-only system
const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public auth routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<AdminSignUp />} />
        <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* All admin routes require authentication + admin role */}
        <Route
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="/admin" element={<VillaListPage />} />
          <Route path="/admin/villa/:villaName" element={<VillaRoomsPage />} />
          <Route path="/admin/room/:roomId" element={<RoomDetailPage />} />
          <Route path="/admin/management" element={<ManagementPage />} />
        </Route>

        {/* Catch-all: redirect to admin login */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </Router>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
