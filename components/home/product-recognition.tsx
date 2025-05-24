import { Camera, Sparkles } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export function ProductRecognition() {
  return (
    <div className="px-6 py-4 animate-slide-up">
      <div className="flex items-center mb-4">
        <Sparkles className="w-5 h-5 text-indigo-600 mr-2" />
        <h2 className="text-base font-semibold text-slate-900">商品识别</h2>
      </div>
      
      <div className="relative bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 rounded-2xl overflow-hidden h-32 border border-slate-200/60 shadow-lg group hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <Link href={ROUTES.photo} aria-label="打开相机拍摄商品">
            <button 
              type="button"
              title="拍摄商品"
              className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center hover:bg-white hover:scale-105 transition-all duration-200 shadow-lg shadow-blue-500/20 border border-white/50"
            >
              <Camera className="w-7 h-7 text-slate-700" />
            </button>
          </Link>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/60 via-slate-900/40 to-transparent backdrop-blur-sm text-white text-sm py-3 text-center font-medium">
          对准商品 拍一拍
        </div>
      </div>
    </div>
  );
}