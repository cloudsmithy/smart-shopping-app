import { ChevronLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function PageHeader({ title, onBack, showBackButton = false }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-[#f2f2f2]">
      {showBackButton && onBack ? (
        <button 
          type="button"
          onClick={onBack} 
          className="p-1"
          aria-label="返回"
        >
          <ChevronLeft className="w-5 h-5 text-[#000000]" />
        </button>
      ) : (
        <div className="w-5"></div>
      )}
      <div className="font-medium text-center flex-1">{title}</div>
      <div className="w-5"></div>
    </div>
  );
}