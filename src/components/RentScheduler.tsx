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
import { rentSchedulesApi } from "../lib/api";

const RentScheduler: React.FC = () => {
  const [schedules, setSchedules] = useState<RentSchedule[]>([]);
  const [reminders, setReminders] = useState<RentReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<RentSchedule | null>(
    null
  );
  const [recordingPayment, setRecordingPayment] = useState<string | null>(null);
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

  const refreshData = async () => {
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
      setError(err.message || "Failed to load rent schedules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

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
        const updated = await rentSchedulesApi.update(editingSchedule.id, editingSchedule);
        setSchedules(
          schedules.map((schedule) =>
            schedule.id === editingSchedule.id ? updated : schedule
          )
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
        schedule.dueDay
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
              : s
          )
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
      payment.dueDate.startsWith(currentMonth)
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
          <CardContent className="pt-6 text-red-700">
            {error}
          </CardContent>
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
                      <p className="font-medium">
                        {reminder.roomName} - {reminder.tenantName}
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
                      className="bg-pink-500 hover:bg-pink-600"
                      onClick={() => setRecordingPayment(reminder.scheduleId)}
                    >
                      Record Payment
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setReminders(
                          reminders.filter((r) => r.id !== reminder.id)
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
        className="bg-pink-500 hover:bg-pink-600"
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
                <Input
                  id="roomName"
                  value={
                    editingSchedule
                      ? editingSchedule.roomName
                      : newSchedule.roomName
                  }
                  onChange={(e) =>
                    editingSchedule
                      ? setEditingSchedule({
                          ...editingSchedule,
                          roomName: e.target.value,
                        })
                      : setNewSchedule({
                          ...newSchedule,
                          roomName: e.target.value,
                        })
                  }
                  placeholder="Room 101"
                />
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
                className="bg-pink-500 hover:bg-pink-600"
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
                className="bg-green-500 hover:bg-green-600"
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
                              getPaymentStatus(schedule)
                            )}
                          >
                            {getPaymentStatus(schedule)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            {schedule.tenantName}
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2" />$
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
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
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
                                        payment.paidDate || payment.dueDate
                                      ).toLocaleDateString()}
                                    </span>
                                    <span className="font-medium">
                                      $
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
                          className="bg-green-500 hover:bg-green-600"
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
