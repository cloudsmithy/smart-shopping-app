interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "正在加载..." }: LoadingSpinnerProps) {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
        <div>{message}</div>
      </div>
    </div>
  );
}