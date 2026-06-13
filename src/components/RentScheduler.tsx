"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  DollarSign,
  User,
  Clock,
  Check,
  Plus,
  Edit,
  Trash2,
  X,
  Bell,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import type {
  RentSchedule,
  RentPayment,
  RentReminder,
} from "../lib/documentTypes";
import { rentSchedulesApi, roomsApi } from "../lib/api";

interface RoomOption {
  id: string;
  name: string;
  location: string;
  label: string; // "location → name"
}

const RentScheduler: React.FC = () => {
  const isLikelyUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}£/i.test(
      value,
    );

  const getTenantPrimaryLabel = (name?: string, email?: string) => {
    if (!name && !email) return "";
    if (email) return email;
    if (name && !isLikelyUuid(name)) return name;
    return "";
  };

  const getTenantSecondaryLabel = (name?: string, email?: string) => {
    if (!name) return "";
    if (!email && !isLikelyUuid(name)) return ""; // no secondary if only name
    if (isLikelyUuid(name)) return "";
    if (name === email) return "";
    return name;
  };
  const [schedules, setSchedules] = useState<RentSchedule[]>([]);
  const [reminders, setReminders] = useState<RentReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<RentSchedule | null>(
    null,
  );
  const [recordingPayment, setRecordingPayment] = useState<string | null>(null);

  // Room dropdown state
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomSearch, setRoomSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [newSchedule, setNewSchedule] = useState<Partial<RentSchedule>>({
    roomName: "",
    tenantName: "",
    tenantEmail: "",
    tenantPhone: "",
    monthlyRent: 0,
    dueDay: 1,
    startDate: "",
    status: "active",
  });
  const [newPayment, setNewPayment] = useState<Partial<RentPayment>>({
    amount: 0,
    paidAmount: 0,
    status: "pending",
    paymentMethod: "",
    notes: "",
  });

  const refreshData = async (retries = 2): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const [schedulesData, remindersData] = await Promise.all([
        rentSchedulesApi.list(),
        rentSchedulesApi.reminders(),
      ]);
      setSchedules(schedulesData);
      setReminders(remindersData);
    } catch (err: any) {
      console.error("[RentScheduler] refreshData error:", err);
      if (
        retries > 0 &&
        (err.message?.includes("Failed to fetch") ||
          err.message?.includes("Network Error"))
      ) {
        console.warn(
          `[RentScheduler] Retrying in ${(3 - retries) * 1000}ms... (${retries} retries left)`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, (3 - retries) * 1000),
        );
        return refreshData(retries - 1);
      }
      setError(err.message || "Failed to load rent schedules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setRoomsLoading(true);
      const response = await roomsApi.getRooms();
      const allRooms = response.data || response;
      const opts: RoomOption[] = (allRooms as any[]).map((r: any) => ({
        id: String(r.id),
        name: r.name,
        location: r.location || "Unassigned",
        label: `${r.location || "Unassigned"} → ${r.name}`,
      }));
      setRooms(opts);
    } catch {
      // silently fail — dropdown will be empty
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleAddSchedule = async () => {
    if (
      newSchedule.roomName &&
      newSchedule.tenantName &&
      newSchedule.monthlyRent &&
      newSchedule.startDate
    ) {
      try {
        const schedule = await rentSchedulesApi.create({
          roomName: newSchedule.roomName,
          tenantName: newSchedule.tenantName,
          tenantEmail: newSchedule.tenantEmail || "",
          tenantPhone: newSchedule.tenantPhone || "",
          monthlyRent: newSchedule.monthlyRent,
          dueDay: newSchedule.dueDay || 1,
          startDate: newSchedule.startDate,
          endDate: newSchedule.endDate,
          status: "active",
        });
        setSchedules([schedule, ...schedules]);
        const remindersData = await rentSchedulesApi.reminders();
        setReminders(remindersData);
      } catch (err: any) {
        setError(err.message || "Failed to create schedule");
      }
      setNewSchedule({
        roomName: "",
        tenantName: "",
        tenantEmail: "",
        tenantPhone: "",
        monthlyRent: 0,
        dueDay: 1,
        startDate: "",
        status: "active",
      });
      setIsAddingSchedule(false);
    }
  };

  const handleUpdateSchedule = async () => {
    if (editingSchedule) {
      try {
        const updated = await rentSchedulesApi.update(
          editingSchedule.id,
          editingSchedule,
        );
        setSchedules(
          schedules.map((schedule) =>
            schedule.id === editingSchedule.id ? updated : schedule,
          ),
        );
        const remindersData = await rentSchedulesApi.reminders();
        setReminders(remindersData);
        setEditingSchedule(null);
      } catch (err: any) {
        setError(err.message || "Failed to update schedule");
      }
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (confirm("Are you sure you want to delete this rent schedule?")) {
      try {
        await rentSchedulesApi.remove(id);
        setSchedules(schedules.filter((schedule) => schedule.id !== id));
        const remindersData = await rentSchedulesApi.reminders();
        setReminders(remindersData);
      } catch (err: any) {
        setError(err.message || "Failed to delete schedule");
      }
    }
  };

  const handleRecordPayment = async (scheduleId: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (schedule && newPayment.amount) {
      const today = new Date();
      const dueDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        schedule.dueDay,
      );
      try {
        const payment = await rentSchedulesApi.recordPayment(scheduleId, {
          dueDate: dueDate.toISOString().split("T")[0],
          paidDate: today.toISOString().split("T")[0],
          amount: newPayment.amount || schedule.monthlyRent,
          paidAmount: newPayment.paidAmount || newPayment.amount || 0,
          status:
            (newPayment.paidAmount || 0) >= (newPayment.amount || 0)
              ? "paid"
              : "partial",
          paymentMethod: newPayment.paymentMethod || "",
          notes: newPayment.notes || "",
        });

        setSchedules(
          schedules.map((s) =>
            s.id === scheduleId
              ? { ...s, paymentHistory: [...s.paymentHistory, payment] }
              : s,
          ),
        );
        const remindersData = await rentSchedulesApi.reminders();
        setReminders(remindersData);
        setNewPayment({
          amount: 0,
          paidAmount: 0,
          status: "pending",
          paymentMethod: "",
          notes: "",
        });
        setRecordingPayment(null);
      } catch (err: any) {
        setError(err.message || "Failed to record payment");
      }
    }
  };

  const getPaymentStatus = (schedule: RentSchedule): string => {
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);

    const currentMonthPayment = schedule.paymentHistory.find((payment) =>
      payment.dueDate.startsWith(currentMonth),
    );

    if (!currentMonthPayment) {
      return "pending";
    }

    return currentMonthPayment.status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "partial":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalMonthlyRent = schedules
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + s.monthlyRent, 0);

  const paidThisMonth = schedules
    .filter((s) => s.status === "active")
    .filter((s) => getPaymentStatus(s) === "paid").length;

  const pendingPayments = schedules
    .filter((s) => s.status === "active")
    .filter((s) => getPaymentStatus(s) === "pending").length;

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-red-700">{error}</CardContent>
        </Card>
      )}
      {loading && (
        <Card>
          <CardContent className="pt-6">Loading rent schedules...</CardContent>
        </Card>
      )}
      {/* Rent Reminders */}
      {reminders.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <Bell className="w-5 h-5 mr-2" />
              Rent Collection Reminders ({reminders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-black">
                        {reminder.roomName} -{" "}
                        {getTenantPrimaryLabel(reminder.tenantName) ||
                          reminder.tenantName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Due: {new Date(reminder.dueDate).toLocaleDateString()} -
                        ${reminder.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-white text-black hover:bg-white/90 active:scale-[0.98] transition-all"
                      onClick={() => setRecordingPayment(reminder.scheduleId)}
                    >
                      Record Payment
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-black"
                      onClick={() =>
                        setReminders(
                          reminders.filter((r) => r.id !== reminder.id),
                        )
                      }
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{schedules.length}</div>
            <div className="text-sm text-gray-600">Active Schedules</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              ${totalMonthlyRent.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Monthly Expected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {paidThisMonth}
            </div>
            <div className="text-sm text-gray-600">Paid This Month</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {pendingPayments}
            </div>
            <div className="text-sm text-gray-600">Pending Payments</div>
          </CardContent>
        </Card>
      </div>

      {/* Add Schedule Button */}
      <Button
        onClick={() => setIsAddingSchedule(true)}
        className="bg-white text-black hover:bg-white/90 active:scale-[0.98] transition-all"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Rent Schedule
      </Button>

      {/* Add/Edit Schedule Form */}
      {(isAddingSchedule || editingSchedule) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {editingSchedule ? "Edit Rent Schedule" : "Add New Rent Schedule"}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddingSchedule(false);
                  setEditingSchedule(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="roomName">Room/Property Name *</Label>
                <div className="relative">
                  <input
                    id="roomName"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={
                      editingSchedule
                        ? editingSchedule.roomName
                        : roomSearch || newSchedule.roomName || ""
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (editingSchedule) {
                        setEditingSchedule({
                          ...editingSchedule,
                          roomName: val,
                        });
                      } else {
                        setRoomSearch(val);
                        setNewSchedule({ ...newSchedule, roomName: val });
                      }
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder={
                      roomsLoading ? "Loading rooms…" : "Search rooms…"
                    }
                    autoComplete="off"
                  />
                  {showDropdown && (
                    <div
                      className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-xl shadow-xl"
                      style={{
                        background: "var(--surface-2, #1a1a1a)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {(() => {
                        const searchVal = editingSchedule
                          ? editingSchedule.roomName
                          : roomSearch;
                        const filtered = rooms.filter((r) =>
                          r.label
                            .toLowerCase()
                            .includes((searchVal || "").toLowerCase()),
                        );
                        // Group by location
                        const grouped: Record<string, RoomOption[]> = {};
                        filtered.forEach((r) => {
                          if (!grouped[r.location]) grouped[r.location] = [];
                          grouped[r.location].push(r);
                        });

                        if (Object.keys(grouped).length === 0) {
                          return (
                            <div className="px-3 py-2.5 text-xs text-white/30">
                              {roomsLoading ? "Loading…" : "No rooms found"}
                            </div>
                          );
                        }

                        return Object.entries(grouped).map(
                          ([location, rms]) => (
                            <div key={location}>
                              <div
                                className="px-3 py-1.5 text-[10px] font-semibold text-white/25 uppercase tracking-wider"
                                style={{ background: "rgba(255,255,255,0.03)" }}
                              >
                                {location}
                              </div>
                              {rms.map((r) => (
                                <button
                                  key={r.id}
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                                  onClick={() => {
                                    const roomName = `${r.location} → ${r.name}`;
                                    if (editingSchedule) {
                                      setEditingSchedule({
                                        ...editingSchedule,
                                        roomName,
                                      });
                                    } else {
                                      setNewSchedule({
                                        ...newSchedule,
                                        roomName,
                                      });
                                      setRoomSearch(roomName);
                                    }
                                    setShowDropdown(false);
                                  }}
                                >
                                  {r.name}
                                </button>
                              ))}
                            </div>
                          ),
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="tenantName">Tenant Name *</Label>
                <Input
                  id="tenantName"
                  value={
                    editingSchedule
                      ? editingSchedule.tenantName
                      : newSchedule.tenantName
                  }
                  onChange={(e) =>
                    editingSchedule
                      ? setEditingSchedule({
                          ...editingSchedule,
                          tenantName: e.target.value,
                        })
                      : setNewSchedule({
                          ...newSchedule,
                          tenantName: e.target.value,
                        })
                  }
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tenantEmail">Tenant Email</Label>
                <Input
                  id="tenantEmail"
                  type="email"
                  value={
                    editingSchedule
                      ? editingSchedule.tenantEmail
                      : newSchedule.tenantEmail
                  }
                  onChange={(e) =>
                    editingSchedule
                      ? setEditingSchedule({
                          ...editingSchedule,
                          tenantEmail: e.target.value,
                        })
                      : setNewSchedule({
                          ...newSchedule,
                          tenantEmail: e.target.value,
                        })
                  }
                  placeholder="tenant@example.com"
                />
              </div>
              <div>
                <Label htmlFor="tenantPhone">Tenant Phone</Label>
                <Input
                  id="tenantPhone"
                  type="tel"
                  value={
                    editingSchedule
                      ? editingSchedule.tenantPhone
                      : newSchedule.tenantPhone
                  }
                  onChange={(e) =>
                    editingSchedule
                      ? setEditingSchedule({
                          ...editingSchedule,
                          tenantPhone: e.target.value,
                        })
                      : setNewSchedule({
                          ...newSchedule,
                          tenantPhone: e.target.value,
                        })
                  }
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="monthlyRent">Monthly Rent *</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  value={
                    editingSchedule
                      ? editingSchedule.monthlyRent
                      : newSchedule.monthlyRent
                  }
                  onChange={(e) =>
                    editingSchedule
                      ? setEditingSchedule({
                          ...editingSchedule,
                          monthlyRent: Number(e.target.value),
                        })
                      : setNewSchedule({
                          ...newSchedule,
                          monthlyRent: Number(e.target.value),
                        })
                  }
                  placeholder="1000"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="dueDay">Due Day (1-31) *</Label>
                <Input
                  id="dueDay"
                  type="number"
                  value={
                    editingSchedule
                      ? editingSchedule.dueDay
                      : newSchedule.dueDay
                  }
                  onChange={(e) =>
                    editingSchedule
                      ? setEditingSchedule({
                          ...editingSchedule,
                          dueDay: Number(e.target.value),
                        })
                      : setNewSchedule({
                          ...newSchedule,
                          dueDay: Number(e.target.value),
                        })
                  }
                  placeholder="1"
                  min="1"
                  max="31"
                />
              </div>
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={
                    editingSchedule
                      ? editingSchedule.startDate
                      : newSchedule.startDate
                  }
                  onChange={(e) =>
                    editingSchedule
                      ? setEditingSchedule({
                          ...editingSchedule,
                          startDate: e.target.value,
                        })
                      : setNewSchedule({
                          ...newSchedule,
                          startDate: e.target.value,
                        })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={
                  editingSchedule
                    ? editingSchedule.endDate
                    : newSchedule.endDate
                }
                onChange={(e) =>
                  editingSchedule
                    ? setEditingSchedule({
                        ...editingSchedule,
                        endDate: e.target.value,
                      })
                    : setNewSchedule({
                        ...newSchedule,
                        endDate: e.target.value,
                      })
                }
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={
                  editingSchedule ? handleUpdateSchedule : handleAddSchedule
                }
                className="bg-white text-black hover:bg-white/90 active:scale-[0.98] transition-all"
              >
                <Check className="w-4 h-4 mr-2" />
                {editingSchedule ? "Update" : "Save"} Schedule
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingSchedule(false);
                  setEditingSchedule(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Record Payment Form */}
      {recordingPayment && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Record Payment
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRecordingPayment(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentAmount">Amount Due</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) =>
                    setNewPayment({
                      ...newPayment,
                      amount: Number(e.target.value),
                    })
                  }
                  placeholder="1000"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="paidAmount">Amount Paid</Label>
                <Input
                  id="paidAmount"
                  type="number"
                  value={newPayment.paidAmount}
                  onChange={(e) =>
                    setNewPayment({
                      ...newPayment,
                      paidAmount: Number(e.target.value),
                    })
                  }
                  placeholder="1000"
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Input
                id="paymentMethod"
                value={newPayment.paymentMethod}
                onChange={(e) =>
                  setNewPayment({
                    ...newPayment,
                    paymentMethod: e.target.value,
                  })
                }
                placeholder="Cash, Bank Transfer, Card, etc."
              />
            </div>

            <div>
              <Label htmlFor="paymentNotes">Notes</Label>
              <Textarea
                id="paymentNotes"
                value={newPayment.notes}
                onChange={(e) =>
                  setNewPayment({ ...newPayment, notes: e.target.value })
                }
                placeholder="Additional notes about this payment"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleRecordPayment(recordingPayment)}
                className="bg-white text-black hover:bg-white/95"
              >
                <Check className="w-4 h-4 mr-2" />
                Save Payment
              </Button>
              <Button
                variant="outline"
                onClick={() => setRecordingPayment(null)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedules List */}
      <Card>
        <CardHeader>
          <CardTitle>Rent Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">
                No rent schedules found. Add your first schedule to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <Card key={schedule.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-lg">
                            {schedule.roomName}
                          </h4>
                          <Badge
                            className={getStatusColor(
                              getPaymentStatus(schedule),
                            )}
                          >
                            {getPaymentStatus(schedule)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            <div>
                              <div>
                                {getTenantPrimaryLabel(
                                  schedule.tenantName,
                                  schedule.tenantEmail,
                                ) || schedule.tenantName}
                              </div>
                              {getTenantSecondaryLabel(
                                schedule.tenantName,
                                schedule.tenantEmail,
                              ) && (
                                <div className="text-xs text-gray-500">
                                  {getTenantSecondaryLabel(
                                    schedule.tenantName,
                                    schedule.tenantEmail,
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2" />£
                            {schedule.monthlyRent.toLocaleString()} / month
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Due on day {schedule.dueDay}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            Since{" "}
                            {new Date(schedule.startDate).toLocaleDateString()}
                          </div>
                        </div>

                        {schedule.paymentHistory.length > 0 && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-black">
                            <p className="text-sm font-medium mb-2">
                              Recent Payments:
                            </p>
                            <div className="space-y-1">
                              {schedule.paymentHistory
                                .slice(-3)
                                .reverse()
                                .map((payment) => (
                                  <div
                                    key={payment.id}
                                    className="flex justify-between text-sm"
                                  >
                                    <span>
                                      {new Date(
                                        payment.paidDate || payment.dueDate,
                                      ).toLocaleDateString()}
                                    </span>
                                    <span className="font-medium">
                                      £
                                      {payment.paidAmount?.toLocaleString() ||
                                        0}
                                    </span>
                                    <Badge
                                      className={getStatusColor(payment.status)}
                                      variant="outline"
                                    >
                                      {payment.status}
                                    </Badge>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end space-y-2 ml-4">
                        <Button
                          size="sm"
                          className="bg-white text-black hover:bg-white/95"
                          onClick={() => {
                            setRecordingPayment(schedule.id);
                            setNewPayment({
                              ...newPayment,
                              amount: schedule.monthlyRent,
                              paidAmount: schedule.monthlyRent,
                            });
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Record
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSchedule(schedule)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RentScheduler;
