"use client";

import type React from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Shield, ChevronDown } from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "../hooks/useAuth";

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

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
              className={`text-sm font-medium transition-colors ${
                location.pathname === "/admin"
                  ? "text-pink-500"
                  : "text-gray-600 hover:text-pink-500"
              }`}
            >
              Properties
            </Link>
          </div>

          {/* Right Side */}
          <div className="relative">
            <button
              className="flex items-center gap-2 border border-gray-200 rounded-full px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsMenuOpen((o) => !o)}
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
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {user?.username || "Admin"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
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
    </nav>
  );
};

export default Navbar;
