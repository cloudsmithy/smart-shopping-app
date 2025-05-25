import { ChevronDown, MapPin } from "lucide-react";

interface LocationDisplayProps {
  location: string;
  onLocationChange?: () => void;
}

export function LocationDisplay({ location, onLocationChange }: LocationDisplayProps) {
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
      
      <button 
        type="button"
        className="text-sm flex items-center text-slate-700 hover:text-slate-900 transition-colors duration-200 group"
        onClick={onLocationChange}
        aria-label="更改位置"
      >
        <span className="font-medium">{location}</span>
        <ChevronDown className="w-4 h-4 ml-2 text-slate-500 group-hover:text-slate-700 transition-colors" />
      </button>
    </div>
  );
}