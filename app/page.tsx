"use client";

import { ChevronDown, Camera, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { token, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        正在初始化...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        初始化失败: {error}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center w-full">
      <div className="w-full px-4 sm:px-6 md:max-w-lg">
        <div className="bg-[#ffffff] rounded-xl overflow-hidden h-[100vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#f2f2f2]">
            <div className="font-medium text-center flex-1">首页</div>
            <div className="w-5"></div>
          </div>

          {/* Location */}
          <div className="flex items-center px-4 py-3">
            <div className="w-5 h-5 bg-[#000000] rounded-full flex items-center justify-center mr-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div className="text-sm flex items-center">
              上海市黄浦区马当路富民超市{" "}
              <ChevronDown className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Product Recognition */}
          <div className="px-4 py-2">
            <div className="text-sm font-medium mb-2">商品识别</div>
            <div className="relative bg-[#f5f5f5] rounded-lg overflow-hidden h-28">
              <div className="absolute inset-0 flex items-center justify-center">
                <Link href="/photo">
                  <button className="w-12 h-12 bg-[#ffffff] rounded-full flex items-center justify-center">
                    <Camera className="w-6 h-6 text-[#000000]" />
                  </button>
                </Link>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-[#00000080] text-white text-xs py-2 text-center">
                对准商品 拍一拍
              </div>
            </div>
          </div>

          {/* Voice Assistant Button */}
          <Link href="/photo">
            <button className="mx-4 mt-3 bg-[#07c160] text-white py-3 rounded-md text-center w-full">
              打开语音购物助手
            </button>
          </Link>

          {/* AI Recommendations */}
          <div className="flex items-center justify-between px-4 mt-4">
            <div className="flex items-center">
              <span className="font-bold mr-1">AI</span>
              <span className="text-sm">帮你聪明买</span>
            </div>
            <div className="text-xs text-[#979797] flex items-center">
              日用食品 <ChevronDown className="w-3 h-3 ml-1" />
            </div>
          </div>

          {/* Product List */}
          <div className="flex-1 overflow-auto px-4 mt-2">
            {["安全的食用油", "无添加剂的深海鱼", "正宗的五常大米"].map(
              (item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-[#f2f2f2]"
                >
                  <div>
                    <div className="text-sm">{item}</div>
                    <div className="text-xs text-[#979797] mt-1">
                      选购指南 今日在售
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#979797]" />
                </div>
              )
            )}
            <div className="flex justify-center mt-4 mb-2">
              <button className="text-xs text-[#979797] flex items-center">
                更多 <ChevronDown className="w-3 h-3 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
