"use client";

import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../services/supabaseClient";

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  const handleSendReset = async () => {
    if (!user?.email) return;
    setStatus("sending");
    setMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.origin + "/admin/login",
      });
      if (error) {
        setStatus("error");
        setMessage(error.message || "Failed to send reset email");
      } else {
        setStatus("sent");
        setMessage("Password reset email sent. Check your inbox.");
      }
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div
        className="rounded-2xl p-6 sm:p-8"
        style={{
          background: "rgba(8,8,8,0.65)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <h1 className="text-2xl font-semibold text-white mb-4">My Profile</h1>
        <div className="text-sm text-white/60 space-y-3">
          <div>
            <div className="text-xs text-white/40">Name</div>
            <div className="text-white mt-1">{user?.username || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-white/40">Email</div>
            <div className="text-white mt-1">{user?.email || "—"}</div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSendReset}
            disabled={status === "sending"}
            className="px-4 py-2 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
          >
            {status === "sending" ? "Sending..." : "Reset password"}
          </button>
          {message && (
            <p
              className={`mt-3 text-sm ${status === "error" ? "text-red-400" : "text-white/60"}`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
