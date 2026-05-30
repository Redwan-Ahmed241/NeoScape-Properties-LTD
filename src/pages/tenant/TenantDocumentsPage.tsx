"use client";

import { useState, useEffect } from "react";
import { FileText, Upload, CheckCircle, Clock, XCircle, Plus, X } from "lucide-react";
import { tenantDocumentApi } from "../../lib/tenantApi";
import type { TenantDocumentItem } from "../../lib/tenantApi";

const DOC_TYPES = [
  { value: "id", label: "ID Document" },
  { value: "proof_of_address", label: "Proof of Address" },
  { value: "contract", label: "Tenancy Contract" },
  { value: "reference", label: "Reference Letter" },
  { value: "other", label: "Other" },
];

export default function TenantDocumentsPage() {
  const [documents, setDocuments] = useState<TenantDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", type: "other", description: "" });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const data = await tenantDocumentApi.list();
      setDocuments(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!file || !form.name) {
      setError("Please provide a document name and select a file.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const url = await tenantDocumentApi.upload(file);
      await tenantDocumentApi.create({
        name: form.name,
        type: form.type,
        description: form.description,
        file_url: url,
      });
      setShowForm(false);
      setForm({ name: "", type: "other", description: "" });
      setFile(null);
      loadDocuments();
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    }
    setUploading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this document?")) return;
    try {
      await tenantDocumentApi.remove(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch { /* ignore */ }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "rejected": return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-amber-400" />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "approved": return "text-emerald-400 bg-emerald-500/10";
      case "rejected": return "text-red-400 bg-red-500/10";
      default: return "text-amber-400 bg-amber-500/10";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white/40 mx-auto" />
          <p className="text-sm text-white/40">Loading documents…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">My Documents</h1>
          <p className="text-white/40 text-sm mt-1">Upload and manage your tenancy documents.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Upload New Document</h3>
            <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white/60"><X className="w-4 h-4" /></button>
          </div>

          {error && (
            <div className="rounded-lg p-3 text-xs text-red-300" style={{ background: "rgba(239,68,68,0.08)" }}>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/40 block mb-1.5">Document Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Passport Scan"
                className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/20"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)" }}
              />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1.5">Type</label>
              <select
                value={form.type}
                onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm text-white"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)" }}
              >
                {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-white/40 block mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description (optional)"
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/20 resize-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)" }}
            />
          </div>

          <div>
            <label className="text-xs text-white/40 block mb-1.5">File *</label>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-white/[0.02] transition-colors"
              style={{ borderColor: "var(--border-subtle)" }}
              onClick={() => document.getElementById("tenant-doc-upload")?.click()}
            >
              <Upload className="w-6 h-6 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/40">{file ? file.name : "Click to select or drag a file"}</p>
              <input
                id="tenant-doc-upload"
                type="file"
                className="hidden"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 active:scale-[0.98]"
            >
              {uploading ? "Uploading…" : "Upload & Save"}
            </button>
            <button
              onClick={() => { setShowForm(false); setError(null); }}
              className="px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}>
          <FileText className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <h3 className="text-base font-medium text-white/60">No Documents</h3>
          <p className="text-sm text-white/30 mt-1">Upload your first tenancy document to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-white/30" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                  <p className="text-xs text-white/30 mt-0.5">
                    {DOC_TYPES.find(t => t.value === doc.type)?.label || doc.type}
                    {" · "}
                    {new Date(doc.uploaded_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  {doc.admin_notes && doc.status === "rejected" && (
                    <p className="text-xs text-red-400/60 mt-1">Admin: {doc.admin_notes}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(doc.status)}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusStyle(doc.status)}`}>
                    {doc.status === "pending" ? "Pending Review" : doc.status}
                  </span>
                </div>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-white/30 hover:text-white transition-colors px-2 py-1 rounded"
                >
                  View
                </a>
                {doc.status !== "approved" && (
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-xs text-red-400/60 hover:text-red-400 transition-colors px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
