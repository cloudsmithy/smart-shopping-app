import { ChevronDown } from "lucide-react";

interface LocationDisplayProps {
  location: string;
  onLocationChange?: () => void;
}

export function LocationDisplay({ location, onLocationChange }: LocationDisplayProps) {
  return (
    <div className="flex items-center px-4 py-3">
      <div className="w-5 h-5 bg-[#000000] rounded-full flex items-center justify-center mr-2">
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
      <button 
        type="button"
        className="text-sm flex items-center"
        onClick={onLocationChange}
        aria-label="更改位置"
      >
        {location} <ChevronDown className="w-4 h-4 ml-1" />
      </button>
    </div>
  );
}