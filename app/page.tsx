"use client";

import { useState, useEffect } from "react";
import HomeScreen from "@/components/home-screen";
import PhotoScreen from "@/components/photo-screen";
import ChatScreen from "@/components/chat-screen";
import { useAuth } from "@/hooks/use-auth";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<
    "home" | "photo" | "chat" | "voice"
  >("home");
  
  const { token, loading, error } = useAuth();
  
  // 可以添加加载状态的UI处理
  if (loading) {
    return <div className="flex justify-center items-center h-screen">正在初始化...</div>;
  }
  
  // 可以添加错误处理
  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">初始化失败: {error}</div>;
  }

  return (
    <div className="flex justify-center items-center w-full">
      <div className="w-full px-4 sm:px-6 md:max-w-lg">
        {currentScreen === "home" && (
          <HomeScreen onNavigate={setCurrentScreen} />
        )}
        {currentScreen === "photo" && (
          <PhotoScreen onNavigate={setCurrentScreen} />
        )}
        {currentScreen === "chat" && (
          <ChatScreen onNavigate={setCurrentScreen} />
        )}
      </div>
    </div>
  );
}
