"use client";

import type React from "react";
import { useState } from "react";
import { X, CheckCircle, Send, AlertCircle } from "lucide-react";
import { publicApi } from "../lib/tenantApi";

interface InterestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: number;
  roomName?: string;
  propertyName?: string;
}

export default function InterestFormModal({
  isOpen,
  onClose,
  roomId,
  roomName,
  propertyName,
}: InterestFormModalProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await publicApi.submitInterest({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        message: form.message || undefined,
        roomId: roomId,
        property_name: propertyName,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to submit interest. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!loading && !success) onClose();
        }}
      />
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-all"
        style={{
          background: "rgba(18,18,18,0.96)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h3 className="text-lg font-semibold text-white">Express Booking Interest</h3>
            <p className="text-xs text-white/40 mt-0.5">
              {roomName ? `Inquire about: ${roomName}` : `Inquire about: ${propertyName}`}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white/45 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-2">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <h4 className="text-lg font-medium text-white">Thank You!</h4>
              <p className="text-sm text-white/50 leading-relaxed max-w-xs mx-auto">
                Your booking inquiry has been submitted. Our property manager will reach out to you shortly.
              </p>
              <button
                onClick={() => {
                  onClose();
                  setSuccess(false);
                  setForm({ name: "", email: "", phone: "", message: "" });
                }}
                className="mt-4 px-6 py-2.5 bg-white text-black font-semibold rounded-xl text-sm hover:bg-white/95 active:scale-95 transition-all"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="interest-name" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Full Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  id="interest-name"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-10 w-full rounded-xl bg-white/[0.04] border border-white/10 px-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="interest-email" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Email Address <span className="text-emerald-400">*</span>
                </label>
                <input
                  id="interest-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-10 w-full rounded-xl bg-white/[0.04] border border-white/10 px-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="interest-phone" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  id="interest-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-10 w-full rounded-xl bg-white/[0.04] border border-white/10 px-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="interest-message" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Message / Special Request
                </label>
                <textarea
                  id="interest-message"
                  placeholder="Hello, I would like to express interest in renting this room starting next month..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl bg-white/[0.04] border border-white/10 p-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
                >
                  <Send className="w-3.5 h-3.5" />
                  {loading ? "Submitting..." : "Send Inquiry"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
