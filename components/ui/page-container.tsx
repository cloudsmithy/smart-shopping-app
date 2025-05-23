import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className="flex justify-center items-center w-full">
      <div className={`w-full px-4 sm:px-6 md:max-w-lg ${className}`}>
        <div className="bg-[#ffffff] rounded-xl overflow-hidden h-[100vh] flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}