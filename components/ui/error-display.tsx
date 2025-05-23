interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center text-red-500">
        <div className="mb-4">{message}</div>
        {onRetry && (
          <button 
            type="button"
            onClick={onRetry}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            重试
          </button>
        )}
      </div>
    </div>
  );
}