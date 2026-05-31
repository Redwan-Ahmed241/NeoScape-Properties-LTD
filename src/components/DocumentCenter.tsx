"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  AlertCircle,
  Check,
  X,
  Plus,
  Edit,
  Trash2,
  Download,
  Bell,
  CheckCircle,
  Loader2,
  User,
  Home,
  Info,
} from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import type { PropertyDocument } from "../lib/documentTypes";
import { documentsApi, roomsApi } from "../lib/api";
import { tenantAssignmentApi } from "../lib/tenantApi";
import type { TenantAssignment } from "../lib/tenantApi";

interface DocumentCenterProps {
  propertyName?: string;
}

const DOC_TYPES = [
  { value: "license", label: "License" },
  { value: "permit", label: "Permit" },
  { value: "insurance", label: "Insurance" },
  { value: "contract", label: "Tenancy Contract" },
  { value: "certificate", label: "Certificate" },
  { value: "id", label: "ID Document" },
  { value: "proof_of_address", label: "Proof of Address" },
  { value: "reference", label: "Reference Letter" },
  { value: "other", label: "Other" },
];

const DocumentCenter: React.FC<DocumentCenterProps> = ({ propertyName }) => {
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<TenantAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filtering states
  const [activeTab, setActiveTab] = useState<
    "all" | "property" | "room" | "tenant"
  >("all");

  // Upload and Form states
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingDoc, setEditingDoc] = useState<PropertyDocument | null>(null);
  const [reviewingDoc, setReviewingDoc] = useState<PropertyDocument | null>(
    null,
  );
  const [reviewNotes, setReviewNotes] = useState("");

  const [form, setForm] = useState({
    name: "",
    type: "other",
    description: "",
    fileUrl: "",
    linkType: "property" as "property" | "room" | "tenant",
    roomId: "",
    tenantId: "",
    assignmentId: "",
    expiryDate: "",
    renewalDate: "",
    reminderDays: 30,
    notes: "",
    adminNotes: "",
  });

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const resetForm = () => {
    setForm({
      name: "",
      type: "other",
      description: "",
      fileUrl: "",
      linkType: "property",
      roomId: "",
      tenantId: "",
      assignmentId: "",
      expiryDate: "",
      renewalDate: "",
      reminderDays: 30,
      notes: "",
      adminNotes: "",
    });
    setUploadFile(null);
  };

  const fetchData = useCallback(async () => {
    if (!propertyName) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [docsData, roomsData, assignmentsData] = await Promise.all([
        documentsApi.list({ propertyId: propertyName }),
        roomsApi.getRooms(),
        tenantAssignmentApi.list("active"),
      ]);

      setDocuments(docsData);

      const allRooms = roomsData.data || roomsData;
      const filteredRooms = allRooms.filter(
        (r: any) => r.location === propertyName,
      );
      setRooms(filteredRooms);

      const filteredAssignments = assignmentsData.filter(
        (a: any) => a.property_name === propertyName,
      );
      setAssignments(filteredAssignments);
    } catch (err: any) {
      setError(err.message || "Failed to load document center data");
    } finally {
      setLoading(false);
    }
  }, [propertyName]);

  const isLikelyUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );

  const getTenantPrimaryLabel = (username?: string, email?: string) => {
    if (!username && !email) return "";
    if (email) return email;
    if (username && !isLikelyUuid(username)) return username;
    return "";
  };

  const getTenantSecondaryLabel = (username?: string, email?: string) => {
    if (!username) return "";
    if (isLikelyUuid(username)) return "";
    if (!email && username) return "";
    if (username === email) return "";
    return username;
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUploadFile = async () => {
    if (!uploadFile) return;
    try {
      setUploading(true);
      setError(null);
      const url = await documentsApi.upload(uploadFile);
      setForm((prev) => ({ ...prev, fileUrl: url }));
      showSuccess("File uploaded successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name) {
      setError("Document name is required.");
      return;
    }

    let fileUrl = form.fileUrl || "";

    // Auto-upload if file picked but not uploaded
    if (!fileUrl && uploadFile) {
      try {
        setUploading(true);
        setError(null);
        fileUrl = await documentsApi.upload(uploadFile);
        setForm((prev) => ({ ...prev, fileUrl }));
      } catch (err: any) {
        setError(err.message || "Failed to upload file.");
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    if (!fileUrl) {
      setError("Please provide a File URL or upload a file from your device.");
      return;
    }

    try {
      setError(null);

      // Determine links
      const roomId = form.linkType === "room" ? Number(form.roomId) : undefined;
      let tenantId =
        form.linkType === "tenant" ? Number(form.tenantId) : undefined;
      let assignmentId =
        form.linkType === "tenant" ? Number(form.assignmentId) : undefined;

      // If assignment linked, fill tenantId
      if (assignmentId && !tenantId) {
        const matchingAssignment = assignments.find(
          (a) => a.id === assignmentId,
        );
        if (matchingAssignment) {
          tenantId = matchingAssignment.tenantId;
        }
      }

      const payload: Partial<PropertyDocument> = {
        propertyId: propertyName || "",
        name: form.name,
        type: form.type as PropertyDocument["type"],
        description: form.description,
        fileUrl: fileUrl,
        roomId: roomId,
        tenantId: tenantId,
        assignmentId: assignmentId,
        expiryDate: form.expiryDate || undefined,
        renewalDate: form.renewalDate || undefined,
        reminderDays: form.reminderDays,
        notes: form.notes,
        status: form.linkType === "tenant" ? "pending" : "active",
      };

      if (editingDoc) {
        // Update document
        const updated = await documentsApi.update(editingDoc.id, {
          ...payload,
          status: editingDoc.status, // Preserve existing status unless reviewed
        });
        setDocuments(
          documents.map((d) => (d.id === editingDoc.id ? updated : d)),
        );
        setEditingDoc(null);
        showSuccess("Document updated successfully.");
      } else {
        // Create document
        const created = await documentsApi.create(payload);
        setDocuments([created, ...documents]);
        setIsAdding(false);
        showSuccess("Document created successfully.");
      }
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to save document.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      setError(null);
      await documentsApi.remove(id);
      setDocuments(documents.filter((d) => d.id !== id));
      showSuccess("Document deleted successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to delete document.");
    }
  };

  const handleReviewSubmit = async (status: "approved" | "rejected") => {
    if (!reviewingDoc) return;
    try {
      setError(null);
      const updated = await documentsApi.update(reviewingDoc.id, {
        status,
        adminNotes: reviewNotes,
      });
      setDocuments(
        documents.map((d) => (d.id === reviewingDoc.id ? updated : d)),
      );
      setReviewingDoc(null);
      setReviewNotes("");
      showSuccess(`Document marked as ${status}.`);
    } catch (err: any) {
      setError(err.message || "Failed to review document.");
    }
  };

  const openEdit = (doc: PropertyDocument) => {
    setEditingDoc(doc);
    let linkType: "property" | "room" | "tenant" = "property";
    if (doc.tenantId || doc.assignmentId) {
      linkType = "tenant";
    } else if (doc.roomId) {
      linkType = "room";
    }

    setForm({
      name: doc.name,
      type: doc.type,
      description: doc.description || "",
      fileUrl: doc.fileUrl,
      linkType,
      roomId: doc.roomId ? String(doc.roomId) : "",
      tenantId: doc.tenantId ? String(doc.tenantId) : "",
      assignmentId: doc.assignmentId ? String(doc.assignmentId) : "",
      expiryDate: doc.expiryDate ? doc.expiryDate.split("T")[0] : "",
      renewalDate: doc.renewalDate ? doc.renewalDate.split("T")[0] : "",
      reminderDays: doc.reminderDays || 30,
      notes: doc.notes || "",
      adminNotes: doc.adminNotes || "",
    });
  };

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    if (activeTab === "property") {
      return !doc.roomId && !doc.tenantId;
    }
    if (activeTab === "room") {
      return !!doc.roomId && !doc.tenantId;
    }
    if (activeTab === "tenant") {
      return !!doc.tenantId;
    }
    return true;
  });

  // Calculate reminders
  const reminders = documents.filter((doc) => {
    if (!doc.expiryDate) return false;
    const days = Math.ceil(
      (new Date(doc.expiryDate).getTime() - Date.now()) / 86400000,
    );
    return (
      days > 0 && days <= (doc.reminderDays || 30) && doc.status === "active"
    );
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
      case "approved":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "expiring-soon":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "expired":
      case "rejected":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "renewed":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "pending":
        return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      default:
        return "text-white/40 bg-white/5 border-white/10";
    }
  };

  const inputCls =
    "h-10 w-full rounded-xl px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all";
  const inputStyle = {
    background: "var(--surface-3)",
    border: "1px solid var(--border-subtle)",
  };

  if (!propertyName) {
    return (
      <div
        className="rounded-2xl py-14 text-center"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border-default)",
        }}
      >
        <FileText className="w-10 h-10 text-white/10 mx-auto mb-3" />
        <p className="text-white/40 text-sm">
          Select a property to view the Document Center.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications / Errors */}
      {error && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-red-400"
          style={{
            background: "rgba(239,68,68,0.05)",
            borderColor: "rgba(239,68,68,0.15)",
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-white/40 hover:text-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-emerald-400"
          style={{
            background: "rgba(16,185,129,0.05)",
            borderColor: "rgba(16,185,129,0.15)",
          }}
        >
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Reminders section */}
      {reminders.length > 0 && (
        <div
          className="rounded-xl px-4 py-3 border space-y-2"
          style={{
            background: "rgba(245,158,11,0.04)",
            borderColor: "rgba(245,158,11,0.12)",
          }}
        >
          <div className="flex items-center gap-2 text-sm text-amber-400 font-medium">
            <Bell className="w-4 h-4" />
            <span>Expiry Reminders ({reminders.length})</span>
          </div>
          <div className="space-y-1">
            {reminders.map((doc) => (
              <p key={doc.id} className="text-xs text-white/60">
                Document{" "}
                <span className="font-semibold text-amber-300">{doc.name}</span>{" "}
                is expiring on {new Date(doc.expiryDate!).toLocaleDateString()}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Documents",
            value: documents.length,
            color: "text-white",
          },
          {
            label: "Property Level",
            value: documents.filter((d) => !d.roomId && !d.tenantId).length,
            color: "text-blue-400",
          },
          {
            label: "Room Linked",
            value: documents.filter((d) => d.roomId && !d.tenantId).length,
            color: "text-emerald-400",
          },
          {
            label: "Tenant Uploads",
            value: documents.filter((d) => d.tenantId).length,
            color: "text-purple-400",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl p-4"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border-default)",
            }}
          >
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-white/30 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.05] pb-4">
        <div
          className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl shrink-0"
          style={{ border: "1px solid var(--border-subtle)" }}
        >
          {[
            { id: "all", label: "All Docs" },
            { id: "property", label: "Property Level" },
            { id: "room", label: "Room Linked" },
            { id: "tenant", label: "Tenant Uploads" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === t.id
                  ? "bg-white text-black shadow-sm"
                  : "text-white/50 hover:text-white hover:bg-white/[0.03]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsAdding(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-black hover:bg-white/95 active:scale-95 text-sm font-medium rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Document
        </button>
      </div>

      {/* Add / Edit Form Modal */}
      {(isAdding || editingDoc) && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-white/40" />
              {editingDoc ? `Edit: ${editingDoc.name}` : "Add New Document"}
            </h3>
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingDoc(null);
                resetForm();
              }}
              className="text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-white/40 block mb-1.5">
                Document Name *
              </Label>
              <Input
                className={inputCls}
                style={inputStyle}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Building Insurance Policy"
              />
            </div>
            <div>
              <Label className="text-xs text-white/40 block mb-1.5">
                Document Type
              </Label>
              <select
                className={inputCls}
                style={{ ...inputStyle, appearance: "none" }}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Document Link Context */}
            <div>
              <Label className="text-xs text-white/40 block mb-1.5">
                Link Scope
              </Label>
              <div className="grid grid-cols-3 gap-2 bg-white/5 p-1 rounded-xl border border-white/[0.05]">
                {[
                  {
                    id: "property",
                    label: "Property",
                    icon: <Home className="w-3 h-3" />,
                  },
                  {
                    id: "room",
                    label: "Room",
                    icon: <Home className="w-3 h-3 text-emerald-400" />,
                  },
                  {
                    id: "tenant",
                    label: "Tenant",
                    icon: <User className="w-3 h-3 text-purple-400" />,
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, linkType: opt.id as any }))
                    }
                    className={`flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-medium transition-all ${
                      form.linkType === opt.id
                        ? "bg-white text-black"
                        : "text-white/55 hover:text-white"
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Context Dropdowns */}
            <div>
              {form.linkType === "room" && (
                <>
                  <Label className="text-xs text-white/40 block mb-1.5">
                    Select Room *
                  </Label>
                  <select
                    className={inputCls}
                    style={{ ...inputStyle, appearance: "none" }}
                    value={form.roomId}
                    onChange={(e) =>
                      setForm({ ...form, roomId: e.target.value })
                    }
                  >
                    <option value="">-- Choose Room --</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (${r.price}/mo)
                      </option>
                    ))}
                  </select>
                </>
              )}
              {form.linkType === "tenant" && (
                <>
                  <Label className="text-xs text-white/40 block mb-1.5">
                    Select Active Assignment *
                  </Label>
                  <select
                    className={inputCls}
                    style={{ ...inputStyle, appearance: "none" }}
                    value={form.assignmentId}
                    onChange={(e) =>
                      setForm({ ...form, assignmentId: e.target.value })
                    }
                  >
                    <option value="">-- Choose Tenant Assignment --</option>
                    {assignments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {getTenantPrimaryLabel(
                          a.tenantUsername,
                          a.tenantEmail,
                        ) || a.tenantUsername}{" "}
                        ({a.roomName})
                      </option>
                    ))}
                  </select>
                </>
              )}
              {form.linkType === "property" && (
                <div className="flex items-center gap-2 pt-6 text-xs text-white/35">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>
                    This document will apply to the entire property general
                    scope.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs text-white/40 block mb-1.5">
              Description
            </Label>
            <Textarea
              rows={2}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all resize-none"
              style={inputStyle}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Brief description of document contents..."
            />
          </div>

          {/* Upload System - Unified & Fixed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/[0.05] pt-4">
            <div>
              <Label className="text-xs text-white/40 block mb-1.5">
                File URL (Optional if uploading file)
              </Label>
              <Input
                className={inputCls}
                style={inputStyle}
                value={form.fileUrl}
                onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                placeholder="Cloud link or web address"
              />
            </div>
            <div>
              <Label className="text-xs text-white/40 block mb-1.5">
                Or Choose File from Device
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  className={inputCls}
                  style={inputStyle}
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
                {uploadFile && (
                  <button
                    type="button"
                    onClick={handleUploadFile}
                    disabled={uploading}
                    className="px-3 h-10 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white shrink-0 border border-white/10 transition-all"
                  >
                    {uploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Upload"
                    )}
                  </button>
                )}
              </div>
              <p className="text-[10px] text-white/20 mt-1">
                Uploading auto-populates the File URL.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/[0.05] pt-4">
            <div>
              <Label className="text-xs text-white/40 block mb-1.5">
                Expiry Date
              </Label>
              <Input
                type="date"
                className={inputCls}
                style={inputStyle}
                value={form.expiryDate}
                onChange={(e) =>
                  setForm({ ...form, expiryDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="text-xs text-white/40 block mb-1.5">
                Renewal Date
              </Label>
              <Input
                type="date"
                className={inputCls}
                style={inputStyle}
                value={form.renewalDate}
                onChange={(e) =>
                  setForm({ ...form, renewalDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="text-xs text-white/40 block mb-1.5">
                Reminder Window (Days)
              </Label>
              <Input
                type="number"
                min="1"
                className={inputCls}
                style={inputStyle}
                value={form.reminderDays}
                onChange={(e) =>
                  setForm({ ...form, reminderDays: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-white/40 block mb-1.5">
              Additional Notes
            </Label>
            <Textarea
              rows={2}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all resize-none"
              style={inputStyle}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Internal record keeping notes..."
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-white/[0.05]">
            <button
              onClick={handleSave}
              disabled={
                uploading || !form.name || (!form.fileUrl && !uploadFile)
              }
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-black font-semibold text-xs rounded-xl hover:bg-white/95 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Save Document
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingDoc(null);
                resetForm();
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Review Modal Dialog */}
      {reviewingDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="rounded-2xl p-6 w-full max-w-md space-y-4 border border-white/10 shadow-2xl"
            style={{ background: "var(--surface-2)" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Review Tenant Document
              </h3>
              <button
                onClick={() => {
                  setReviewingDoc(null);
                  setReviewNotes("");
                }}
                className="text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/[0.05] space-y-1 text-xs">
              <p className="text-white/40">
                Tenant:{" "}
                <span className="text-white font-medium">
                  {getTenantPrimaryLabel(
                    reviewingDoc.tenantUsername,
                    reviewingDoc.tenantEmail,
                  ) || reviewingDoc.tenantUsername}
                </span>
              </p>
              <p className="text-white/40">
                Document Name:{" "}
                <span className="text-white font-medium">
                  {reviewingDoc.name}
                </span>
              </p>
              <p className="text-white/40">
                Description:{" "}
                <span className="text-white">
                  {reviewingDoc.description || "No description provided."}
                </span>
              </p>
              <p className="pt-2">
                <a
                  href={reviewingDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline"
                >
                  Click to view/download file
                </a>
              </p>
            </div>

            <div>
              <Label className="text-xs text-white/40 block mb-1.5">
                Review Notes / Admin Notes
              </Label>
              <Textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Explain the reasons for approval or rejection. Notes will be sent to the tenant."
                className="w-full rounded-xl px-3 py-2 text-xs text-white resize-none"
                style={inputStyle}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleReviewSubmit("approved")}
                className="flex-1 py-2 bg-white text-black hover:bg-white/95 active:scale-95 font-semibold text-xs rounded-xl transition-all"
              >
                Approve
              </button>
              <button
                onClick={() => handleReviewSubmit("rejected")}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-semibold text-xs rounded-xl transition-all"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setReviewingDoc(null);
                  setReviewNotes("");
                }}
                className="px-4 py-2 rounded-xl text-xs text-white/50 hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main List */}
      {loading ? (
        <div className="text-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-white/20 mx-auto" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div
          className="rounded-2xl py-14 text-center"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border-default)",
          }}
        >
          <FileText className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-white/40 text-sm">
            No documents found matching this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocs.map((doc) => {
            const hasExpiry = !!doc.expiryDate;
            const daysLeft = hasExpiry
              ? Math.ceil(
                  (new Date(doc.expiryDate!).getTime() - Date.now()) / 86400000,
                )
              : 0;
            const scopeLabel = doc.tenantId
              ? "Tenant Upload"
              : doc.roomId
                ? "Room Linked"
                : "Property Level";

            return (
              <div
                key={doc.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl transition-all"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="p-2.5 rounded-xl flex-shrink-0"
                    style={{ background: "var(--surface-3)" }}
                  >
                    {doc.tenantId ? (
                      <User className="w-4 h-4 text-purple-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-white/40" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {doc.name}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusStyle(doc.status)}`}
                      >
                        {doc.status}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-white/5 border border-white/10 text-white/40">
                        {scopeLabel}
                      </span>
                    </div>

                    <p className="text-xs text-white/30 flex flex-wrap gap-x-2">
                      <span>
                        Type:{" "}
                        <strong className="text-white/50 font-normal">
                          {DOC_TYPES.find((t) => t.value === doc.type)?.label ||
                            doc.type}
                        </strong>
                      </span>
                      {doc.uploadDate && (
                        <span>
                          Uploaded:{" "}
                          <strong className="text-white/50 font-normal">
                            {new Date(doc.uploadDate).toLocaleDateString()}
                          </strong>
                        </span>
                      )}
                      {hasExpiry && (
                        <span
                          className={
                            daysLeft <= 0
                              ? "text-red-400"
                              : daysLeft <= 30
                                ? "text-amber-400"
                                : ""
                          }
                        >
                          Expires:{" "}
                          {new Date(doc.expiryDate!).toLocaleDateString()}
                        </span>
                      )}
                    </p>

                    {doc.description && (
                      <p className="text-xs text-white/20 mt-1 max-w-xl line-clamp-1">
                        {doc.description}
                      </p>
                    )}

                    {/* Extra contexts */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-white/30">
                      {doc.roomId && (
                        <span>
                          Room ID:{" "}
                          <strong className="text-white/40 font-normal">
                            {doc.roomId}
                          </strong>
                        </span>
                      )}
                      {doc.tenantUsername && (
                        <span>
                          Tenant:{" "}
                          <strong className="text-white/40 font-normal">
                            {getTenantPrimaryLabel(
                              doc.tenantUsername,
                              doc.tenantEmail,
                            ) || doc.tenantUsername}
                          </strong>
                        </span>
                      )}
                      {doc.uploadedBy && (
                        <span>
                          Uploaded By:{" "}
                          <strong className="text-white/40 font-normal">
                            {doc.uploadedBy}
                          </strong>
                        </span>
                      )}
                    </div>

                    {doc.adminNotes && (
                      <p className="text-xs text-purple-400/70 mt-1">
                        Review Notes: {doc.adminNotes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 self-end sm:self-center shrink-0">
                  {doc.status === "pending" && (
                    <button
                      onClick={() => {
                        setReviewingDoc(doc);
                        setReviewNotes(doc.adminNotes || "");
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-white text-black hover:bg-white/95 active:scale-95 rounded-lg transition-all"
                    >
                      Review
                    </button>
                  )}
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                    title="View/Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => openEdit(doc)}
                    className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentCenter;
