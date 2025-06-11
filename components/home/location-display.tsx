"use client";

import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPERMARKET_OPTIONS } from "@/lib/constants";

interface LocationDisplayProps {
  location: string;
  onLocationChange?: (newLocation: string) => void;
}

export function LocationDisplay({ location, onLocationChange }: LocationDisplayProps) {
  const [selectedLocation, setSelectedLocation] = useState(location);

  const handleLocationSelect = (newLocation: string) => {
    setSelectedLocation(newLocation);
    onLocationChange?.(newLocation);
  };

  return (
    <div className="flex items-center px-6 py-4 animate-fade-in">
      <div 
        className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/25 mr-3 icon-force-white"
        style={{
          background: 'linear-gradient(to bottom right, #3b82f6, #4f46e5)',
          boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.25), 0 4px 6px -2px rgba(59, 130, 246, 0.05)'
        }}
      >
        <MapPin className="w-4 h-4 text-white" />
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            type="button"
            className="text-sm flex items-center text-slate-700 hover:text-slate-900 transition-colors duration-200 group"
            aria-label="选择超市位置"
          >
            <span className="font-medium">{selectedLocation}</span>
            <ChevronDown className="w-4 h-4 ml-2 text-slate-500 group-hover:text-slate-700 transition-colors" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {SUPERMARKET_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleLocationSelect(option.label)}
              className="cursor-pointer"
            >
              <span className="text-sm">{option.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}