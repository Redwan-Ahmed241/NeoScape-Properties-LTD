"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Building2, 
  ArrowLeft, 
  PoundSterling, 
  Maximize2, 
  Users, 
  Bed, 
  Bath, 
  Check, 
  Sparkles,
  MapPin,
  Layers,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { publicApi } from "../../lib/tenantApi";
import InterestFormModal from "../../components/InterestFormModal";

interface Room {
  id: number;
  name: string;
  type: string;
  price: number;
  images: string[];
  amenities: string[];
  description: string;
  location: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  size: number;
  available: boolean;
}

export default function PublicPropertyDetailPage() {
  const { name: propertyName } = useParams<{ name: string }>();
  const decodedPropertyName = decodeURIComponent(propertyName || "");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<{ id: number; name: string } | undefined>(undefined);

  // Active image sliders dictionary: roomID -> active index
  const [activeImageIndexes, setActiveImageIndexes] = useState<Record<number, number>>({});

  useEffect(() => {
    async function loadRooms() {
      if (!decodedPropertyName) return;
      try {
        setLoading(true);
        // Load rooms filtered by location
        const data = await publicApi.getRooms({ location: decodedPropertyName });
        setRooms(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load rooms details");
      } finally {
        setLoading(false);
      }
    }
    loadRooms();
  }, [decodedPropertyName]);

  const handleOpenInterest = (roomId: number, roomName: string) => {
    setSelectedRoom({ id: roomId, name: roomName });
    setIsModalOpen(true);
  };

  const handleNextImage = (roomId: number, totalImages: number) => {
    setActiveImageIndexes((prev) => {
      const current = prev[roomId] || 0;
      return {
        ...prev,
        [roomId]: (current + 1) % totalImages,
      };
    });
  };

  const handlePrevImage = (roomId: number, totalImages: number) => {
    setActiveImageIndexes((prev) => {
      const current = prev[roomId] || 0;
      return {
        ...prev,
        [roomId]: (current - 1 + totalImages) % totalImages,
      };
    });
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Background Video */}
      <video
        className="fixed inset-0 w-full h-full object-cover"
        autoPlay loop muted playsInline
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4"
      />
      <div className="fixed inset-0" style={{ background: "rgba(5,5,5,0.8)" }} />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation Header */}
        <header
          className="sticky top-0 z-50 border-b"
          style={{
            background: "rgba(5,5,5,0.55)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/properties" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-semibold">Back to Properties</span>
              </Link>
              
              <span className="hidden md:inline-block text-sm text-white/40">
                NeoScape Luxury Portfolio
              </span>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-12 text-center max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
            <MapPin className="w-3.5 h-3.5" /> {decodedPropertyName}
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-2">
            Available Residencies
          </h1>
          <p className="text-white/40 text-sm max-w-xl mx-auto">
            Browse our catalog of premium suites and spaces in {decodedPropertyName}. Book a tour or express your interest directly.
          </p>
        </section>

        {/* Rooms Listing */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 flex-1 w-full space-y-12">
          {loading ? (
            <div className="py-24 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-4" />
              <p className="text-white/40 text-sm">Loading available spaces...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-400/80 bg-red-500/5 border border-red-500/10 rounded-2xl max-w-md mx-auto">
              <p>{error}</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="py-20 text-center text-white/30 bg-white/[0.02] border border-white/5 rounded-2xl max-w-md mx-auto">
              <Building2 className="w-12 h-12 stroke-[1.2] text-white/10 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-white mb-1">No Rooms Available</h3>
              <p className="text-xs text-white/40">Check back later or explore other properties in our portfolio.</p>
            </div>
          ) : (
            rooms.map((room) => {
              const activeImgIndex = activeImageIndexes[room.id] || 0;
              const hasImages = room.images && room.images.length > 0;
              
              return (
                <div
                  key={room.id}
                  className="rounded-2xl overflow-hidden border border-white/[0.08] flex flex-col lg:flex-row h-full transition-all duration-300 hover:border-white/15 shadow-xl"
                  style={{
                    background: "rgba(10,10,10,0.72)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  {/* Left Side: Image Slider */}
                  <div className="relative w-full lg:w-[45%] aspect-[16/10] lg:aspect-auto min-h-[300px] bg-white/5 shrink-0 overflow-hidden">
                    {hasImages ? (
                      <>
                        <img
                          src={room.images[activeImgIndex]}
                          alt={`${room.name} view`}
                          className="w-full h-full object-cover transition-opacity duration-300"
                        />
                        
                        {/* Slide controllers */}
                        {room.images.length > 1 && (
                          <>
                            <button
                              onClick={() => handlePrevImage(room.id, room.images.length)}
                              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full border border-white/10 text-white transition-colors"
                              aria-label="Previous image"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleNextImage(room.id, room.images.length)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full border border-white/10 text-white transition-colors"
                              aria-label="Next image"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            
                            {/* Slide indicators */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                              {room.images.map((_, i) => (
                                <span
                                  key={i}
                                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                                    i === activeImgIndex ? "bg-white w-3" : "bg-white/40"
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
                        <Building2 className="w-16 h-16 stroke-[1.2]" />
                        <span className="text-xs mt-2 font-medium">No Images Available</span>
                      </div>
                    )}
                    
                    {/* Top Type Tag */}
                    <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-white/10">
                      {room.type}
                    </div>
                  </div>

                  {/* Right Side: Details */}
                  <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Name & Pricing */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-white/[0.06] pb-4 mb-4">
                        <div>
                          <h3 className="text-2xl font-semibold text-white tracking-tight">{room.name}</h3>
                          <div className="flex items-center gap-1.5 text-white/40 text-xs mt-1">
                            <Layers className="w-3.5 h-3.5" /> Room ID: #{room.id}
                          </div>
                        </div>
                        <div className="flex items-baseline gap-1 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
                          <PoundSterling className="w-4 h-4 text-emerald-400 -mr-0.5" />
                          <span className="text-2xl font-bold text-white">{room.price}</span>
                          <span className="text-xs text-white/40">/ mo</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-white/60 text-sm leading-relaxed mb-6">
                        {room.description || "Experience standard high-quality living spaces curated by NeoScape Properties. Features modern finishes and excellent natural lighting."}
                      </p>

                      {/* Specs Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl mb-6">
                        <div className="flex items-center gap-2.5">
                          <Maximize2 className="w-4 h-4 text-emerald-400" />
                          <div>
                            <div className="text-[10px] text-white/30 uppercase font-semibold">Area Size</div>
                            <div className="text-xs font-semibold text-white">{room.size} sqft</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Users className="w-4 h-4 text-emerald-400" />
                          <div>
                            <div className="text-[10px] text-white/30 uppercase font-semibold">Occupancy</div>
                            <div className="text-xs font-semibold text-white">{room.maxGuests} Guests</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Bed className="w-4 h-4 text-emerald-400" />
                          <div>
                            <div className="text-[10px] text-white/30 uppercase font-semibold">Bedrooms</div>
                            <div className="text-xs font-semibold text-white">{room.bedrooms} Bed</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Bath className="w-4 h-4 text-emerald-400" />
                          <div>
                            <div className="text-[10px] text-white/30 uppercase font-semibold">Bathrooms</div>
                            <div className="text-xs font-semibold text-white">{room.bathrooms} Bath</div>
                          </div>
                        </div>
                      </div>

                      {/* Amenities */}
                      {room.amenities && room.amenities.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2.5">
                            Included Amenities
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {room.amenities.map((amenity) => (
                              <span
                                key={amenity}
                                className="flex items-center gap-1 text-xs text-white/70 bg-white/[0.03] border border-white/[0.06] px-3 py-1 rounded-xl"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Booking interest CTA */}
                    <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        Ready to Move In
                      </div>
                      <button
                        onClick={() => handleOpenInterest(room.id, room.name)}
                        className="px-6 py-3 bg-white hover:bg-white/90 active:scale-95 text-black font-semibold text-sm rounded-xl transition-all shadow-lg shadow-white/5"
                      >
                        Express Interest
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/[0.08] py-8 text-center text-xs text-white/20 relative z-10 bg-black/60 backdrop-blur-md">
          &copy; {new Date().getFullYear()} NeoScape Properties. All rights reserved.
        </footer>
      </div>

      {/* Booking Interest Form Modal */}
      <InterestFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedRoom(undefined); }}
        roomId={selectedRoom?.id}
        roomName={selectedRoom?.name}
        propertyName={decodedPropertyName}
      />
    </div>
  );
}
