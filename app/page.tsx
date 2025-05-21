"use client"

import { useState } from "react"
import HomeScreen from "@/components/home-screen"
import PhotoScreen from "@/components/photo-screen"
import ChatScreen from "@/components/chat-screen"
import VoiceScreen from "@/components/voice-screen"

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<"home" | "photo" | "chat" | "voice">("home")

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#000000] p-4">
      <div className="max-w-sm w-full">
        {currentScreen === "home" && <HomeScreen onNavigate={setCurrentScreen} />}
        {currentScreen === "photo" && <PhotoScreen onNavigate={setCurrentScreen} />}
        {currentScreen === "chat" && <ChatScreen onNavigate={setCurrentScreen} />}
        {currentScreen === "voice" && <VoiceScreen onNavigate={setCurrentScreen} />}
      </div>
    </div>
  )
}
