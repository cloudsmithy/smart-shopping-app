import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
  className?: string;
}

export function PageHeader({ title, onBack, showBackButton = false, className }: PageHeaderProps) {
  return (
    <div className={cn(
      "flex items-center justify-between px-6 py-4 border-b border-slate-200/60 bg-white/60 backdrop-blur-sm", 
      className
    )}>
      {showBackButton && onBack ? (
        <button 
          type="button"
          onClick={onBack} 
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100/80 active:bg-slate-200/80 transition-all duration-200 group"
          aria-label="返回"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700 group-hover:text-slate-900 transition-colors" />
        </button>
      ) : (
        <div className="w-10"></div>
      )}
      
      <h1 className="font-semibold text-lg text-slate-900 text-center flex-1 tracking-tight">
        {title}
      </h1>
      
      <div className="w-10"></div>
    </div>
  );
}