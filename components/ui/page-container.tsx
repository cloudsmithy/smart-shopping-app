import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex justify-center items-center w-full p-4">
      <div className={cn(
        "w-full max-w-md mx-auto",
        className
      )}>
        <div className="bg-white/80 backdrop-blur-glass rounded-3xl shadow-2xl shadow-blue-500/10 overflow-hidden min-h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] flex flex-col border border-white/20 animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}