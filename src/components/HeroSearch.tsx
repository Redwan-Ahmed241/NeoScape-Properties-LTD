"use client";

import type React from "react";
import { useState } from "react";
import { Search, MapPin, Calendar, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { SearchFilters } from "../lib/types";

interface HeroSearchProps {
  onSearch: (filters: SearchFilters) => void;
}

const HeroSearch: React.FC<HeroSearchProps> = ({ onSearch }) => {
  const [searchData, setSearchData] = useState({
    location: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      ...searchData,
      priceRange: [0, 1000],
      minPrice: 0,
      maxPrice: 1000,
      roomType: "",
      amenities: [],
    });
  };

  return (
    <div className="bg-white rounded-xl md:rounded-full shadow-lg border border-gray-200 p-3 md:p-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-0"
      >
        {/* Location */}
        <div className="flex-1 px-4 md:px-6 py-3 md:py-4 md:border-r border-gray-200 rounded-lg md:rounded-none bg-gray-50 md:bg-transparent">
          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-900 mb-1">
                Where
              </label>
              <Input
                type="text"
                placeholder="Search destinations"
                value={searchData.location}
                onChange={(e) =>
                  setSearchData({ ...searchData, location: e.target.value })
                }
                className="border-0 p-0 text-sm placeholder-gray-500 focus:ring-0 bg-transparent"
              />
            </div>
          </div>
        </div>

        {/* Date Inputs Container - Mobile: Single Row, Desktop: Separate */}
        <div className="flex flex-col md:flex-row md:flex-1 gap-4 md:gap-0">
          {/* Check-in */}
          <div className="flex-1 px-4 md:px-6 py-3 md:py-4 md:border-r border-gray-200 rounded-lg md:rounded-none bg-gray-50 md:bg-transparent">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-gray-900 mb-1">
                  Check in
                </label>
                <Input
                  type="date"
                  value={searchData.checkIn}
                  onChange={(e) =>
                    setSearchData({ ...searchData, checkIn: e.target.value })
                  }
                  className="border-0 p-0 text-sm focus:ring-0 bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Check-out */}
          <div className="flex-1 px-4 md:px-6 py-3 md:py-4 md:border-r border-gray-200 rounded-lg md:rounded-none bg-gray-50 md:bg-transparent">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-gray-900 mb-1">
                  Check out
                </label>
                <Input
                  type="date"
                  value={searchData.checkOut}
                  onChange={(e) =>
                    setSearchData({ ...searchData, checkOut: e.target.value })
                  }
                  className="border-0 p-0 text-sm focus:ring-0 bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Guests and Search Button Container */}
        <div className="flex gap-4 md:gap-0 md:flex-1">
          {/* Guests */}
          <div className="flex-1 px-4 md:px-6 py-3 md:py-4 rounded-lg md:rounded-none bg-gray-50 md:bg-transparent">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-gray-900 mb-1">
                  Who
                </label>
                <select
                  value={searchData.guests}
                  onChange={(e) =>
                    setSearchData({
                      ...searchData,
                      guests: Number(e.target.value),
                    })
                  }
                  aria-label="Number of guests"
                  className="border-0 p-0 text-sm bg-transparent focus:ring-0 w-full"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num} guest{num > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="flex items-center px-2 md:px-2">
            <Button
              type="submit"
              className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl md:rounded-full h-12 w-full md:w-12 px-6 md:px-0 flex items-center justify-center gap-2 md:gap-0"
            >
              <Search className="w-5 h-5" />
              <span className="md:hidden font-medium">Search</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default HeroSearch;
