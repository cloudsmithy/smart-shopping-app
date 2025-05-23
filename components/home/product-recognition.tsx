import { Camera } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export function ProductRecognition() {
  return (
    <div className="px-4 py-2">
      <div className="text-sm font-medium mb-2">商品识别</div>
      <div className="relative bg-[#f5f5f5] rounded-lg overflow-hidden h-28">
        <div className="absolute inset-0 flex items-center justify-center">
          <Link href={ROUTES.photo} aria-label="打开相机拍摄商品">
            <button 
              type="button"
              className="w-12 h-12 bg-[#ffffff] rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <Camera className="w-6 h-6 text-[#000000]" />
            </button>
          </Link>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-[#00000080] text-white text-xs py-2 text-center">
          对准商品 拍一拍
        </div>
      </div>
    </div>
  );
}