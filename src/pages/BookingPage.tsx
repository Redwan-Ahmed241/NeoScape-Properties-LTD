import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Star, Users, ArrowLeft } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useRoom } from "../hooks/useRooms";
import BookingForm from "../components/BookingForm";
import { useAuth } from "../hooks/useAuth";

const BookingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { room, loading, error } = useRoom(id || "");
  const [showForm, setShowForm] = useState(false);

  const handleBookNow = () => {
    if (isAuthenticated) {
      setShowForm(true);
      // Scroll to form on mobile
      if (window.innerWidth < 1024) {
        document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate("/login", { state: { from: `/booking/${id}` } });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading room details...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Room not found</h2>
          <p className="text-gray-600 mb-4">{error || "Unable to load this room right now."}</p>
          <Button onClick={() => navigate("/")}>Back to home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Listings
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Room Details - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={room.images?.[0] || "/placeholder.svg"}
                  alt={room.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                      {room.name}
                    </h1>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-1 text-pink-500" />
                      <span>{room.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-pink-600">${room.price}</div>
                    <div className="text-sm text-gray-500">per night</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-6 py-4 border-y border-gray-100">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-bold">{room.rating}</span>
                    <span className="text-gray-500 ml-1">({room.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{room.maxGuests} guests maximum</span>
                  </div>
                  <Badge variant={room.available ? "default" : "secondary"}>
                    {room.available ? "Available" : "Currently Booked"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-50 p-4 rounded-xl text-center">
                    <div className="text-xl font-bold text-gray-900">{room.bedrooms}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Bedrooms</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl text-center">
                    <div className="text-xl font-bold text-gray-900">{room.bathrooms}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Bathrooms</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl text-center">
                    <div className="text-xl font-bold text-gray-900">{room.size}m²</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Total Area</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl text-center">
                    <div className="text-xl font-bold text-gray-900 capitalize">{room.type}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Property Type</div>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities?.map((amenity) => (
                      <Badge
                        key={amenity}
                        variant="outline"
                        className="py-1.5 px-3 bg-white hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 transition-colors"
                      >
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Description</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {room.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form - 1 column */}
          <div id="booking-form" className="lg:col-span-1">
            <div className="sticky top-24">
              <BookingForm room={room} />

              {/* Trust badges/info */}
              <div className="mt-6 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Instant confirmation</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-8a1 1 0 012 0v4a1 1 0 11-2 0v-4zm1-5a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Secure payment processed on arrival</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Book Now Floating Button - only shown when form is not visible */}
      {!showForm && (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] z-40">
          <Button
            onClick={handleBookNow}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-6 rounded-2xl shadow-2xl font-bold text-lg"
          >
            Check Availability & Book
          </Button>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
