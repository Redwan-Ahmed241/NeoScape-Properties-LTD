"use client";

import type React from "react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Home, CreditCard, FileText, Check } from "lucide-react";
import { signUpWithEmail } from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";

export default function TenantSignUp() {
  const [fields, setFields] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated && user?.role === "tenant") {
    return <Navigate to="/tenant/dashboard" replace />;
  }
  if (isAuthenticated && user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const set = (key: keyof typeof fields) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    if (fields.password.length < 8) {
      setError("Password must be at least 8 characters.");
      setIsLoading(false);
      return;
    }

    try {
      // Sign up with role set to 'tenant' in user metadata
      const result = await signUpWithEmail(
        fields.email,
        fields.password,
        {
          username: `${fields.firstName} ${fields.lastName}`.trim(),
          role: "tenant",
        }
      );

      if (!result.success) {
        setError(result.error || "Sign up failed. Please try again.");
      } else if (result.needsEmailConfirmation) {
        setSuccessMessage(
          "Account created! Check your email to confirm your address before signing in."
        );
      } else {
        setSuccessMessage("Account created! You can now sign in.");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Sign up failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full bg-black selection:bg-white/30 p-2 lg:h-screen lg:overflow-hidden lg:p-4">
      {/* Left Column — Hero */}
      <div className="relative hidden w-[52%] flex-col items-center justify-end pb-32 px-12 rounded-3xl overflow-hidden shadow-2xl h-full lg:flex">
        <video className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline>
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4" type="video/mp4" />
        </video>
        <div className="relative z-10 w-full max-w-xs space-y-8">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-400" />
            <button type="button" onClick={() => navigate("/")} className="text-xl font-semibold tracking-tight text-white hover:text-white/80 transition-colors">
              NeoScape Properties
            </button>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-medium tracking-tight text-white">Create Tenant Account</h1>
            <p className="text-sm leading-relaxed text-white/60">Register to connect with your assigned property and start managing your tenancy.</p>
          </div>
          <div className="space-y-2">
            {[
              { icon: Home, text: "View your room & property" },
              { icon: CreditCard, text: "Track rent & payments" },
              { icon: FileText, text: "Manage documents" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-[#1A1A1A] px-4 py-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                  <step.icon className="h-3 w-3 text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-white">{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column — Form */}
      <div className="flex flex-1 flex-col items-center justify-center py-12 px-4 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto lg:overflow-hidden">
        <div className="w-full max-w-xl space-y-8">
          <div className="space-y-1.5">
            <div className="inline-block text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full mb-3">
              TENANT REGISTRATION
            </div>
            <h2 className="text-3xl font-medium tracking-tight text-white">Create Account</h2>
            <p className="text-sm text-white/40">Enter your details to register as a tenant.</p>
          </div>

          {successMessage && (
            <div className="flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              <Check className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2.5} />
              <span>{successMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="firstName" className="text-sm font-medium text-white">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={fields.firstName}
                  onChange={set("firstName")}
                  required
                  autoComplete="given-name"
                  className="h-11 w-full rounded-xl bg-[#1A1A1A] px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all duration-200"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="lastName" className="text-sm font-medium text-white">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={fields.lastName}
                  onChange={set("lastName")}
                  required
                  autoComplete="family-name"
                  className="h-11 w-full rounded-xl bg-[#1A1A1A] px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-white">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={fields.email}
                onChange={set("email")}
                required
                autoComplete="email"
                className="h-11 w-full rounded-xl bg-[#1A1A1A] px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all duration-200"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-white">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={fields.password}
                  onChange={set("password")}
                  required
                  autoComplete="new-password"
                  className="h-11 w-full rounded-xl bg-[#1A1A1A] px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all duration-200"
                />
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="text-white/40 hover:text-white/70 transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-white/30 pl-1">Requires at least 8 characters.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !!successMessage}
              className="mt-4 h-14 w-full rounded-xl bg-emerald-500 font-semibold text-white transition-all hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? "Creating account…" : "Create Tenant Account"}
            </button>
          </form>

          <div className="text-center space-y-2">
            <p className="text-sm text-white/40">
              Already have a tenant account?{" "}
              <button type="button" onClick={() => navigate("/tenant/login")} className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                Log in
              </button>
            </p>
            <p className="text-sm text-white/30">
              Are you an admin?{" "}
              <button type="button" onClick={() => navigate("/admin/login")} className="font-medium text-white/50 hover:text-white transition-colors">
                Admin Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
