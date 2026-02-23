"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import HeroSearch from "../components/HeroSearch";
import RoomCard from "../components/RoomCard";
import FilterChips from "../components/FilterChips";
import { useRooms } from "../hooks/useRooms";
import { mockRooms } from "../lib/mockData";
import type { SearchFilters } from "../lib/types";

const HomePage: React.FC = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    location: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    priceRange: [0, 1000],
    minPrice: 0,
    maxPrice: 1000,
    roomType: "",
    amenities: [],
  });

  const {
    rooms: rawRooms,
    loading,
    error,
  } = useRooms({
    location: filters.location,
    checkIn: filters.checkIn,
    checkOut: filters.checkOut,
    guests: filters.guests,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    roomType: filters.roomType,
    amenities: filters.amenities,
  });

  const rooms = Array.isArray(rawRooms) ? rawRooms : mockRooms;

  const [selectedVilla, setSelectedVilla] = useState<string>("");

  const villaNames = useMemo(() => {
    const safeRooms = Array.isArray(rooms) ? rooms : [];
    const villas = safeRooms.filter((room) => room.type === "villa");

    const names = villas.map((room) => room.name.split(" - ")[0].trim());
    return Array.from(new Set(names));
  }, [rooms]);

  useEffect(() => {
    if (villaNames.length > 0 && !selectedVilla) {
      setSelectedVilla(villaNames[0]);
    }
  }, [villaNames, selectedVilla]);

  const filteredRooms = useMemo(() => {
    const safeRooms = Array.isArray(rooms) ? rooms : [];
    if (!selectedVilla) return safeRooms;
    return safeRooms.filter((room) => room.name.startsWith(selectedVilla));
  }, [rooms, selectedVilla]);

  const handleSearch = (searchFilters: SearchFilters) => {
    setFilters(searchFilters);
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white">
        <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-3 md:mb-4 leading-tight">
              Find your perfect stay
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Discover amazing places to stay around the world
            </p>
          </div>

          <HeroSearch onSearch={handleSearch} />
        </div>
      </div>

      {villaNames.length > 0 && (
        <div className="bg-white border-b border-gray-100 py-3 md:py-4 overflow-x-auto">
          <div className="flex space-x-3 md:space-x-4 justify-start md:justify-center px-4 md:px-0 min-w-max md:min-w-0">
            {villaNames.map((villa) => (
              <button
                key={villa}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold text-sm md:text-base transition-colors whitespace-nowrap flex-shrink-0 ${
                  selectedVilla === villa
                    ? "bg-pink-500 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-pink-50 hover:border-pink-200"
                }`}
                onClick={() => setSelectedVilla(villa)}
              >
                {villa}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <FilterChips filters={filters} onFilterChange={handleFilterChange} />
        </div>
      </div>

      <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 md:mb-6 gap-2">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
            {filteredRooms.length} stays found
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-8 md:py-12">
            <p className="text-gray-500 text-base md:text-lg">
              No rooms found matching your criteria.
            </p>
            <p className="text-gray-400 mt-2 text-sm md:text-base">
              Try adjusting your filters or search terms.
            </p>
          </div>
        )}
      </div>

      <section className="py-12 md:py-16 px-4 max-w-7xl 2xl:max-w-screen-2xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 md:mb-4">
            Featured Accommodations
          </h2>
          <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
            Discover our most popular rooms with exceptional ratings and
            stunning amenities
          </p>
        </div>
        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredRooms.slice(0, 6).map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 md:py-12">
            <p className="text-slate-600 mb-4">
              No rooms available at the moment.
            </p>
            <p className="text-sm text-slate-500">
              Please check back later or contact us for availability.
            </p>
          </div>
        )}
      </section>

      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center bg-white border-0 shadow-sm p-4 md:p-6 rounded-lg">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <span
                  role="img"
                  aria-label="MapPin"
                  className="text-lg md:text-xl"
                >
                  📍
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-1 md:mb-2">
                1+
              </h3>
              <p className="text-slate-600 text-sm md:text-base">
                Premium Villas
              </p>
            </div>
            <div className="text-center bg-white border-0 shadow-sm p-4 md:p-6 rounded-lg">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <span
                  role="img"
                  aria-label="Users"
                  className="text-lg md:text-xl"
                >
                  👥
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-1 md:mb-2">
                9+
              </h3>
              <p className="text-slate-600 text-sm md:text-base">
                Luxury Rooms
              </p>
            </div>
            <div className="text-center bg-white border-0 shadow-sm p-4 md:p-6 rounded-lg">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <span
                  role="img"
                  aria-label="Star"
                  className="text-lg md:text-xl"
                >
                  ⭐
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-1 md:mb-2">
                4.8
              </h3>
              <p className="text-slate-600 text-sm md:text-base">
                Average Rating
              </p>
            </div>
            <div className="text-center bg-white border-0 shadow-sm p-4 md:p-6 rounded-lg">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <span
                  role="img"
                  aria-label="Award"
                  className="text-lg md:text-xl"
                >
                  🏆
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-1 md:mb-2">
                100%
              </h3>
              <p className="text-slate-600 text-sm md:text-base">
                Satisfaction Rate
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 px-4 max-w-7xl 2xl:max-w-screen-2xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 md:mb-4">
            Why Choose VillaEase?
          </h2>
          <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
            Experience luxury, comfort, and exceptional service in every stay
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-8">
          <div className="text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <span
                role="img"
                aria-label="Star"
                className="text-xl md:text-2xl"
              >
                ⭐
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-3 md:mb-4">
              Premium Quality
            </h3>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              Every room is carefully selected and maintained to ensure the
              highest standards of luxury and comfort.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <span
                role="img"
                aria-label="Users"
                className="text-xl md:text-2xl"
              >
                👥
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-3 md:mb-4">
              24/7 Support
            </h3>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              Our dedicated team is available around the clock to ensure your
              stay is perfect from start to finish.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <span
                role="img"
                aria-label="MapPin"
                className="text-xl md:text-2xl"
              >
                📍
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-3 md:mb-4">
              Prime Locations
            </h3>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              All our villas are located in the most desirable destinations with
              easy access to attractions and amenities.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
