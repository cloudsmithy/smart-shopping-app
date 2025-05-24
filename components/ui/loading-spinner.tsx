import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "正在加载..." }: LoadingSpinnerProps) {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="text-center animate-fade-in">
        <div className="relative mb-6">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <div className="absolute inset-0 w-10 h-10 border-2 border-blue-200 rounded-full animate-pulse mx-auto"></div>
        </div>
        <p className="text-slate-700 font-medium">{message}</p>
      </div>
    </div>
  );
}