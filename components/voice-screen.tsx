"use client"

import { ChevronLeft, X } from "lucide-react"

interface VoiceScreenProps {
  onNavigate: (screen: "home" | "photo" | "chat" | "voice") => void
}

export default function VoiceScreen({ onNavigate }: VoiceScreenProps) {
  return (
    <div className="bg-[#ffffff] rounded-xl overflow-hidden h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#f2f2f2]">
        <button onClick={() => onNavigate("home")} className="p-1">
          <ChevronLeft className="w-5 h-5 text-[#000000]" />
        </button>
        <div className="font-medium text-center flex-1">语音页</div>
        <div className="w-5"></div>
      </div>

      {/* Voice Content */}
      <div className="flex-1 overflow-auto p-4 bg-[#f5f5f5] flex flex-col items-center justify-center">
        <div className="text-right w-full mb-8">
          <div className="inline-block bg-white rounded-lg p-3 max-w-[80%]">
            <p className="text-sm text-right">这个酸奶含糖多不多？</p>
            <p className="text-sm text-right">你能不能吃?</p>
          </div>
        </div>

        <div className="w-full flex justify-center mb-8">
          <button onClick={() => onNavigate("home")} className="bg-[#07c160] text-white rounded-lg py-2 px-8 relative">
            <div className="h-4 flex items-center justify-center">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 mx-[1px] bg-white"
                  style={{
                    height: `${Math.sin(i / 3) * 8 + 10}px`,
                    opacity: i > 15 ? 0.5 : 1,
                  }}
                ></div>
              ))}
            </div>
          </button>
        </div>

        <button onClick={() => onNavigate("chat")} className="text-sm text-[#000000] mt-4">
          取消
        </button>
      </div>

      {/* Bottom Area */}
      <div className="p-4 bg-[#f5f5f5] border-t border-[#dadada] flex justify-end">
        <button
          onClick={() => onNavigate("home")}
          className="w-8 h-8 bg-[#f2f2f2] rounded-full flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* User Info */}
      <div className="bg-[#f5f5f5] p-4 flex items-center justify-center">
        <div className="text-xs text-[#6f6f6f]">长按说话，左滑取消，上滑发送</div>
      </div>
    </div>
  )
}
