"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, MapPin, ChevronRight, Plus, Loader2, AlertCircle, Home, X } from "lucide-react";
import { roomsApi } from "../lib/api";
import type { Room } from "../lib/types";

interface Villa {
  name: string;
  roomCount: number;
  availableCount: number;
  unavailableCount: number;
  rooms: Room[];
  previewImage: string;
}

const VillaListPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddVilla, setShowAddVilla] = useState(false);
  const [newVillaName, setNewVillaName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await roomsApi.getRooms();
      setRooms(response.data || response);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch properties");
    } finally {
      setIsLoading(false);
    }
  };

  const villas = useMemo<Villa[]>(() => {
    const grouped: Record<string, Room[]> = {};
    rooms.forEach((room) => {
      const key = room.location || "Unassigned";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(room);
    });
    return Object.entries(grouped)
      .map(([name, villaRooms]) => ({
        name,
        roomCount: villaRooms.length,
        availableCount: villaRooms.filter((r) => r.available).length,
        unavailableCount: villaRooms.filter((r) => !r.available).length,
        rooms: villaRooms,
        previewImage: villaRooms[0]?.images?.[0] || "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rooms]);

  const handleAddVilla = async () => {
    const trimmedName = newVillaName.trim();
    if (!trimmedName) return;
    const exists = villas.some((v) => v.name.toLowerCase() === trimmedName.toLowerCase());
    if (!exists) {
      try {
        setIsCreating(true);
        await roomsApi.createRoom({
          name: "Main Room", type: "villa", price: 0,
          location: trimmedName, description: "Default room for this property",
          maxGuests: 1, bedrooms: 1, bathrooms: 1, size: 0, amenities: [], images: [],
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to create property");
        setIsCreating(false);
        return;
      } finally {
        setIsCreating(false);
      }
    }
    navigate(`/admin/villa/${encodeURIComponent(trimmedName)}`);
    setShowAddVilla(false);
    setNewVillaName("");
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-white/30 mx-auto" />
          <p className="text-white/30 text-sm">Loading properties…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Frosted content panel */}
      <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(8,8,8,0.65)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.07)" }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Properties</h1>
            <p className="text-white/40 text-sm mt-1">
              {villas.length} {villas.length === 1 ? "property" : "properties"} · {rooms.length} total rooms
            </p>
          </div>
          <button
            onClick={() => setShowAddVilla(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Property
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

        {/* Add Villa Form */}
        {showAddVilla && (
          <div className="mb-6 p-5 rounded-2xl border" style={{ background: "var(--surface-2)", borderColor: "var(--border-default)" }}>
            <p className="text-sm font-medium text-white mb-3">New Property Name</p>
            <div className="flex gap-3">
              <input
                autoFocus
                value={newVillaName}
                onChange={(e) => setNewVillaName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddVilla()}
                placeholder="e.g. Manchester Villa Block A"
                className="flex-1 h-10 rounded-xl px-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                style={{ background: "var(--surface-3)", border: "1px solid var(--border-subtle)" }}
              />
              <button
                onClick={handleAddVilla}
                disabled={!newVillaName.trim() || isCreating}
                className="px-5 h-10 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Create
              </button>
              <button
                onClick={() => { setShowAddVilla(false); setNewVillaName(""); }}
                className="px-4 h-10 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {villas.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "var(--surface-3)", border: "1px solid var(--border-subtle)" }}>
              <Home className="w-6 h-6 text-white/20" />
            </div>
            <h3 className="text-base font-medium text-white/60 mb-1">No properties yet</h3>
            <p className="text-white/30 text-sm mb-5">Add your first property to start managing rooms.</p>
            <button
              onClick={() => setShowAddVilla(true)}
              className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Add Property
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {villas.map((villa) => (
              <button
                key={villa.name}
                onClick={() => navigate(`/admin/villa/${encodeURIComponent(villa.name)}`)}
                className="group text-left rounded-2xl overflow-hidden ds-card ds-card-hover transition-all duration-300"
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden" style={{ background: "var(--surface-3)" }}>
                  {villa.previewImage ? (
                    <img src={villa.previewImage} alt={villa.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-10 h-10 text-white/10" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium text-white/70" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
                      {villa.roomCount} {villa.roomCount === 1 ? "room" : "rooms"}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate group-hover:text-white/80 transition-colors">{villa.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-white/30">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{villa.name}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(16,185,129,0.1)", color: "rgb(52,211,153)" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {villa.availableCount} to-let
                    </span>
                    {villa.unavailableCount > 0 && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(245,158,11,0.1)", color: "rgb(251,191,36)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        {villa.unavailableCount} occupied
                      </span>
                    )}
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

export default VillaListPage;
