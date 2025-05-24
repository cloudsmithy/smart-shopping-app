import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="text-center max-w-md mx-auto animate-fade-in">
        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h3 className="text-lg font-semibold text-slate-900 mb-3">出现错误</h3>
        <p className="text-slate-600 mb-6 leading-relaxed">{message}</p>
        
        {onRetry && (
          <button 
            type="button"
            onClick={onRetry}
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 shadow-lg shadow-red-600/25 hover:shadow-xl hover:shadow-red-600/30 font-medium"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            重试
          </button>
        )}
      </div>
    </div>
  );
}