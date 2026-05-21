"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Trash2,
  Download,
  Edit,
  Plus,
  X,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle,
  Bell,
} from "lucide-react";
import { propertyLevelDocsApi } from "../lib/api";
import type { PropertyLevelDocumentRecord } from "../lib/api";

interface Props {
  propertyName: string;
}

const DOC_TYPES = [
  { value: "license", label: "License" },
  { value: "permit", label: "Permit" },
  { value: "insurance", label: "Insurance" },
  { value: "contract", label: "Contract" },
  { value: "certificate", label: "Certificate" },
  { value: "other", label: "Other" },
];

const PropertyDocumentManager: React.FC<Props> = ({ propertyName }) => {
  const [documents, setDocuments] = useState<PropertyLevelDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingDoc, setEditingDoc] = useState<PropertyLevelDocumentRecord | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: "",
    type: "other",
    description: "",
    file_url: "",
    expiry_date: "",
    renewal_date: "",
    reminder_days: 30,
    notes: "",
  });

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const resetForm = () => {
    setForm({ name: "", type: "other", description: "", file_url: "", expiry_date: "", renewal_date: "", reminder_days: 30, notes: "" });
    setUploadFile(null);
  };

  const fetchDocuments = useCallback(async () => {
    if (!propertyName) return;
    try {
      setLoading(true);
      setError(null);
      const data = await propertyLevelDocsApi.list(propertyName);
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || "Failed to load property documents");
    } finally {
      setLoading(false);
    }
  }, [propertyName]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUploadFile = async () => {
    if (!uploadFile) return;
    try {
      setUploading(true);
      setError(null);
      const url = await propertyLevelDocsApi.upload(uploadFile);
      setForm((prev) => ({ ...prev, file_url: url }));
      showSuccess("File uploaded — fill in details and save.");
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.name || !form.file_url) return;
    try {
      setError(null);
      const doc = await propertyLevelDocsApi.create({
        property_name: propertyName,
        name: form.name,
        type: form.type,
        description: form.description,
        file_url: form.file_url,
        expiry_date: form.expiry_date || null,
        renewal_date: form.renewal_date || null,
        status: "active",
        reminder_days: form.reminder_days,
        notes: form.notes,
      });
      setDocuments([doc, ...documents]);
      resetForm();
      setIsAdding(false);
      showSuccess("Document added");
    } catch (err: any) {
      setError(err.message || "Failed to create document");
    }
  };

  const handleUpdate = async () => {
    if (!editingDoc) return;
    try {
      setError(null);
      const updated = await propertyLevelDocsApi.update(editingDoc.id, editingDoc);
      setDocuments(documents.map((d) => (d.id === editingDoc.id ? updated : d)));
      setEditingDoc(null);
      showSuccess("Document updated");
    } catch (err: any) {
      setError(err.message || "Failed to update document");
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Delete this property document?")) return;
    try {
      await propertyLevelDocsApi.remove(id);
      setDocuments(documents.filter((d) => d.id !== id));
      showSuccess("Document deleted");
    } catch (err: any) {
      setError(err.message || "Failed to delete document");
    }
  };

  // Compute reminders
  const reminders = documents.filter((doc) => {
    if (!doc.expiry_date) return false;
    const days = Math.ceil((new Date(doc.expiry_date).getTime() - Date.now()) / 86400000);
    return days > 0 && days <= (doc.reminder_days || 30);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-emerald-400";
      case "expiring-soon": return "text-amber-400";
      case "expired": return "text-red-400";
      case "renewed": return "text-blue-400";
      default: return "text-white/40";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "active": return "rgba(16,185,129,0.1)";
      case "expiring-soon": return "rgba(245,158,11,0.1)";
      case "expired": return "rgba(239,68,68,0.1)";
      case "renewed": return "rgba(59,130,246,0.1)";
      default: return "var(--surface-3)";
    }
  };

  const inputCls = "h-10 w-full rounded-xl px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all";
  const inputStyle = { background: "var(--surface-3)", border: "1px solid var(--border-subtle)" };

  if (!propertyName) {
    return (
      <div className="rounded-2xl py-14 text-center" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
        <FileText className="w-8 h-8 text-white/10 mx-auto mb-3" />
        <p className="text-white/30 text-sm">Select a property to manage documents.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-red-400" style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.15)" }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-emerald-400" style={{ background: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.15)" }}>
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}

      {/* Reminders */}
      {reminders.length > 0 && (
        <div className="rounded-xl px-4 py-3 border" style={{ background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.15)" }}>
          <div className="flex items-center gap-2 text-sm text-amber-400 font-medium mb-2">
            <Bell className="w-4 h-4" /> Expiry Reminders ({reminders.length})
          </div>
          <div className="space-y-1">
            {reminders.map((doc) => (
              <p key={String(doc.id)} className="text-xs text-amber-300/70">
                <span className="font-medium text-amber-300">{doc.name}</span> expires {new Date(doc.expiry_date!).toLocaleDateString()}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: documents.length, color: "text-white" },
          { label: "Active", value: documents.filter((d) => d.status === "active").length, color: "text-emerald-400" },
          { label: "Expiring", value: documents.filter((d) => d.status === "expiring-soon").length, color: "text-amber-400" },
          { label: "Expired", value: documents.filter((d) => d.status === "expired").length, color: "text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-white/30">{label}</p>
          </div>
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={() => setIsAdding(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 active:scale-[0.98] transition-all"
      >
        <Plus className="w-4 h-4" /> Add Document
      </button>

      {/* Add / Edit Form */}
      {(isAdding || editingDoc) && (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-white/40" /> {editingDoc ? "Edit Document" : "Add Property Document"}
            </h3>
            <button onClick={() => { setIsAdding(false); setEditingDoc(null); resetForm(); }} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-white/40 mb-1.5 block">Document Name *</label>
              <input
                className={inputCls} style={inputStyle}
                value={editingDoc ? editingDoc.name : form.name}
                onChange={(e) => editingDoc ? setEditingDoc({ ...editingDoc, name: e.target.value }) : setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Business License 2026"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-white/40 mb-1.5 block">Type</label>
              <select
                className={inputCls} style={{ ...inputStyle, appearance: "none" as const }}
                value={editingDoc ? editingDoc.type : form.type}
                onChange={(e) => editingDoc ? setEditingDoc({ ...editingDoc, type: e.target.value }) : setForm({ ...form, type: e.target.value })}
              >
                {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-white/40 mb-1.5 block">Description</label>
            <textarea
              rows={2}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none"
              style={inputStyle}
              value={editingDoc ? editingDoc.description : form.description}
              onChange={(e) => editingDoc ? setEditingDoc({ ...editingDoc, description: e.target.value }) : setForm({ ...form, description: e.target.value })}
              placeholder="Brief description"
            />
          </div>

          {!editingDoc && (
            <>
              <div>
                <label className="text-xs font-medium text-white/40 mb-1.5 block">File URL *</label>
                <input
                  className={inputCls} style={inputStyle}
                  value={form.file_url}
                  onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                  placeholder="URL to document or upload below"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 mb-1.5 block">Or Upload File</label>
                <div className="flex items-center gap-2">
                  <input type="file" className={inputCls} style={inputStyle} onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                  <button
                    onClick={handleUploadFile}
                    disabled={!uploadFile || uploading}
                    className="px-4 h-10 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all whitespace-nowrap"
                    style={{ border: "1px solid var(--border-subtle)" }}
                  >
                    {uploading ? "Uploading…" : "Upload"}
                  </button>
                </div>
                <p className="text-xs text-white/20 mt-1">Upload will set the File URL automatically.</p>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-white/40 mb-1.5 block">Expiry Date</label>
              <input
                type="date" className={inputCls} style={inputStyle}
                value={editingDoc ? (editingDoc.expiry_date || "") : form.expiry_date}
                onChange={(e) => editingDoc ? setEditingDoc({ ...editingDoc, expiry_date: e.target.value }) : setForm({ ...form, expiry_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-white/40 mb-1.5 block">Renewal Date</label>
              <input
                type="date" className={inputCls} style={inputStyle}
                value={editingDoc ? (editingDoc.renewal_date || "") : form.renewal_date}
                onChange={(e) => editingDoc ? setEditingDoc({ ...editingDoc, renewal_date: e.target.value }) : setForm({ ...form, renewal_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-white/40 mb-1.5 block">Reminder (days)</label>
              <input
                type="number" min="1" className={inputCls} style={inputStyle}
                value={editingDoc ? (editingDoc.reminder_days || 30) : form.reminder_days}
                onChange={(e) => editingDoc ? setEditingDoc({ ...editingDoc, reminder_days: Number(e.target.value) }) : setForm({ ...form, reminder_days: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-white/40 mb-1.5 block">Notes</label>
            <textarea
              rows={2}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none"
              style={inputStyle}
              value={editingDoc ? (editingDoc.notes || "") : form.notes}
              onChange={(e) => editingDoc ? setEditingDoc({ ...editingDoc, notes: e.target.value }) : setForm({ ...form, notes: e.target.value })}
              placeholder="Additional notes"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={editingDoc ? handleUpdate : handleAdd}
              disabled={editingDoc ? !editingDoc.name : (!form.name || !form.file_url)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Check className="w-3.5 h-3.5" /> {editingDoc ? "Update" : "Save"} Document
            </button>
            <button
              onClick={() => { setIsAdding(false); setEditingDoc(null); resetForm(); }}
              className="px-4 py-2 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Documents List */}
      {loading ? (
        <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin text-white/20 mx-auto" /></div>
      ) : documents.length === 0 ? (
        <div className="rounded-2xl py-14 text-center" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
          <FileText className="w-8 h-8 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">No property documents yet.</p>
          <p className="text-white/20 text-xs mt-1">Add documents like licenses, permits, and contracts.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={String(doc.id)} className="flex items-center gap-4 p-4 rounded-2xl transition-all" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
              <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: "var(--surface-3)" }}>
                <FileText className="w-4 h-4 text-white/40" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-sm font-medium text-white truncate">{doc.name}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`} style={{ background: getStatusBg(doc.status) }}>
                    {doc.status.replace("-", " ")}
                  </span>
                </div>
                <p className="text-xs text-white/30">
                  {doc.type} · Uploaded {new Date(doc.upload_date).toLocaleDateString()}
                  {doc.expiry_date && ` · Expires ${new Date(doc.expiry_date).toLocaleDateString()}`}
                </p>
                {doc.description && <p className="text-xs text-white/20 mt-0.5 truncate">{doc.description}</p>}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-white/20 hover:text-white hover:bg-white/5 transition-colors" title="View/Download">
                  <Download className="w-4 h-4" />
                </a>
                <button onClick={() => setEditingDoc(doc)} className="p-1.5 rounded-lg text-white/20 hover:text-white hover:bg-white/5 transition-colors" title="Edit">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(doc.id)} className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyDocumentManager;
