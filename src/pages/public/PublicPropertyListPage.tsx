"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, Search, ArrowRight, DollarSign, Home, Key, LogIn, Sparkles } from "lucide-react";
import { publicApi } from "../../lib/tenantApi";

interface Property {
  name: string;
  roomCount: number;
  minPrice: number;
  maxPrice: number;
  imageUrl: string | null;
  allImages: string[];
  amenities: string[];
  roomTypes: string[];
}

export default function PublicPropertyListPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProperties() {
      try {
        setLoading(true);
        const data = await publicApi.getProperties();
        setProperties(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load properties");
      } finally {
        setLoading(false);
      }
    }
    loadProperties();
  }, []);

  const filteredProperties = properties.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Background Video */}
      <video
        className="fixed inset-0 w-full h-full object-cover"
        autoPlay loop muted playsInline
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4"
      />
      <div className="fixed inset-0" style={{ background: "rgba(5,5,5,0.78)" }} />

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
              <Link to="/" className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-tight text-white bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
                  NeoScape Properties
                </span>
              </Link>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate("/tenant/login")}
                  className="hidden sm:inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                >
                  <LogIn className="w-4 h-4" /> Tenant Portal
                </button>
                <button
                  onClick={() => navigate("/admin/login")}
                  className="hidden sm:inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                >
                  <Key className="w-4 h-4" /> Admin Login
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-semibold transition-all"
                >
                  Home
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-12 md:py-16 text-center max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-emerald-400 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Luxury Real Estate Collection
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4">
            Explore Premium Properties
          </h1>
          <p className="text-white/40 text-base max-w-xl mx-auto mb-8">
            Select one of our high-end locations to explore available rooms, suites, and premium amenities.
          </p>

          {/* Search bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search properties by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 w-full pl-10 pr-4 bg-white/[0.04] border border-white/15 hover:border-white/25 focus:border-white/40 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none transition-all"
            />
          </div>
        </section>

        {/* Properties Grid */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 flex-1 w-full">
          {loading ? (
            <div className="py-24 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-4" />
              <p className="text-white/40 text-sm">Discovering locations...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-400/80 bg-red-500/5 border border-red-500/10 rounded-2xl max-w-md mx-auto">
              <p>{error}</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="py-16 text-center text-white/30 bg-white/[0.02] border border-white/5 rounded-2xl max-w-md mx-auto">
              <p>No properties found matching "{search}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((prop) => (
                <div
                  key={prop.name}
                  className="group relative rounded-2xl overflow-hidden border border-white/[0.08] transition-all duration-300 hover:border-white/20 hover:-translate-y-1 flex flex-col h-full"
                  style={{
                    background: "rgba(12,12,12,0.65)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  {/* Property Image */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
                    {prop.imageUrl ? (
                      <img
                        src={prop.imageUrl}
                        alt={prop.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
                        <Building2 className="w-12 h-12 stroke-[1.5]" />
                        <span className="text-xs mt-2 font-medium">No Image Available</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* Badge: Available Rooms */}
                    <div className="absolute top-4 left-4 bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-emerald-500/20">
                      <Home className="w-3.5 h-3.5" />
                      {prop.roomCount} Rooms
                    </div>
                  </div>

                  {/* Property Info */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {prop.name}
                    </h3>
                    
                    {/* Price Range */}
                    <div className="flex items-center gap-1.5 text-white/60 text-sm mt-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      Starting from{" "}
                      <span className="font-semibold text-white">
                        ${prop.minPrice}
                      </span>{" "}
                      / mo
                    </div>

                    {/* Room Types */}
                    {prop.roomTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {prop.roomTypes.map((type) => (
                          <span
                            key={type}
                            className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 text-white/40 border border-white/[0.05]"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Amenities list */}
                    {prop.amenities.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-white/[0.06] flex-1">
                        <div className="text-[10px] font-semibold text-white/20 uppercase tracking-wider mb-2">
                          Key Amenities
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {prop.amenities.slice(0, 3).map((amenity) => (
                            <span
                              key={amenity}
                              className="text-xs text-white/50 bg-white/[0.02] border border-white/[0.04] px-2 py-1 rounded-lg"
                            >
                              {amenity}
                            </span>
                          ))}
                          {prop.amenities.length > 3 && (
                            <span className="text-xs text-white/30 px-1.5 py-1">
                              +{prop.amenities.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action */}
                    <button
                      onClick={() => navigate(`/properties/${encodeURIComponent(prop.name)}`)}
                      className="mt-6 w-full h-11 bg-white hover:bg-white/90 active:scale-95 text-black font-semibold text-sm rounded-xl flex items-center justify-center gap-1.5 transition-all"
                    >
                      View Details <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/[0.08] py-8 text-center text-xs text-white/20 relative z-10 bg-black/60 backdrop-blur-md">
          &copy; {new Date().getFullYear()} NeoScape Properties. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
