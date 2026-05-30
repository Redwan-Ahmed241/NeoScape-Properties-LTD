"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, CreditCard, FileText, AlertTriangle, Clock, MapPin, Users, Bed, Bath, Ruler } from "lucide-react";
import { tenantAssignmentApi, tenantRentApi, tenantDocumentApi } from "../../lib/tenantApi";
import type { TenantAssignment, TenantRentReminder, TenantDocumentItem } from "../../lib/tenantApi";

export default function TenantDashboard() {
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<TenantAssignment | null>(null);
  const [room, setRoom] = useState<any>(null);
  const [reminders, setReminders] = useState<TenantRentReminder[]>([]);
  const [documents, setDocuments] = useState<TenantDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [assignData, reminderData, docData] = await Promise.all([
          tenantAssignmentApi.myAssignment(),
          tenantRentApi.myReminders().catch(() => []),
          tenantDocumentApi.list().catch(() => []),
        ]);
        setAssignment(assignData.assignment);
        setRoom(assignData.room);
        setReminders(reminderData);
        setDocuments(docData);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white/40 mx-auto" />
          <p className="text-sm text-white/40">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const pendingDocs = documents.filter(d => d.status === "pending").length;
  const approvedDocs = documents.filter(d => d.status === "approved").length;
  const overdueReminders = reminders.filter(r => r.isOverdue);
  const upcomingReminders = reminders.filter(r => !r.isOverdue);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
        <p className="text-white/40 text-sm mt-1">
          Your tenant dashboard — everything about your stay in one place.
        </p>
      </div>

      {/* Overdue Alerts */}
      {overdueReminders.length > 0 && (
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-300">Overdue Rent Payment</p>
            <p className="text-xs text-red-400/60 mt-0.5">
              You have {overdueReminders.length} overdue payment{overdueReminders.length > 1 ? "s" : ""}.
              Total: £{overdueReminders.reduce((s, r) => s + r.amount, 0).toLocaleString()}.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Property",
            value: assignment?.property_name || "—",
            icon: Home,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            label: "Monthly Rent",
            value: assignment ? `£${Number(assignment.monthly_rent).toLocaleString()}` : "—",
            icon: CreditCard,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Documents",
            value: `${approvedDocs} approved`,
            sub: pendingDocs > 0 ? `${pendingDocs} pending` : undefined,
            icon: FileText,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            label: "Next Due",
            value: upcomingReminders.length > 0
              ? new Date(upcomingReminders[0].dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
              : "—",
            sub: upcomingReminders.length > 0 ? `in ${upcomingReminders[0].daysUntilDue} days` : undefined,
            icon: Clock,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-4"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <span className="text-xs text-white/40 font-medium">{stat.label}</span>
            </div>
            <p className="text-lg font-semibold text-white">{stat.value}</p>
            {stat.sub && <p className="text-xs text-white/30 mt-0.5">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {/* Room Details */}
      {room && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <h2 className="text-base font-semibold text-white">Your Room</h2>
            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              {assignment?.status || "active"}
            </span>
          </div>

          <div className="p-5">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Room Image */}
              {room.images && room.images.length > 0 && (
                <div className="lg:w-1/3 shrink-0">
                  <img
                    src={room.images[0]}
                    alt={room.name}
                    className="w-full h-48 lg:h-full object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Room Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">{room.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-white/40 text-sm">
                    <MapPin className="w-3.5 h-3.5" />
                    {room.location}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: Users, label: "Guests", value: room.maxGuests },
                    { icon: Bed, label: "Bedrooms", value: room.bedrooms },
                    { icon: Bath, label: "Bathrooms", value: room.bathrooms },
                    { icon: Ruler, label: "Size", value: `${room.size}m²` },
                  ].map(item => (
                    <div key={item.label} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <item.icon className="w-4 h-4 text-white/30 mb-1" />
                      <p className="text-xs text-white/40">{item.label}</p>
                      <p className="text-sm font-medium text-white">{item.value}</p>
                    </div>
                  ))}
                </div>

                {room.amenities && room.amenities.length > 0 && (
                  <div>
                    <p className="text-xs text-white/40 mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {room.amenities.slice(0, 8).map((a: string) => (
                        <span key={a} className="text-xs text-white/60 bg-white/5 px-2.5 py-1 rounded-full">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => navigate("/tenant/rent")}
          className="rounded-xl p-5 text-left hover:bg-white/[0.04] transition-colors"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}
        >
          <CreditCard className="w-5 h-5 text-emerald-400 mb-3" />
          <p className="text-sm font-medium text-white">View Rent Details</p>
          <p className="text-xs text-white/30 mt-1">Check payment history and upcoming due dates</p>
        </button>
        <button
          onClick={() => navigate("/tenant/documents")}
          className="rounded-xl p-5 text-left hover:bg-white/[0.04] transition-colors"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}
        >
          <FileText className="w-5 h-5 text-amber-400 mb-3" />
          <p className="text-sm font-medium text-white">Manage Documents</p>
          <p className="text-xs text-white/30 mt-1">Upload and track your tenancy documents</p>
        </button>
      </div>

      {/* No Assignment Message */}
      {!assignment && (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}
        >
          <Home className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <h3 className="text-base font-medium text-white/60">No Active Assignment</h3>
          <p className="text-sm text-white/30 mt-1 max-w-sm mx-auto">
            You haven't been assigned to a property yet. Your administrator will assign you shortly.
          </p>
        </div>
      )}
    </div>
  );
}
