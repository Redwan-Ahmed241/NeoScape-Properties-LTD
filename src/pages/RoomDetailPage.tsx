"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Building2, ChevronRight, Upload, Save, Image as ImageIcon,
  DoorOpen, Loader2, AlertCircle, CheckCircle, FileText, DollarSign,
  User, ToggleLeft, ToggleRight, Trash2, Plus, X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { roomsApi, uploadApi, rentSchedulesApi, documentsApi } from "../lib/api";
import { formatPrice, formatDate } from "../lib/utils";
import type { Room } from "../lib/types";
import type { RentSchedule, PropertyDocument } from "../lib/documentTypes";

const RoomDetailPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Edit state — full fields
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrice, setEditPrice] = useState(0);
  const [editBedrooms, setEditBedrooms] = useState(1);
  const [editBathrooms, setEditBathrooms] = useState(1);
  const [editSize, setEditSize] = useState(0);
  const [editAmenities, setEditAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState("");

  // Rent state
  const [schedules, setSchedules] = useState<RentSchedule[]>([]);
  const [loadingRent, setLoadingRent] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const fetchRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      setIsLoading(true);
      const response = await roomsApi.getRoom(roomId);
      const r: Room = response.data || response;
      setRoom(r);
      setEditName(r.name);
      setEditDesc(r.description || "");
      setEditPrice(r.price);
      setEditBedrooms(r.bedrooms ?? 1);
      setEditBathrooms(r.bathrooms ?? 1);
      setEditSize(r.size ?? 0);
      setEditAmenities(r.amenities ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch room");
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  const fetchRentSchedules = useCallback(async () => {
    try {
      setLoadingRent(true);
      const all = await rentSchedulesApi.list();
      const filtered = room ? all.filter((s) => s.roomName === room.name) : all;
      setSchedules(filtered);
    } catch { /* silently fail */ }
    finally { setLoadingRent(false); }
  }, [room]);

  const fetchDocuments = useCallback(async () => {
    if (!roomId) return;
    try {
      setLoadingDocs(true);
      const docs = await documentsApi.list(roomId);
      setDocuments(docs);
    } catch { /* silently fail */ }
    finally { setLoadingDocs(false); }
  }, [roomId]);

  useEffect(() => { fetchRoom(); }, [fetchRoom]);
  useEffect(() => { if (room) { fetchRentSchedules(); fetchDocuments(); } }, [room, fetchRentSchedules, fetchDocuments]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  // ── Save all room edits ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (!roomId || !room) return;
    try {
      setIsSaving(true);
      setError(null);
      await roomsApi.updateRoom(roomId, {
        name: editName,
        description: editDesc,
        price: editPrice,
        bedrooms: editBedrooms,
        bathrooms: editBathrooms,
        size: editSize,
        amenities: editAmenities,
      });
      await fetchRoom();
      showSuccess("Room updated successfully");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update room");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Toggle availability ──────────────────────────────────────────────────
  const handleToggleAvailability = async () => {
    if (!roomId || !room) return;
    try {
      setError(null);
      await roomsApi.updateRoom(roomId, { available: !room.available });
      await fetchRoom();
      showSuccess(room.available ? "Room marked as occupied" : "Room marked as to-let");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  // ── Amenities ────────────────────────────────────────────────────────────
  const handleAddAmenity = () => {
    const trimmed = newAmenity.trim();
    if (!trimmed || editAmenities.includes(trimmed)) return;
    setEditAmenities([...editAmenities, trimmed]);
    setNewAmenity("");
  };

  const handleRemoveAmenity = (item: string) => {
    setEditAmenities(editAmenities.filter((a) => a !== item));
  };

  // ── Image upload ─────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !roomId || !room) return;
    try {
      setUploadingImage(true);
      setError(null);
      const result = await uploadApi.uploadImages(e.target.files);
      const urls: string[] = result?.data?.urls || [];
      if (urls.length > 0) {
        await roomsApi.updateRoom(roomId, { images: [...(room.images || []), ...urls] });
        await fetchRoom();
        showSuccess("Image uploaded successfully");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  // ── Image delete ─────────────────────────────────────────────────────────
  const handleDeleteImage = async (url: string) => {
    if (!roomId || !room) return;
    if (!confirm("Remove this image?")) return;
    try {
      setError(null);
      const updated = (room.images || []).filter((img) => img !== url);
      await roomsApi.updateRoom(roomId, { images: updated });
      await fetchRoom();
      showSuccess("Image removed");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove image");
    }
  };

  // ── Document upload ──────────────────────────────────────────────────────
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !roomId) return;
    try {
      setUploadingDoc(true);
      setError(null);
      const file = e.target.files[0];
      const url = await documentsApi.upload(file);
      await documentsApi.create({
        name: file.name,
        type: "other",
        description: "",
        fileUrl: url,
        propertyId: roomId,
        status: "active",
      });
      await fetchDocuments();
      showSuccess("Document uploaded successfully");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setUploadingDoc(false);
      e.target.value = "";
    }
  };

  // ── Document delete ──────────────────────────────────────────────────────
  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      setDeletingDocId(id);
      await documentsApi.remove(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      showSuccess("Document deleted");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setDeletingDocId(null);
    }
  };

  // ── Record payment ───────────────────────────────────────────────────────
  const handleRecordPayment = async (scheduleId: string, amount: number) => {
    try {
      setError(null);
      const today = new Date().toISOString().split("T")[0];
      await rentSchedulesApi.recordPayment(scheduleId, {
        dueDate: today, paidDate: today,
        amount, paidAmount: amount,
        status: "paid", paymentMethod: "cash", notes: "",
      });
      await fetchRentSchedules();
      showSuccess("Payment recorded");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
    }
  };

  // ── Loading / not-found guards ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-white/30 mx-auto" />
          <p className="text-white/30 text-sm">Loading room details…</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-10 h-10 text-white/20 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-white/60">Room not found</h2>
        <button onClick={() => navigate("/admin")} className="mt-4 px-4 py-2 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors" style={{ border: "1px solid var(--border-subtle)" }}>
          Back to Properties
        </button>
      </div>
    );
  }

  // Rent summary
  const activeSchedule = schedules.find((s) => s.status === "active");
  const lastPayment = activeSchedule?.paymentHistory?.[0];
  const monthlyDue = activeSchedule?.monthlyRent || 0;
  const totalPaid = activeSchedule?.paymentHistory
    ?.filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (p.paidAmount || p.amount), 0) || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div
        className="rounded-2xl p-6 sm:p-8"
        style={{
          background: "rgba(8,8,8,0.65)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-white/30 mb-6 flex-wrap">
          <button onClick={() => navigate("/admin")} className="flex items-center gap-1 hover:text-white/60 transition-colors">
            <Building2 className="w-3 h-3" /> Properties
          </button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => navigate(`/admin/villa/${encodeURIComponent(room.location)}`)} className="hover:text-white/60 transition-colors">
            {room.location}
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white/60 truncate">{room.name}</span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(`/admin/villa/${encodeURIComponent(room.location)}`)} className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white tracking-tight">{room.name}</h1>
            <p className="text-white/30 text-sm">{room.location}</p>
          </div>
          <button
            onClick={handleToggleAvailability}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${room.available
              ? "text-emerald-300 hover:bg-emerald-500/10"
              : "text-amber-300 hover:bg-amber-500/10"
              }`}
            style={{ border: `1px solid ${room.available ? "rgba(52,211,153,0.2)" : "rgba(251,191,36,0.2)"}` }}
          >
            {room.available ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            {room.available ? "To-let" : "Occupied"}
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-red-400" style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.15)" }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-400/50 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-emerald-400" style={{ background: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.15)" }}>
            <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="bg-transparent border-b border-white/[0.07] rounded-none p-0 h-auto gap-0 w-full justify-start">
            <TabsTrigger value="details" className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/40 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white data-[state=active]:bg-transparent transition-all"><DoorOpen className="w-4 h-4" /> Details</TabsTrigger>
            <TabsTrigger value="rent" className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/40 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white data-[state=active]:bg-transparent transition-all"><DollarSign className="w-4 h-4" /> Rent</TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/40 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white data-[state=active]:bg-transparent transition-all"><FileText className="w-4 h-4" /> Documents</TabsTrigger>
          </TabsList>

          {/* ── Details Tab ── */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Images */}
              <div className="rounded-2xl p-5 space-y-3 ds-card">
                <p className="text-sm font-medium text-white/60 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Images
                </p>
                <div className="relative aspect-video rounded-xl overflow-hidden" style={{ background: "var(--surface-3)" }}>
                  {room.images?.[0] ? (
                    <>
                      <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover" />
                      <button onClick={() => handleDeleteImage(room.images[0])} className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-lg text-white transition-colors" aria-label="Remove primary image">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
                      <ImageIcon className="w-10 h-10 mb-2" />
                      <span className="text-sm">No image uploaded</span>
                    </div>
                  )}
                </div>
                {room.images && room.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {room.images.slice(1).map((img, i) => (
                      <div key={i} className="relative flex-shrink-0">
                        <img src={img} alt={`${room.name} ${i + 2}`} className="w-16 h-16 rounded-lg object-cover" style={{ border: "1px solid var(--border-subtle)" }} />
                        <button onClick={() => handleDeleteImage(img)} className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors" aria-label="Remove image">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  <div className={`flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed rounded-xl text-sm font-medium transition-all ${uploadingImage ? "border-white/10 text-white/20" : "border-white/15 text-white/40 hover:border-white/30 hover:text-white/60"}`}>
                    {uploadingImage ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload Images</>}
                  </div>
                </label>
              </div>

              {/* Room Info */}
              <div className="rounded-2xl p-5 space-y-4 ds-card">
                <p className="text-sm font-medium text-white/60 flex items-center gap-2">
                  <DoorOpen className="w-4 h-4" /> Room Information
                </p>
                {[
                  { id: "edit-name", label: "Room Name", type: "text", value: editName, setter: setEditName },
                  { id: "edit-price", label: "Monthly Rent (£)", type: "number", value: editPrice, setter: (v: string) => setEditPrice(Number(v)) },
                ].map(({ id, label, type, value, setter }) => (
                  <div key={id}>
                    <label htmlFor={id} className="text-xs font-medium text-white/40 mb-1.5 block">{label}</label>
                    <input id={id} type={type} min={type === "number" ? "0" : undefined} value={value}
                      onChange={(e) => setter(e.target.value)}
                      className="h-10 w-full rounded-xl px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                      style={{ background: "var(--surface-3)", border: "1px solid var(--border-subtle)" }} />
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "edit-bed", label: "Bedrooms", value: editBedrooms, setter: setEditBedrooms },
                    { id: "edit-bath", label: "Bathrooms", value: editBathrooms, setter: setEditBathrooms },
                    { id: "edit-size", label: "Size (m²)", value: editSize, setter: setEditSize },
                  ].map(({ id, label, value, setter }) => (
                    <div key={id}>
                      <label htmlFor={id} className="text-xs font-medium text-white/40 mb-1.5 block">{label}</label>
                      <input id={id} type="number" min="0" value={value} onChange={(e) => setter(Number(e.target.value))}
                        className="h-10 w-full rounded-xl px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                        style={{ background: "var(--surface-3)", border: "1px solid var(--border-subtle)" }} />
                    </div>
                  ))}
                </div>
                <div>
                  <label htmlFor="edit-desc" className="text-xs font-medium text-white/40 mb-1.5 block">Description</label>
                  <textarea id="edit-desc" rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none"
                    style={{ background: "var(--surface-3)", border: "1px solid var(--border-subtle)" }} />
                </div>
                <button onClick={handleSave} disabled={isSaving}
                  className="w-full h-10 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                  {isSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
                </button>
              </div>
            </div>

            {/* Amenities */}
            <div className="rounded-2xl p-5 space-y-4 ds-card">
              <p className="text-sm font-medium text-white/60 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Amenities
              </p>
              <div className="flex gap-2">
                <input
                  placeholder="e.g. WiFi, Parking, Garden…"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddAmenity(); } }}
                  className="flex-1 h-10 rounded-xl px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  style={{ background: "var(--surface-3)", border: "1px solid var(--border-subtle)" }}
                />
                <button onClick={handleAddAmenity} disabled={!newAmenity.trim()}
                  className="px-4 h-10 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all"
                  style={{ border: "1px solid var(--border-subtle)" }}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {editAmenities.length === 0 ? (
                <p className="text-sm text-white/20">No amenities added yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {editAmenities.map((a) => (
                    <span key={a} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm text-white/60" style={{ background: "var(--surface-3)", border: "1px solid var(--border-subtle)" }}>
                      {a}
                      <button onClick={() => handleRemoveAmenity(a)} className="text-white/30 hover:text-red-400 transition-colors" aria-label={`Remove ${a}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-white/20">Saved with "Save Changes" above.</p>
            </div>
          </TabsContent>

          {/* ── Rent Tab ── */}
          <TabsContent value="rent" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Due Amount", value: formatPrice(monthlyDue), sub: "per month", accent: "rgba(99,102,241,0.15)", color: "text-white" },
                { label: "Total Paid", value: formatPrice(totalPaid), sub: "all time", accent: "rgba(16,185,129,0.15)", color: "text-emerald-400" },
                { label: "Last Payment", value: lastPayment?.paidDate ? formatDate(lastPayment.paidDate) : "—", sub: "date", accent: "rgba(139,92,246,0.15)", color: "text-white" },
                { label: "Tenant", value: activeSchedule?.tenantName || "—", sub: "active tenant", accent: "rgba(245,158,11,0.15)", color: "text-white" },
              ].map(({ label, value, sub, accent, color }) => (
                <div key={label} className="rounded-2xl p-4 ds-card" style={{ borderLeft: `3px solid ${accent.replace("0.15", "0.5")}` }}>
                  <p className="text-xs font-medium text-white/30 uppercase tracking-wider">{label}</p>
                  <p className={`text-xl font-semibold mt-1 truncate ${color}`}>{value}</p>
                  <p className="text-xs text-white/20 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {loadingRent ? (
              <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-white/20 mx-auto" /></div>
            ) : schedules.length === 0 ? (
              <div className="rounded-2xl py-14 text-center ds-card">
                <DollarSign className="w-8 h-8 text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">No rent schedules for this room.</p>
                <p className="text-white/20 text-xs mt-1">Create one from Management → Rent Collection.</p>
                <button onClick={() => navigate("/admin/management")} className="mt-4 px-4 py-2 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors" style={{ border: "1px solid var(--border-subtle)" }}>
                  Go to Management
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="rounded-2xl p-5 ds-card">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-white/30" />
                        <span className="font-medium text-white">{schedule.tenantName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${schedule.status === "active" ? "text-emerald-400" : "text-white/30"}`} style={{ background: schedule.status === "active" ? "rgba(16,185,129,0.1)" : "var(--surface-3)" }}>
                          {schedule.status}
                        </span>
                      </div>
                      <span className="text-base font-semibold text-white">{formatPrice(schedule.monthlyRent)}/mo</span>
                    </div>
                    <p className="text-xs text-white/30 mb-4">Due day: {schedule.dueDay} · Since: {formatDate(schedule.startDate)}</p>
                    {schedule.paymentHistory.length > 0 && (
                      <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid var(--border-subtle)" }}>
                        <table className="w-full text-sm">
                          <thead style={{ background: "var(--surface-3)" }}>
                            <tr>
                              {["Date", "Amount", "Status"].map((h) => (
                                <th key={h} className="text-left px-3 py-2 text-xs font-medium text-white/30">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {schedule.paymentHistory.slice(0, 5).map((p) => (
                              <tr key={p.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                                <td className="px-3 py-2 text-white/60 text-xs">{p.paidDate ? formatDate(p.paidDate) : formatDate(p.dueDate)}</td>
                                <td className="px-3 py-2 font-medium text-white text-xs">{formatPrice(p.paidAmount || p.amount)}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === "paid" ? "text-emerald-400" : "text-amber-400"}`} style={{ background: p.status === "paid" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)" }}>
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {schedule.status === "active" && (
                      <button onClick={() => handleRecordPayment(schedule.id, schedule.monthlyRent)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                        style={{ border: "1px solid var(--border-subtle)" }}>
                        <DollarSign className="w-3.5 h-3.5" /> Record Payment
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Documents Tab ── */}
          <TabsContent value="documents" className="space-y-4">
            <label className="cursor-pointer block">
              <input type="file" className="hidden" onChange={handleDocUpload} disabled={uploadingDoc} accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp" />
              <div className={`flex items-center justify-center gap-2 px-4 py-5 border border-dashed rounded-2xl text-sm font-medium transition-all ${uploadingDoc ? "border-white/10 text-white/20" : "border-white/15 text-white/40 hover:border-white/30 hover:text-white/60"}`}>
                {uploadingDoc ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading document…</> : <><Upload className="w-4 h-4" /> Upload Document (PDF, DOC, XLS, Images)</>}
              </div>
            </label>

            {loadingDocs ? (
              <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-white/20 mx-auto" /></div>
            ) : documents.length === 0 ? (
              <div className="rounded-2xl py-14 text-center ds-card">
                <FileText className="w-8 h-8 text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">No documents uploaded for this room.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-4 p-4 rounded-2xl ds-card ds-card-hover transition-all">
                    <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: "var(--surface-3)" }}>
                      <FileText className="w-4 h-4 text-white/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">{doc.name}</h4>
                      <p className="text-xs text-white/30 mt-0.5">
                        Uploaded {formatDate(doc.uploadDate)} · <span className="capitalize">{doc.type}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-white/40 hover:text-white font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
                        View
                      </a>
                      <button onClick={() => handleDeleteDoc(doc.id)} disabled={deletingDocId === doc.id}
                        className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30" aria-label="Delete document">
                        {deletingDocId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RoomDetailPage;
