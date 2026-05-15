"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Save,
  X,
  DoorOpen,
  Loader2,
  AlertCircle,
  Building2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
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

  const [newRoom, setNewRoom] = useState<Partial<Room>>({
    name: "",
    type: "villa",
    price: 0,
    rating: 0,
    reviews: 0,
    images: [],
    amenities: [],
    description: "",
    location: decodedVillaName,
    maxGuests: 1,
    bedrooms: 1,
    bathrooms: 1,
    size: 30,
    available: true,
  });

  useEffect(() => {
    fetchRooms();
  }, [decodedVillaName]);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await roomsApi.getRooms({ location: decodedVillaName });
      const allRooms: Room[] = response.data || response;
      // Filter by exact location match
      const filtered = allRooms.filter(
        (r) => r.location === decodedVillaName
      );
      setRooms(filtered);
    } catch (err: any) {
      setError(err.message || "Failed to fetch rooms");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoom.name) return;
    try {
      setError(null);
      const roomData = {
        name: newRoom.name,
        type: newRoom.type || "villa",
        price: newRoom.price || 0,
        rating: 0,
        reviews: 0,
        images: [],
        amenities: newRoom.amenities || [],
        description: newRoom.description || "",
        location: decodedVillaName,
        maxGuests: newRoom.maxGuests || 1,
        bedrooms: newRoom.bedrooms || 1,
        bathrooms: newRoom.bathrooms || 1,
        size: newRoom.size || 30,
        available: newRoom.available ?? true,
      };
      await roomsApi.createRoom(roomData);
      await fetchRooms();
      setNewRoom({
        name: "",
        type: "villa",
        price: 0,
        description: "",
        location: decodedVillaName,
        maxGuests: 1,
        bedrooms: 1,
        bathrooms: 1,
        size: 30,
        available: true,
        amenities: [],
        images: [],
      });
      setIsAddingRoom(false);
    } catch (err: any) {
      setError(err.message || "Failed to create room");
    }
  };

  const handleDeleteRoom = async (id: number | string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    try {
      await roomsApi.deleteRoom(String(id));
      await fetchRooms();
    } catch (err: any) {
      setError(err.message || "Failed to delete room");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-pink-500 mx-auto" />
          <p className="text-gray-500 text-sm">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button
          onClick={() => navigate("/admin")}
          className="hover:text-pink-600 transition-colors flex items-center gap-1"
        >
          <Building2 className="w-3.5 h-3.5" />
          Properties
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-medium truncate">
          {decodedVillaName}
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin")}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {decodedVillaName}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {rooms.length} {rooms.length === 1 ? "room" : "rooms"}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsAddingRoom(true)}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Room
        </Button>
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

      {/* Add Room Form */}
      {isAddingRoom && (
        <Card className="mb-8 border-dashed border-2 border-pink-300 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-pink-500" />
                Add New Room
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingRoom(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="room-name">Room Name *</Label>
                <Input
                  id="room-name"
                  value={newRoom.name}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, name: e.target.value })
                  }
                  placeholder="e.g. Room 101"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="room-type">Type</Label>
                <select
                  id="room-type"
                  value={newRoom.type}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, type: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                >
                  <option value="villa">Villa</option>
                  <option value="apartment">Apartment</option>
                  <option value="suite">Suite</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="room-price">Monthly Rent</Label>
                <Input
                  id="room-price"
                  type="number"
                  value={newRoom.price}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, price: Number(e.target.value) })
                  }
                  min="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="room-bedrooms">Bedrooms</Label>
                <Input
                  id="room-bedrooms"
                  type="number"
                  value={newRoom.bedrooms}
                  onChange={(e) =>
                    setNewRoom({
                      ...newRoom,
                      bedrooms: Number(e.target.value),
                    })
                  }
                  min="1"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="room-bathrooms">Bathrooms</Label>
                <Input
                  id="room-bathrooms"
                  type="number"
                  value={newRoom.bathrooms}
                  onChange={(e) =>
                    setNewRoom({
                      ...newRoom,
                      bathrooms: Number(e.target.value),
                    })
                  }
                  min="1"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="room-size">Size (m²)</Label>
                <Input
                  id="room-size"
                  type="number"
                  value={newRoom.size}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, size: Number(e.target.value) })
                  }
                  min="1"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="room-desc">Description</Label>
              <Textarea
                id="room-desc"
                value={newRoom.description}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, description: e.target.value })
                }
                placeholder="Brief description of the room"
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleAddRoom}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                disabled={!newRoom.name?.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Room
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddingRoom(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Room Cards */}
      {rooms.length === 0 && !isAddingRoom ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
            <DoorOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            No rooms yet
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            Add rooms to this property to start managing them.
          </p>
          <Button
            onClick={() => setIsAddingRoom(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Room
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map((room) => (
            <Card
              key={room.id}
              className="group cursor-pointer hover:shadow-xl hover:shadow-pink-100/50 transition-all duration-300 border border-gray-100 hover:border-pink-200 overflow-hidden"
              onClick={() => navigate(`/admin/room/${room.id}`)}
            >
              {/* Room Image */}
              <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                {room.images?.[0] ? (
                  <img
                    src={room.images[0]}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
                    <DoorOpen className="w-10 h-10 text-purple-300" />
                  </div>
                )}

                {/* Status badge */}
                <div className="absolute top-3 right-3">
                  <Badge
                    className={`text-xs font-medium border-0 shadow-sm backdrop-blur-sm ${
                      room.available
                        ? "bg-emerald-500/90 text-white"
                        : "bg-amber-500/90 text-white"
                    }`}
                  >
                    {room.available ? "To-let" : "Occupied"}
                  </Badge>
                </div>
              </div>

              {/* Room Info */}
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-pink-600 transition-colors">
                      {room.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {room.bedrooms} bed · {room.bathrooms} bath ·{" "}
                      {room.size}m²
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-pink-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(room.price)}
                    <span className="text-xs font-normal text-gray-400">
                      /month
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRoom(room.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VillaRoomsPage;
