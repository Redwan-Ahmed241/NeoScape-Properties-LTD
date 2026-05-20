"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Trash2, ChevronRight, ArrowLeft, Save, X, DoorOpen, Loader2, AlertCircle, Building2 } from "lucide-react";
import { roomsApi } from "../lib/api";
import { formatPrice } from "../lib/utils";
import type { Room } from "../lib/types";

const VillaRoomsPage: React.FC = () => {
  const { villaName } = useParams<{ villaName: string }>();
  const decodedVillaName = decodeURIComponent(villaName || "");
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newRoom, setNewRoom] = useState<Partial<Room>>({
    name: "", type: "villa", price: 0, rating: 0, reviews: 0,
    images: [], amenities: [], description: "",
    location: decodedVillaName, maxGuests: 1, bedrooms: 1, bathrooms: 1, size: 30, available: true,
  });

  useEffect(() => { fetchRooms(); }, [decodedVillaName]);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await roomsApi.getRooms({ location: decodedVillaName });
      const allRooms: Room[] = response.data || response;
      setRooms(allRooms.filter((r) => r.location === decodedVillaName));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch rooms");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoom.name) return;
    try {
      setIsSaving(true);
      setError(null);
      await roomsApi.createRoom({
        name: newRoom.name, type: newRoom.type || "villa", price: newRoom.price || 0,
        rating: 0, reviews: 0, images: [], amenities: newRoom.amenities || [],
        description: newRoom.description || "", location: decodedVillaName,
        maxGuests: newRoom.maxGuests || 1, bedrooms: newRoom.bedrooms || 1,
        bathrooms: newRoom.bathrooms || 1, size: newRoom.size || 30, available: newRoom.available ?? true,
      });
      await fetchRooms();
      setNewRoom({ name: "", type: "villa", price: 0, description: "", location: decodedVillaName, maxGuests: 1, bedrooms: 1, bathrooms: 1, size: 30, available: true, amenities: [], images: [] });
      setIsAddingRoom(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRoom = async (id: number | string) => {
    if (!confirm("Delete this room?")) return;
    try {
      await roomsApi.deleteRoom(String(id));
      await fetchRooms();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete room");
    }
  };

  const inputCls = "h-10 w-full rounded-xl px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all";
  const inputStyle = { background: "var(--surface-3)", border: "1px solid var(--border-subtle)" };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-white/30 mx-auto" />
          <p className="text-white/30 text-sm">Loading rooms…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(8,8,8,0.65)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.07)" }}>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-white/30 mb-6">
          <button onClick={() => navigate("/admin")} className="flex items-center gap-1 hover:text-white/60 transition-colors">
            <Building2 className="w-3 h-3" /> Properties
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white/60">{decodedVillaName}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/admin")} className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">{decodedVillaName}</h1>
              <p className="text-white/30 text-sm mt-0.5">{rooms.length} {rooms.length === 1 ? "room" : "rooms"}</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddingRoom(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" /> Add Room
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-red-400" style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.15)" }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Add Room Form */}
        {isAddingRoom && (
          <div className="mb-8 p-6 rounded-2xl border" style={{ background: "var(--surface-2)", borderColor: "var(--border-default)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-medium text-white flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-white/40" /> Add New Room
              </h3>
              <button onClick={() => setIsAddingRoom(false)} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Room Name *</label>
                  <input className={inputCls} style={inputStyle} value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })} placeholder="e.g. Room 101" />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Type</label>
                  <select
                    value={newRoom.type}
                    onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
                    className={inputCls}
                    style={{ ...inputStyle, appearance: "none" }}
                  >
                    <option value="villa">Villa</option>
                    <option value="apartment">Apartment</option>
                    <option value="suite">Suite</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Monthly Rent (£)", key: "price" as const },
                  { label: "Bedrooms", key: "bedrooms" as const },
                  { label: "Bathrooms", key: "bathrooms" as const },
                  { label: "Size (m²)", key: "size" as const },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-white/50 mb-1.5 block">{label}</label>
                    <input type="number" min="0" className={inputCls} style={inputStyle} value={newRoom[key] as number} onChange={(e) => setNewRoom({ ...newRoom, [key]: Number(e.target.value) })} />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-medium text-white/50 mb-1.5 block">Description</label>
                <textarea
                  rows={2}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none"
                  style={inputStyle}
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  placeholder="Brief description of the room"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleAddRoom}
                  disabled={!newRoom.name?.trim() || isSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Room
                </button>
                <button onClick={() => setIsAddingRoom(false)} className="px-4 py-2 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {rooms.length === 0 && !isAddingRoom ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "var(--surface-3)", border: "1px solid var(--border-subtle)" }}>
              <DoorOpen className="w-6 h-6 text-white/20" />
            </div>
            <h3 className="text-base font-medium text-white/60 mb-1">No rooms yet</h3>
            <p className="text-white/30 text-sm mb-5">Add rooms to this property to start managing them.</p>
            <button onClick={() => setIsAddingRoom(true)} className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors">
              <Plus className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Add First Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => navigate(`/admin/room/${room.id}`)}
                className="group text-left rounded-2xl overflow-hidden ds-card ds-card-hover transition-all duration-300"
              >
                <div className="relative h-40 overflow-hidden" style={{ background: "var(--surface-3)" }}>
                  {room.images?.[0] ? (
                    <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <DoorOpen className="w-8 h-8 text-white/10" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${room.available ? "text-emerald-300" : "text-amber-300"}`} style={{ background: room.available ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", backdropFilter: "blur(4px)" }}>
                      {room.available ? "To-let" : "Occupied"}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate group-hover:text-white/80 transition-colors">{room.name}</h3>
                      <p className="text-xs text-white/30 mt-0.5">{room.bedrooms} bed · {room.bathrooms} bath · {room.size}m²</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <span className="text-base font-semibold text-white">
                      {formatPrice(room.price)}<span className="text-xs font-normal text-white/30">/mo</span>
                    </span>
                    <button
                      className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                      onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }}
                      aria-label="Delete room"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VillaRoomsPage;
