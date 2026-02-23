"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Home,
  FileText,
  DollarSign,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { roomsApi } from "../lib/api";
import { formatPrice } from "../lib/utils";
import type { Room } from "../lib/types";
import DocumentManager from "../components/DocumentManager";
import RentScheduler from "../components/RentScheduler";

const AdminPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingRoom, setIsAddingRoom] = useState(false);

  const [newRoom, setNewRoom] = useState<Partial<Room>>({
    name: "",
    type: "villa",
    price: 0,
    rating: 4.5,
    reviews: 0,
    images: [""],
    amenities: [],
    description: "",
    location: "",
    maxGuests: 1,
    bedrooms: 1,
    bathrooms: 1,
    size: 30,
    available: true,
  });

  // Fetch rooms on component mount
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
      console.error("Error fetching rooms:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRoom = async () => {
    if (newRoom.name && newRoom.location && newRoom.price) {
      try {
        const roomData = {
          name: newRoom.name,
          type: newRoom.type || "villa",
          price: newRoom.price,
          rating: newRoom.rating || 4.5,
          reviews: newRoom.reviews || 0,
          images: newRoom.images?.filter((img) => img.trim()) || [
            "/placeholder.svg",
          ],
          amenities: newRoom.amenities || [],
          description: newRoom.description || "",
          location: newRoom.location,
          maxGuests: newRoom.maxGuests || 1,
          bedrooms: newRoom.bedrooms || 1,
          bathrooms: newRoom.bathrooms || 1,
          size: newRoom.size || 30,
          available: newRoom.available ?? true,
        };

        await roomsApi.createRoom(roomData);
        await fetchRooms(); // Refresh the list

        // Reset form
        setNewRoom({
          name: "",
          type: "villa",
          price: 0,
          rating: 4.5,
          reviews: 0,
          images: [""],
          amenities: [],
          description: "",
          location: "",
          maxGuests: 1,
          bedrooms: 1,
          bathrooms: 1,
          size: 30,
          available: true,
        });
        setIsAddingRoom(false);
      } catch (err: any) {
        setError(err.message || "Failed to create room");
        console.error("Error creating room:", err);
      }
    }
  };

  const handleDeleteRoom = async (id: number | string) => {
    if (confirm("Are you sure you want to delete this room?")) {
      try {
        await roomsApi.deleteRoom(String(id));
        await fetchRooms(); // Refresh the list
      } catch (err: any) {
        setError(err.message || "Failed to delete room");
        console.error("Error deleting room:", err);
      }
    }
  };

  const toggleAvailability = async (id: number | string) => {
    try {
      const room = rooms.find((r) => String(r.id) === String(id));
      if (room) {
        await roomsApi.updateRoom(String(id), { available: !room.available });
        await fetchRooms(); // Refresh the list
      }
    } catch (err: any) {
      setError(err.message || "Failed to update room availability");
      console.error("Error updating room:", err);
    }
  };

  const addAmenity = (amenity: string) => {
    if (!newRoom.amenities?.includes(amenity)) {
      setNewRoom({
        ...newRoom,
        amenities: [...(newRoom.amenities || []), amenity],
      });
    }
  };

  const removeAmenity = (amenity: string) => {
    setNewRoom({
      ...newRoom,
      amenities: newRoom.amenities?.filter((a) => a !== amenity) || [],
    });
  };

  const addImageField = () => {
    setNewRoom({
      ...newRoom,
      images: [...(newRoom.images || []), ""],
    });
  };

  const updateImage = (index: number, value: string) => {
    const updatedImages = [...(newRoom.images || [])];
    updatedImages[index] = value;
    setNewRoom({
      ...newRoom,
      images: updatedImages,
    });
  };

  const removeImage = (index: number) => {
    setNewRoom({
      ...newRoom,
      images: newRoom.images?.filter((_, i) => i !== index) || [],
    });
  };

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((room) => room.available).length;
  const averagePrice =
    rooms.length > 0
      ? rooms.reduce((sum, room) => sum + room.price, 0) / rooms.length
      : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your properties, documents, and rent collection
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-700"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Tabs for different sections */}
        <Tabs defaultValue="rooms" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Rooms
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="rent" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Rent Collection
            </TabsTrigger>
          </TabsList>

          {/* Rooms Management Tab */}
          <TabsContent value="rooms" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Rooms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold text-gray-900">
                    {totalRooms}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Available Rooms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold text-green-600">
                    {availableRooms}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">
                    {totalRooms - availableRooms} unavailable
                  </div>
                </CardContent>
              </Card>

              <Card className="sm:col-span-2 lg:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Average Price
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold text-gray-900">
                    {formatPrice(averagePrice)}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">
                    per night
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Add Room Button */}
            <div className="mb-6">
              <Button
                onClick={() => setIsAddingRoom(true)}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Room
              </Button>
            </div>

            {/* Add Room Form */}
            {isAddingRoom && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Add New Room
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
                      <Label htmlFor="name">Room Name</Label>
                      <Input
                        id="name"
                        value={newRoom.name}
                        onChange={(e) =>
                          setNewRoom({ ...newRoom, name: e.target.value })
                        }
                        placeholder="Enter room name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={newRoom.location}
                        onChange={(e) =>
                          setNewRoom({ ...newRoom, location: e.target.value })
                        }
                        placeholder="Enter location"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <select
                        id="type"
                        aria-label="Room type"
                        value={newRoom.type}
                        onChange={(e) =>
                          setNewRoom({ ...newRoom, type: e.target.value })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="villa">Villa</option>
                        <option value="apartment">Apartment</option>
                        <option value="suite">Suite</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="price">Price per night</Label>
                      <Input
                        id="price"
                        type="number"
                        value={newRoom.price}
                        onChange={(e) =>
                          setNewRoom({
                            ...newRoom,
                            price: Number(e.target.value),
                          })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxGuests">Max Guests</Label>
                      <Input
                        id="maxGuests"
                        type="number"
                        value={newRoom.maxGuests}
                        onChange={(e) =>
                          setNewRoom({
                            ...newRoom,
                            maxGuests: Number(e.target.value),
                          })
                        }
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bedrooms">Bedrooms</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        value={newRoom.bedrooms}
                        onChange={(e) =>
                          setNewRoom({
                            ...newRoom,
                            bedrooms: Number(e.target.value),
                          })
                        }
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        value={newRoom.bathrooms}
                        onChange={(e) =>
                          setNewRoom({
                            ...newRoom,
                            bathrooms: Number(e.target.value),
                          })
                        }
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="size">Size (m²)</Label>
                      <Input
                        id="size"
                        type="number"
                        value={newRoom.size}
                        onChange={(e) =>
                          setNewRoom({
                            ...newRoom,
                            size: Number(e.target.value),
                          })
                        }
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newRoom.description}
                      onChange={(e) =>
                        setNewRoom({ ...newRoom, description: e.target.value })
                      }
                      placeholder="Enter room description"
                      rows={3}
                    />
                  </div>

                  {/* Images */}
                  <div>
                    <Label>Images</Label>
                    <div className="space-y-2">
                      {newRoom.images?.map((image, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={image}
                            onChange={(e) => updateImage(index, e.target.value)}
                            placeholder="Enter image URL"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeImage(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addImageField}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Image
                      </Button>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div>
                    <Label>Amenities</Label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {[
                        "WiFi",
                        "Air Conditioning",
                        "TV",
                        "Kitchen",
                        "Pool",
                        "Gym",
                        "Parking",
                        "Breakfast",
                      ].map((amenity) => (
                        <Badge
                          key={amenity}
                          variant={
                            newRoom.amenities?.includes(amenity)
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() =>
                            newRoom.amenities?.includes(amenity)
                              ? removeAmenity(amenity)
                              : addAmenity(amenity)
                          }
                        >
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                    {newRoom.amenities && newRoom.amenities.length > 0 && (
                      <div className="text-sm text-gray-600">
                        Selected: {newRoom.amenities.join(", ")}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddRoom}
                      className="bg-pink-500 hover:bg-pink-600"
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

            {/* Rooms List - Mobile-First Design */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">All Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                {rooms.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      No rooms found. Add your first room to get started.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View */}
                    <div className="block md:hidden space-y-4">
                      {rooms.map((room) => (
                        <Card key={room.id} className="border border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3 mb-3">
                              <img
                                src={room.images?.[0] || "/placeholder.svg"}
                                alt={room.name}
                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {room.name}
                                </h4>
                                <p className="text-sm text-gray-500 mb-1">
                                  {room.location}
                                </p>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge
                                    variant="outline"
                                    className="capitalize text-xs"
                                  >
                                    {room.type}
                                  </Badge>
                                  <Badge
                                    variant={
                                      room.available ? "default" : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {room.available
                                      ? "Available"
                                      : "Unavailable"}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-between items-center mb-3 text-sm">
                              <div className="font-medium text-lg">
                                {formatPrice(room.price)}
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="text-yellow-500">★</span>
                                <span>{room.rating}</span>
                                <span className="text-gray-500">
                                  ({room.reviews})
                                </span>
                              </div>
                            </div>

                            <div className="text-xs text-gray-500 mb-3">
                              {room.bedrooms} bed • {room.bathrooms} bath
                            </div>

                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleAvailability(room.id)}
                              >
                                {room.available ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  console.log("Edit room:", room.id)
                                }
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRoom(room.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Room</th>
                            <th className="text-left py-3 px-4">Type</th>
                            <th className="text-left py-3 px-4">Location</th>
                            <th className="text-left py-3 px-4">Price</th>
                            <th className="text-left py-3 px-4">Rating</th>
                            <th className="text-left py-3 px-4">Status</th>
                            <th className="text-left py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rooms.map((room) => (
                            <tr
                              key={room.id}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-3">
                                  <img
                                    src={room.images?.[0] || "/placeholder.svg"}
                                    alt={room.name}
                                    className="w-12 h-12 object-cover rounded-lg"
                                  />
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {room.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {room.bedrooms} bed • {room.bathrooms}{" "}
                                      bath
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className="capitalize">
                                  {room.type}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                {room.location}
                              </td>
                              <td className="py-3 px-4 font-medium">
                                {formatPrice(room.price)}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-1">
                                  <span className="text-yellow-500">★</span>
                                  <span>{room.rating}</span>
                                  <span className="text-gray-500 text-sm">
                                    ({room.reviews})
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  variant={
                                    room.available ? "default" : "secondary"
                                  }
                                >
                                  {room.available ? "Available" : "Unavailable"}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleAvailability(room.id)}
                                  >
                                    {room.available ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      console.log("Edit room:", room.id)
                                    }
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteRoom(room.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Management Tab */}
          <TabsContent value="documents">
            <DocumentManager />
          </TabsContent>

          {/* Rent Collection Tab */}
          <TabsContent value="rent">
            <RentScheduler />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
