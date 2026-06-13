"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  Plus,
  Search,
  FileText,
  Check,
  X,
  AlertCircle,
  Eye,
  Building,
  MessageSquare,
  Loader2,
} from "lucide-react";
import {
  tenantAssignmentApi,
  tenantDocumentApi,
  usersApi,
  type TenantAssignment,
  type TenantDocumentItem,
  type UserInfo,
} from "../../lib/tenantApi";
import { roomsApi } from "../../lib/api";
import ChatWindow from "../../components/ChatWindow";
import AgreementPanel from "../../components/AgreementPanel";

export default function TenantManagementPage() {
  const isLikelyUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );

  const getTenantPrimaryLabel = (username?: string, email?: string) =>
    email || username || "";

  const getTenantSecondaryLabel = (username?: string, email?: string) => {
    if (!username || !email) return "";
    if (isLikelyUuid(username)) return "";
    if (username === email) return "";
    return username;
  };

  const getUserPrimary = (u: UserInfo) => {
    // Prefer full name, then email, then username (if not UUID)
    const full = `${u.firstName || ""} ${u.lastName || ""}`.trim();
    if (full) return full;
    if (u.email) return u.email;
    if (u.username && !isLikelyUuid(u.username)) return u.username;
    return "";
  };

  const getUserSecondary = (u: UserInfo) => {
    if (!u.username) return "";
    if (u.username === u.email) return "";
    if (isLikelyUuid(u.username)) return "";
    // Don't repeat full name
    const full = `${u.firstName || ""} ${u.lastName || ""}`.trim();
    if (full && u.username === full) return "";
    return u.username;
  };

  const [activeTab, setActiveTab] = useState<
    "assignments" | "documents" | "users"
  >("assignments");

  // Data states
  const [assignments, setAssignments] = useState<TenantAssignment[]>([]);
  const [documents, setDocuments] = useState<TenantDocumentItem[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState("");

  // Assign Modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    tenant_id: "",
    room_id: "",
    property_name: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    monthly_rent: "",
    deposit: "0",
    notes: "",
  });
  const [isAssigning, setIsAssigning] = useState(false);

  // Document Review states
  const [selectedDoc, setSelectedDoc] = useState<TenantDocumentItem | null>(
    null,
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  // Admin Chat Modal states
  const [activeChatChannelId, setActiveChatChannelId] = useState<number | null>(null);
  const [chatTenantUsername, setChatTenantUsername] = useState<string>("");
  const [chatLoading, setChatLoading] = useState(false);

  const handleOpenChat = async (assignment: TenantAssignment) => {
    setChatLoading(true);
    setError("");
    try {
      const { supabase } = await import("../../services/supabaseClient");
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://room-booking-pjo6.onrender.com/api";
      const res = await fetch(`${API_BASE}/bookings/channels/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tenant_id: assignment.tenantId,
          property_name: assignment.property_name,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setActiveChatChannelId(data.data.id);
        setChatTenantUsername(assignment.tenantUsername);
      } else {
        setError(data.error || "Failed to open chat channel");
      }
    } catch (err: any) {
      setError("Error connecting to chat service");
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [assignmentsData, documentsData, usersData, roomsData] =
        await Promise.all([
          tenantAssignmentApi.list(),
          tenantDocumentApi.list(),
          usersApi.list(),
          roomsApi.getRooms(),
        ]);
      setAssignments(assignmentsData);
      setDocuments(documentsData);
      setUsers(usersData);
      setRooms(roomsData.data || roomsData);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch tenant management data");
    } finally {
      setLoading(false);
    }
  };

  const handleEndAssignment = async (id: number) => {
    if (!confirm("Are you sure you want to end this active assignment?"))
      return;
    try {
      await tenantAssignmentApi.update(id, {
        status: "ended",
        end_date: new Date().toISOString().split("T")[0],
      } as any);
      setSuccess("Assignment ended successfully.");
      fetchData();
    } catch (err: any) {
      setError(err?.message || "Failed to end assignment");
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAssigning(true);
    setError("");
    setSuccess("");

    if (!assignForm.tenant_id || !assignForm.room_id) {
      setError("Please select both a tenant and a room.");
      setIsAssigning(false);
      return;
    }

    try {
      // Find room info to get the property name
      const selectedRoomObj = rooms.find(
        (r) => String(r.id) === String(assignForm.room_id),
      );
      const propertyName = selectedRoomObj ? selectedRoomObj.location : "";

      // Create assignment
      await tenantAssignmentApi.create({
        tenant_id: Number(assignForm.tenant_id),
        room_id: Number(assignForm.room_id),
        property_name: propertyName,
        start_date: assignForm.start_date,
        end_date: assignForm.end_date || undefined,
        monthly_rent: Number(assignForm.monthly_rent),
        deposit: Number(assignForm.deposit),
        notes: assignForm.notes,
      });

      // Automatically ensure user's role is set to 'tenant'
      const assignedUser = users.find(
        (u) => u.id === Number(assignForm.tenant_id),
      );
      if (assignedUser && assignedUser.role !== "tenant") {
        await usersApi.setRole(assignedUser.id, "tenant");
      }

      setSuccess("Tenant assigned successfully!");
      setShowAssignModal(false);
      // Reset form
      setAssignForm({
        tenant_id: "",
        room_id: "",
        property_name: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        monthly_rent: "",
        deposit: "0",
        notes: "",
      });
      fetchData();
    } catch (err: any) {
      setError(err?.message || "Failed to assign tenant");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRoleChange = async (userId: number, role: string) => {
    try {
      await usersApi.setRole(userId, role);
      setSuccess("User role updated successfully.");
      fetchData();
    } catch (err: any) {
      setError(err?.message || "Failed to update role");
    }
  };

  const handleDocumentReviewSubmit = async (
    status: "approved" | "rejected",
  ) => {
    if (!selectedDoc) return;
    setIsReviewing(true);
    setError("");
    setSuccess("");
    try {
      await tenantDocumentApi.review(selectedDoc.id, {
        status,
        admin_notes: reviewNotes,
      });
      setSuccess(`Document is marked as ${status}.`);
      setSelectedDoc(null);
      setReviewNotes("");
      fetchData();
    } catch (err: any) {
      setError(err?.message || "Failed to review document");
    } finally {
      setIsReviewing(false);
    }
  };

  const filteredAssignments = assignments.filter(
    (a) =>
      a.tenantUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tenantEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.property_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredDocuments = documents.filter(
    (d) =>
      d.tenantUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-emerald-400 animate-pulse" />
            Tenant Management
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Assign rooms, verify tenant documents, and configure platform roles.
          </p>
        </div>
        <button
          onClick={() => setShowAssignModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-black hover:bg-white/95 active:scale-95 font-medium rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Assign Tenant
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button
            className="ml-auto text-red-400/50 hover:text-red-400"
            onClick={() => setError("")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 mb-6">
          <Check className="w-4 h-4 shrink-0" />
          <span>{success}</span>
          <button
            className="ml-auto text-emerald-400/50 hover:text-emerald-400"
            onClick={() => setSuccess("")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Glassmorphic Container */}
      <div
        className="rounded-2xl p-6 sm:p-8"
        style={{
          background: "rgba(8,8,8,0.65)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Navigation & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/[0.07]">
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-white/[0.03] p-1 rounded-xl border border-white/[0.05]">
            <button
              onClick={() => {
                setActiveTab("assignments");
                setSearchQuery("");
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === "assignments"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-white/40 hover:text-white"
              }`}
            >
              <Building className="w-4 h-4" /> Assignments
            </button>
            <button
              onClick={() => {
                setActiveTab("documents");
                setSearchQuery("");
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === "documents"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-white/40 hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4" /> Documents Review
              {documents.filter((d) => d.status === "pending").length > 0 && (
                <span className="bg-emerald-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {documents.filter((d) => d.status === "pending").length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("users");
                setSearchQuery("");
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === "users"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-white/40 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" /> User Directory
            </button>
          </div>

          {/* Search Input */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full pl-10 pr-4 bg-white/[0.04] border border-white/[0.08] hover:border-white/20 focus:border-emerald-500/50 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none transition-all duration-200"
            />
          </div>
        </div>

        {/* Tab Contents */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto mb-4" />
            <p className="text-white/40 text-sm">Loading data...</p>
          </div>
        ) : (
          <>
            {/* assignments Tab */}
            {activeTab === "assignments" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.05] text-white/35 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Tenant</th>
                      <th className="py-3 px-4">Room & Property</th>
                      <th className="py-3 px-4">Rent / Deposit</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {filteredAssignments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-12 text-center text-white/35"
                        >
                          No room assignments found. Click "Assign Tenant" to
                          make your first assignment.
                        </td>
                      </tr>
                    ) : (
                      filteredAssignments.map((a) => (
                        <tr
                          key={a.id}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="py-4 px-4">
                            <div className="font-medium text-white">
                              {getTenantPrimaryLabel(
                                a.tenantUsername,
                                a.tenantEmail,
                              )}
                            </div>
                            {getTenantSecondaryLabel(
                              a.tenantUsername,
                              a.tenantEmail,
                            ) && (
                              <div className="text-white/40 text-xs mt-0.5">
                                {getTenantSecondaryLabel(
                                  a.tenantUsername,
                                  a.tenantEmail,
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-medium text-white">
                              {a.roomName}
                            </div>
                            <div className="text-white/40 text-xs mt-0.5">
                              {a.property_name}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-medium text-white">
                              ${a.monthly_rent}/mo
                            </div>
                            <div className="text-white/40 text-xs mt-0.5">
                              Deposit: ${a.deposit}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-white/70">{a.start_date}</div>
                            <div className="text-white/30 text-xs mt-0.5">
                              to {a.end_date || "Present"}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium leading-none ${
                                a.status === "active"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : a.status === "pending"
                                    ? "bg-amber-500/10 text-amber-400"
                                    : "bg-white/5 text-white/40"
                              }`}
                            >
                              {a.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {chatLoading && activeChatChannelId === null ? (
                                <Loader2 className="animate-spin w-4 h-4 text-emerald-500" />
                              ) : (
                                a.status === "active" && (
                                  <>
                                    <button
                                      onClick={() => handleOpenChat(a)}
                                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-all"
                                    >
                                      Chat & Agreement
                                    </button>
                                    <button
                                      onClick={() => handleEndAssignment(a.id)}
                                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg text-xs font-semibold transition-all"
                                    >
                                      End Assignment
                                    </button>
                                  </>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* documents Tab */}
            {activeTab === "documents" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.05] text-white/35 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Tenant</th>
                      <th className="py-3 px-4">Document Details</th>
                      <th className="py-3 px-4">Uploaded At</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {filteredDocuments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center text-white/35"
                        >
                          No tenant documents found.
                        </td>
                      </tr>
                    ) : (
                      filteredDocuments.map((d) => (
                        <tr
                          key={d.id}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="py-4 px-4">
                            <div className="font-medium text-white">
                              {getTenantPrimaryLabel(
                                d.tenantUsername,
                                d.tenantEmail,
                              )}
                            </div>
                            {getTenantSecondaryLabel(
                              d.tenantUsername,
                              d.tenantEmail,
                            ) && (
                              <div className="text-white/40 text-xs mt-0.5">
                                {getTenantSecondaryLabel(
                                  d.tenantUsername,
                                  d.tenantEmail,
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-medium text-white flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-white/30" />
                              {d.name}
                            </div>
                            <div className="text-white/40 text-xs mt-0.5">
                              Type: {d.type}
                            </div>
                            {d.description && (
                              <p className="text-white/30 text-xs italic mt-1">
                                {d.description}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-white/70">
                              {new Date(d.uploaded_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium leading-none ${
                                d.status === "approved"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : d.status === "pending"
                                    ? "bg-amber-500/10 text-amber-400"
                                    : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              {d.status.toUpperCase()}
                            </span>
                            {d.admin_notes && (
                              <p className="text-white/40 text-[10px] mt-1 max-w-[150px] truncate">
                                Note: {d.admin_notes}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={d.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg transition-all"
                                title="View Document"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                              {d.status === "pending" && (
                                <button
                                  onClick={() => {
                                    setSelectedDoc(d);
                                    setReviewNotes(d.admin_notes || "");
                                  }}
                                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-all"
                                >
                                  Review
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* users Tab */}
            {activeTab === "users" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.05] text-white/35 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-right">Assign/Edit Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center text-white/35"
                        >
                          No users found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="py-4 px-4 font-medium text-white">
                            {getUserPrimary(u) || u.username}
                            {getUserSecondary(u) && (
                              <div className="text-white/40 text-xs">
                                {getUserSecondary(u)}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-white/70">{u.email}</td>
                          <td className="py-4 px-4 text-white/40">
                            {u.phone || "—"}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium leading-none ${
                                u.role === "admin"
                                  ? "bg-purple-500/10 text-purple-400"
                                  : u.role === "tenant"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-white/5 text-white/60"
                              }`}
                            >
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <select
                              value={u.role}
                              onChange={(e) =>
                                handleRoleChange(u.id, e.target.value)
                              }
                              className="px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                              <option
                                value="customer"
                                className="bg-[#111] text-white"
                              >
                                Customer
                              </option>
                              <option
                                value="tenant"
                                className="bg-[#111] text-white"
                              >
                                Tenant
                              </option>
                              <option
                                value="admin"
                                className="bg-[#111] text-white"
                              >
                                Admin
                              </option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Assign Tenant Modal ── */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden border border-white/10"
            style={{ background: "rgba(18,18,18,0.98)" }}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-xl font-semibold text-white">
                Assign Tenant to Room
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              {/* Select Tenant User */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/40 uppercase">
                  Select Tenant User
                </label>
                <select
                  value={assignForm.tenant_id}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, tenant_id: e.target.value })
                  }
                  required
                  className="h-11 w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="" className="bg-[#111] text-white/40">
                    -- Choose User --
                  </option>
                  {users.map((u) => (
                    <option
                      key={u.id}
                      value={u.id}
                      className="bg-[#111] text-white"
                    >
                      {getUserPrimary(u) || u.username} ({u.email} - {u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Room */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/40 uppercase">
                  Select Room
                </label>
                <select
                  value={assignForm.room_id}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, room_id: e.target.value })
                  }
                  required
                  className="h-11 w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="" className="bg-[#111] text-white/40">
                    -- Choose Room --
                  </option>
                  {rooms.map((r) => (
                    <option
                      key={r.id}
                      value={r.id}
                      className="bg-[#111] text-white"
                    >
                      {r.name} - {r.location} (${r.price}/mo)
                    </option>
                  ))}
                </select>
              </div>

              {/* Rent & Deposit details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/40 uppercase">
                    Monthly Rent ($)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="800"
                    value={assignForm.monthly_rent}
                    onChange={(e) =>
                      setAssignForm({
                        ...assignForm,
                        monthly_rent: e.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/40 uppercase">
                    Deposit ($)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="1600"
                    value={assignForm.deposit}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, deposit: e.target.value })
                    }
                    className="h-11 w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/40 uppercase">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={assignForm.start_date}
                    onChange={(e) =>
                      setAssignForm({
                        ...assignForm,
                        start_date: e.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/40 uppercase">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={assignForm.end_date}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, end_date: e.target.value })
                    }
                    className="h-11 w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/40 uppercase">
                  Notes / Special Agreements
                </label>
                <textarea
                  value={assignForm.notes}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, notes: e.target.value })
                  }
                  placeholder="e.g. includes utilities, parking space #4"
                  rows={2}
                  className="w-full rounded-xl bg-white/[0.04] border border-white/10 p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="px-5 py-2.5 bg-white text-black hover:bg-white/95 rounded-xl text-sm font-semibold transition-all"
                >
                  {isAssigning ? "Assigning..." : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Document Review Modal ── */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden border border-white/10"
            style={{ background: "rgba(18,18,18,0.98)" }}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-xl font-semibold text-white">
                Review Tenant Document
              </h3>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs font-medium text-white/40 uppercase">
                  Document Name
                </div>
                <div className="text-white text-sm font-medium mt-0.5">
                  {selectedDoc.name}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-white/40 uppercase">
                  Tenant Details
                </div>
                <div className="text-white text-sm font-medium mt-0.5">
                  {selectedDoc.tenantUsername} ({selectedDoc.tenantEmail})
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-white/40 uppercase">
                  Uploaded File
                </div>
                <a
                  href={selectedDoc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors mt-1.5"
                >
                  <FileText className="w-4 h-4" /> Open/Download Document &rarr;
                </a>
              </div>

              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-xs font-medium text-white/40 uppercase">
                  Review Notes / Reason (Optional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Verified. / Please upload a clearer copy showing the signature page."
                  rows={3}
                  className="w-full rounded-xl bg-white/[0.04] border border-white/10 p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => handleDocumentReviewSubmit("rejected")}
                  disabled={isReviewing}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl text-sm font-semibold transition-all"
                >
                  Reject Document
                </button>
                <button
                  type="button"
                  onClick={() => handleDocumentReviewSubmit("approved")}
                  disabled={isReviewing}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-all"
                >
                  Approve Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin Chat & Agreement Modal ── */}
      {activeChatChannelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div
            className="w-full max-w-6xl rounded-2xl overflow-hidden border border-white/10 flex flex-col h-[90vh]"
            style={{ background: "rgba(18,18,18,0.98)" }}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-emerald-400 animate-pulse" />
                Tenancy Workspace - Chat & Contract for {chatTenantUsername}
              </h3>
              <button
                onClick={() => {
                  setActiveChatChannelId(null);
                  setChatTenantUsername("");
                }}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
              {/* Chat column */}
              <div className="lg:col-span-5 h-full min-h-0 flex flex-col">
                <ChatWindow channelId={activeChatChannelId} />
              </div>
              
              {/* Agreement column */}
              <div className="lg:col-span-7 h-full min-h-0 flex flex-col font-sans">
                <AgreementPanel channelId={activeChatChannelId} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
