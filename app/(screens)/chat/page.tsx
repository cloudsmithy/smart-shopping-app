"use client";

import { Camera, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { PageContainer } from "@/components/ui/page-container";
import MicrophoneButton from "@/components/microphone-button";

interface PhotoData {
  imageUrl: string;
  photoUrl: string;
  recognitionResult: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);

  useEffect(() => {
    // Check for photo data from sessionStorage
    const storedPhotoData = sessionStorage.getItem('photoData');
    if (storedPhotoData) {
      setPhotoData(JSON.parse(storedPhotoData));
      // Clear the data after reading
      sessionStorage.removeItem('photoData');
    }
  }, []);

  const handleNavigate = (screen: string) => {
    if (screen === "home") {
      router.push("/");
    } else if (screen === "photo") {
      router.push("/photo");
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="对话页"
        showBackButton
        onBack={() => router.push("/")}
      />

      {/* Chat Content */}
      <div className="flex-1 overflow-auto p-4 bg-[#f5f5f5]">
        <div className="flex justify-end mb-4">
          <div className="max-w-[70%] bg-[#000000] text-white rounded-2xl py-2 px-4">
            <p className="text-sm">妈妈，中午好！今天有什么好吃的吗?</p>
          </div>
        </div>

        {photoData && (
          <div className="flex justify-end mb-4">
            <div className="max-w-[70%]">
              <div className="bg-white rounded-lg p-3 mb-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm">图片上传完成</div>
                  <Check className="w-4 h-4 text-[#07c160]" />
                </div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm">识别为 {photoData.recognitionResult}</div>
                  <Check className="w-4 h-4 text-[#07c160]" />
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/photo")}
                  className="text-[#07c160] text-sm hover:text-green-600 transition-colors"
                >
                  识别有误 重新拍照
                </button>
              </div>
            </div>
            <div className="w-16 h-16 ml-2 rounded-lg overflow-hidden">
              <img
                src={photoData.photoUrl}
                alt="Product thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <div className="mt-auto">
          <div className="bg-[#000000] text-white text-xs rounded-lg py-2 px-4 mb-2 m-[20px] h-[40px] flex items-center justify-center">
            我有 3 个小忙可以帮您，请点击选择：
          </div>
          <div className="flex gap-2 justify-center">
            <button 
              type="button"
              className="bg-[#14171885] text-white text-xs py-2 px-6 rounded-lg h-[40px] hover:bg-gray-600 transition-colors"
            >
              食物对比
            </button>
            <button 
              type="button"
              className="bg-[#14171885] text-white text-xs py-2 px-6 rounded-lg h-[40px] hover:bg-gray-600 transition-colors"
            >
              全网比价
            </button>
            <button 
              type="button"
              className="bg-[#14171885] text-white text-xs py-2 px-6 rounded-lg h-[40px] hover:bg-gray-600 transition-colors"
            >
              卡路里计算
            </button>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-2 flex items-center justify-center gap-4 bg-[#f5f5f5] border-t border-[#dadada]">
        <button
          type="button"
          onClick={() => router.push("/photo")}
          className="w-12 h-12 bg-[#000000] rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
          aria-label="拍照"
        >
          <Camera className="w-6 h-6 text-white" />
        </button>
        <MicrophoneButton onNavigate={handleNavigate} />
      </div>
    </PageContainer>
  );
}
