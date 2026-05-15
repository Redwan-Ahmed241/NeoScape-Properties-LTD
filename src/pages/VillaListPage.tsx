"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  ChevronRight,
  Plus,
  Loader2,
  AlertCircle,
  Home,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await roomsApi.getRooms();
      setRooms(response.data || response);
    } catch (err: any) {
      setError(err.message || "Failed to fetch rooms");
    } finally {
      setIsLoading(false);
    }
  };

  // Group rooms by location to create virtual "villas"
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
    if (!newVillaName.trim()) return;
    // Navigate to the villa page — admin can add rooms there
    navigate(`/admin/villa/${encodeURIComponent(newVillaName.trim())}`);
    setShowAddVilla(false);
    setNewVillaName("");
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-pink-500 mx-auto" />
          <p className="text-gray-500 text-sm">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Properties
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {villas.length} {villas.length === 1 ? "villa" : "villas"} ·{" "}
              {rooms.length} total rooms
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-500 text-xs mt-1 hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Add Villa */}
      <div className="mb-6">
        {showAddVilla ? (
          <Card className="border-dashed border-2 border-pink-300 bg-pink-50/50">
            <CardContent className="p-5">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Label
                    htmlFor="villa-name"
                    className="text-sm font-medium text-gray-700"
                  >
                    New Villa / Property Name
                  </Label>
                  <Input
                    id="villa-name"
                    value={newVillaName}
                    onChange={(e) => setNewVillaName(e.target.value)}
                    placeholder="e.g. Manchester Villa Block A"
                    className="mt-1.5"
                    onKeyDown={(e) => e.key === "Enter" && handleAddVilla()}
                  />
                </div>
                <Button
                  onClick={handleAddVilla}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                  disabled={!newVillaName.trim()}
                >
                  Create
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddVilla(false);
                    setNewVillaName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button
            onClick={() => setShowAddVilla(true)}
            variant="outline"
            className="border-dashed border-2 hover:border-pink-400 hover:bg-pink-50 text-gray-600 hover:text-pink-600 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Villa
          </Button>
        )}
      </div>

      {/* Villa Grid */}
      {villas.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
            <Home className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            No properties yet
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            Add your first villa to start managing rooms.
          </p>
          <Button
            onClick={() => setShowAddVilla(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Villa
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {villas.map((villa) => (
            <Card
              key={villa.name}
              className="group cursor-pointer hover:shadow-xl hover:shadow-pink-100/50 transition-all duration-300 border border-gray-100 hover:border-pink-200 overflow-hidden"
              onClick={() =>
                navigate(
                  `/admin/villa/${encodeURIComponent(villa.name)}`
                )
              }
            >
              {/* Villa Image */}
              <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                {villa.previewImage ? (
                  <img
                    src={villa.previewImage}
                    alt={villa.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
                    <Building2 className="w-12 h-12 text-pink-300" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge className="bg-white/90 text-gray-700 backdrop-blur-sm shadow-sm border-0 text-xs font-medium">
                    {villa.roomCount}{" "}
                    {villa.roomCount === 1 ? "room" : "rooms"}
                  </Badge>
                </div>
              </div>

              {/* Villa Info */}
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-lg truncate group-hover:text-pink-600 transition-colors">
                      {villa.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{villa.name}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-pink-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                </div>

                {/* Status pills */}
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium text-emerald-700">
                      {villa.availableCount} to-let
                    </span>
                  </div>
                  {villa.unavailableCount > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-xs font-medium text-amber-700">
                        {villa.unavailableCount} occupied
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VillaListPage;
