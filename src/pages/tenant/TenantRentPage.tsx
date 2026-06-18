"use client";

import { useState, useEffect } from "react";
import { CreditCard, Calendar, AlertTriangle, CheckCircle, Clock, PoundSterling } from "lucide-react";
import { tenantRentApi } from "../../lib/tenantApi";
import type { TenantRentSchedule, TenantRentReminder } from "../../lib/tenantApi";

export default function TenantRentPage() {
  const [schedules, setSchedules] = useState<TenantRentSchedule[]>([]);
  const [reminders, setReminders] = useState<TenantRentReminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r] = await Promise.all([
          tenantRentApi.mySchedules(),
          tenantRentApi.myReminders(),
        ]);
        setSchedules(s);
        setReminders(r);
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
          <p className="text-sm text-white/40">Loading rent information…</p>
        </div>
      </div>
    );
  }

  const overdueReminders = reminders.filter(r => r.isOverdue);
  const upcomingReminders = reminders.filter(r => !r.isOverdue);

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "overdue": return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case "partial": return <Clock className="w-4 h-4 text-amber-400" />;
      default: return <Clock className="w-4 h-4 text-white/30" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "text-emerald-400 bg-emerald-500/10";
      case "overdue": return "text-red-400 bg-red-500/10";
      case "partial": return "text-amber-400 bg-amber-500/10";
      default: return "text-white/40 bg-white/5";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Rent & Payments</h1>
        <p className="text-white/40 text-sm mt-1">Track your rent schedule, due dates, and payment history.</p>
      </div>

      {/* Overdue Alert */}
      {overdueReminders.length > 0 && (
        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-300">Overdue Payment{overdueReminders.length > 1 ? "s" : ""}</p>
            {overdueReminders.map(r => (
              <p key={r.id} className="text-xs text-red-400/60 mt-1">
                {r.roomName} — £{r.amount.toLocaleString()} was due {new Date(r.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} ({Math.abs(r.daysUntilDue)} days ago)
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)" }}>
          <Calendar className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">Upcoming Due Date{upcomingReminders.length > 1 ? "s" : ""}</p>
            {upcomingReminders.map(r => (
              <p key={r.id} className="text-xs text-amber-400/60 mt-1">
                {r.roomName} — £{r.amount.toLocaleString()} due {new Date(r.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} (in {r.daysUntilDue} day{r.daysUntilDue !== 1 ? "s" : ""})
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Rent Schedules */}
      {schedules.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}>
          <CreditCard className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <h3 className="text-base font-medium text-white/60">No Rent Schedules</h3>
          <p className="text-sm text-white/30 mt-1">No rent schedules are currently linked to your account.</p>
        </div>
      ) : (
        schedules.map(schedule => (
          <div key={schedule.id} className="rounded-xl overflow-hidden" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}>
            {/* Schedule Header */}
            <div className="p-5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <PoundSterling className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-white">{schedule.room_name}</h3>
                    <p className="text-xs text-white/40">
                      £{Number(schedule.monthly_rent).toLocaleString()}/month · Due day {schedule.due_day}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  schedule.status === "active" ? "text-emerald-400 bg-emerald-500/10" : "text-white/40 bg-white/5"
                }`}>
                  {schedule.status}
                </span>
              </div>
            </div>

            {/* Payment History */}
            <div className="p-5">
              <p className="text-xs text-white/40 font-medium mb-3">Payment History</p>
              {(!schedule.payment_history || schedule.payment_history.length === 0) ? (
                <p className="text-sm text-white/20">No payments recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {schedule.payment_history.map(payment => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <div className="flex items-center gap-3">
                        {getPaymentStatusIcon(payment.status)}
                        <div>
                          <p className="text-sm text-white/80">
                            {new Date(payment.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          <p className="text-xs text-white/30">
                            {payment.paid_date
                              ? `Paid ${new Date(payment.paid_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                              : "Not yet paid"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">£{Number(payment.amount).toLocaleString()}</p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getPaymentStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
