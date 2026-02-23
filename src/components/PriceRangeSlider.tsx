"use client";

import type React from "react";
import { useState } from "react";
import { formatPrice } from "../lib/utils";

interface PriceRangeSliderProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min: number;
  max: number;
}

const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  value,
  onChange,
  min,
  max,
}) => {
  const [localValue, setLocalValue] = useState(value);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Number(e.target.value);
    const newValue: [number, number] = [
      newMin,
      Math.max(newMin, localValue[1]),
    ];
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Number(e.target.value);
    const newValue: [number, number] = [
      Math.min(localValue[0], newMax),
      newMax,
    ];
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span>{formatPrice(localValue[0])}</span>
        <span>{formatPrice(localValue[1])}</span>
      </div>

      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={localValue[0]}
          onChange={handleMinChange}
          aria-label="Minimum price"
          title="Minimum price"
          className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={localValue[1]}
          onChange={handleMaxChange}
          aria-label="Maximum price"
          title="Maximum price"
          className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
      </div>

      <div className="flex items-center space-x-4 text-sm">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Min price</label>
          <input
            type="number"
            value={localValue[0]}
            onChange={(e) => handleMinChange(e)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            min={min}
            max={max}
            title="Min price"
            placeholder="Min"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Max price</label>
          <input
            type="number"
            value={localValue[1]}
            onChange={(e) => handleMaxChange(e)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            min={min}
            max={max}
            title="Max price"
            placeholder="Max"
          />
        </div>
      </div>
    </div>
  );
};

export default PriceRangeSlider;
