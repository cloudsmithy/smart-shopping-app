"use client";

import { ChevronLeft, Camera, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import MicrophoneButton from "@/components/microphone-button";

export default function ChatPage() {
  const router = useRouter();

  const handleNavigate = (screen: string) => {
    if (screen === "home") {
      router.push("/");
    } else if (screen === "photo") {
      router.push("/photo");
    }
  };

  return (
    <div className="bg-[#ffffff] rounded-xl overflow-hidden h-[100vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#f2f2f2]">
        <button onClick={() => router.push("/")} className="p-1">
          <ChevronLeft className="w-5 h-5 text-[#000000]" />
        </button>
        <div className="font-medium text-center flex-1">对话页</div>
        <div className="w-5"></div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-auto p-4 bg-[#f5f5f5]">
        <div className="flex justify-end mb-4">
          <div className="max-w-[70%] bg-[#000000] text-white rounded-2xl py-2 px-4">
            <p className="text-sm">妈妈，中午好！今天有什么好吃的吗?</p>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <div className="max-w-[70%]">
            <div className="bg-white rounded-lg p-3 mb-2">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm">图片上传完成</div>
                <Check className="w-4 h-4 text-[#07c160]" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm">识别为 光明酸奶200ml 装</div>
                <Check className="w-4 h-4 text-[#07c160]" />
              </div>
              <button
                onClick={() => router.push("/photo")}
                className="text-[#07c160] text-sm"
              >
                识别有误 重新拍照
              </button>
            </div>
          </div>
          <div className="w-16 h-16 ml-2 rounded-lg overflow-hidden">
            <img
              src="/placeholder.svg?height=64&width=64"
              alt="Product thumbnail"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="mt-auto">
          <div className="bg-[#000000] text-white text-xs rounded-lg py-2 px-4 mb-2 m-[20px] h-[40px] flex items-center justify-center">
            我有 3 个小忙可以帮您，请点击选择：
          </div>
          <div className="flex gap-2 justify-center">
            <button className="bg-[#14171885] text-white text-xs py-2 px-6 rounded-lg h-[40px]">
              食物对比
            </button>
            <button className="bg-[#14171885] text-white text-xs py-2 px-6 rounded-lg h-[40px]">
              全网比价
            </button>
            <button className="bg-[#14171885] text-white text-xs py-2 px-6 rounded-lg h-[40px]">
              卡路里计算
            </button>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-2 flex items-center justify-center gap-4 bg-[#f5f5f5] border-t border-[#dadada]">
        <button
          onClick={() => router.push("/photo")}
          className="w-12 h-12 bg-[#000000] rounded-full flex items-center justify-center"
        >
          <Camera className="w-6 h-6 text-white" />
        </button>
        <MicrophoneButton onNavigate={handleNavigate} />
      </div>
    </div>
  );
}