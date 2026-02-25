"use client";

import type React from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, ChevronDown } from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "../hooks/useAuth";

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/">
              <Logo />
            </Link>
          </div>

          {/* Center Navigation - Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                location.pathname === "/"
                  ? "text-pink-500"
                  : "text-gray-700 hover:text-pink-500"
              }`}
            >
              Villas
            </Link>
            <Link
              to="/rooms"
              className={`text-sm font-medium transition-colors ${
                location.pathname === "/rooms"
                  ? "text-pink-500"
                  : "text-gray-700 hover:text-pink-500"
              }`}
            >
              Rooms
            </Link>
            {isAuthenticated && user?.role === "admin" && (
              <Link
                to="/admin"
                className={`text-sm font-medium transition-colors ${
                  location.pathname === "/admin"
                    ? "text-pink-500"
                    : "text-gray-700 hover:text-pink-500"
                }`}
              >
                Admin Dashboard
              </Link>
            )}
          </div>

          {/* Right Side - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative flex items-center space-x-2">
                <button
                  className="flex items-center space-x-2 border border-gray-300 rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none"
                  onClick={() => setIsMenuOpen((open) => !open)}
                >
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.username}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {user?.username?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span>Profile</span>
                  <ChevronDown className="h-4 w-4 ml-1 text-gray-500" />
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-50">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-2 border border-gray-300 rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <User className="h-5 w-5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-700 hover:text-pink-500 transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              <Link
                to="/"
                className={`block px-4 py-2 text-sm font-medium transition-colors ${
                  location.pathname === "/"
                    ? "text-pink-500"
                    : "text-gray-700 hover:text-pink-500"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Villas
              </Link>
              <Link
                to="/rooms"
                className={`block px-4 py-2 text-sm font-medium transition-colors ${
                  location.pathname === "/rooms"
                    ? "text-pink-500"
                    : "text-gray-700 hover:text-pink-500"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Rooms
              </Link>
              {isAuthenticated ? (
                <>
                  {user?.role === "admin" && (
                    <Link
                      to="/admin"
                      className={`block px-4 py-2 text-sm font-medium transition-colors ${
                        location.pathname === "/admin"
                          ? "text-pink-500"
                          : "text-gray-700 hover:text-pink-500"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className={`block px-4 py-2 text-sm font-medium transition-colors ${
                      location.pathname === "/profile"
                        ? "text-pink-500"
                        : "text-gray-700 hover:text-pink-500"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:text-pink-500 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-4 py-2 text-sm font-medium text-gray-700 hover:text-pink-500 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-2 text-sm font-medium text-gray-700 hover:text-pink-500 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                  <Link
                    to="/admin/login"
                    className="block px-4 py-2 text-sm font-medium text-gray-700 hover:text-pink-500 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Login
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
