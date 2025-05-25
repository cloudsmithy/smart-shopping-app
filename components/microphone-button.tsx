"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Mic } from "lucide-react";
import type React from "react";

interface MicrophoneButtonProps {
  onNavigate: (screen: string) => void;
  onAudioRecorded?: (audioFile: File) => void;
  isProcessing?: boolean;
}

export default function MicrophoneButton({
  onNavigate,
  onAudioRecorded,
  isProcessing = false,
}: MicrophoneButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [gesture, setGesture] = useState<"none" | "left" | "up">("none");
  const [isRecording, setIsRecording] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize audio context
  useEffect(() => {
    const context = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    setAudioContext(context);

    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
      }
      if (context.state !== "closed") {
        context.close();
      }
    };
  }, []);

  // Start recording function
  const startRecording = async () => {
    try {
      setError(null);

      if (!audioContext) {
        throw new Error("Audio context not initialized");
      }

      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Process recorded audio
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        audioChunksRef.current = [];

        // Create File object and send to parent
        if (audioBlob.size > 0 && onAudioRecorded) {
          try {
            const audioFile = new File([audioBlob], "recording.wav", {
              type: "audio/wav",
            });
            onAudioRecorded(audioFile);
          } catch (error) {
            console.error("Error creating audio file:", error);
          }
        }
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("无法访问麦克风，请确保已授予麦克风权限。");
    }
  };

  // Stop recording function
  const stopRecording = (shouldSave: boolean) => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
      setAudioStream(null);
    }

    setIsRecording(false);

    if (!shouldSave) {
      // Clear recorded chunks if not saving
      audioChunksRef.current = [];
    }
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsPressed(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setStartPos({ x: clientX, y: clientY });
    setCurrentPos({ x: clientX, y: clientY });
    setGesture("none");

    // Start recording when button is pressed
    startRecording();
  };

  const handleTouchMove = () => {
    if (!isPressed) return;
  };

  const handleTouchEnd = () => {
    if (!isPressed) return;

    // 不管任何手势，都直接停止录音并保存
    stopRecording(true);
    setIsPressed(false);
  };

  // 简化按钮样式，只有按下缩放效果
  const buttonTransform = isPressed ? "scale(1.1)" : "scale(1)";

  const buttonStyle = {
    transform: buttonTransform,
    transition: isPressed ? "none" : "transform 0.2s ease",
  };

  return (
    <>
      {/* 全屏遮罩和录音提示 - 使用Portal渲染到body */}
      {isRecording && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center"
          style={{
            pointerEvents: 'none',
          }}
        >
          <div className="flex flex-col items-center space-y-8">
            {/* 录音动画圆圈 */}
            <div className="relative">
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl">
                    <Mic className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              {/* 录音脉冲效果 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-blue-500/20 rounded-full animate-ping" />
              </div>
            </div>
            
            {/* 提示文字 */}
            <div className="text-center space-y-2">
              <p className="text-white text-xl font-medium">按住说话，松开结束</p>
              <p className="text-white/70 text-sm">正在录音中...</p>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="relative">
        {error && (
          <div 
            className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-500/90 backdrop-blur-sm rounded-xl whitespace-nowrap shadow-lg text-force-white"
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              padding: '8px 16px',
              fontSize: '12px',
              zIndex: 60,
            }}
          >
            <span style={{color: '#ffffff'}}>{error}</span>
          </div>
        )}

        <button
          type="button"
          className={`w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 transition-all duration-200 relative ${
            isRecording ? 'z-[9998]' : 'z-50'
          } ${
            isProcessing ? "opacity-50 cursor-not-allowed" : "hover:from-blue-700 hover:to-indigo-800 hover:shadow-2xl hover:shadow-blue-500/40"
          } ${isPressed ? "scale-110" : "scale-100"}`}
          style={{
            ...buttonStyle,
            backgroundColor: '#2563eb', // fallback color
          }}
          onTouchStart={isProcessing ? undefined : handleTouchStart}
          onTouchMove={isProcessing ? undefined : handleTouchMove}
          onTouchEnd={isProcessing ? undefined : handleTouchEnd}
          onMouseDown={isProcessing ? undefined : handleTouchStart}
          onMouseMove={isProcessing ? undefined : handleTouchMove}
          onMouseUp={isProcessing ? undefined : handleTouchEnd}
          onMouseLeave={isProcessing ? undefined : handleTouchEnd}
          disabled={isProcessing}
          aria-label="录音按钮"
        >
          <Mic
            className={`w-7 h-7 ${
              isRecording || isProcessing ? "animate-pulse" : ""
            }`}
            style={{color: '#ffffff'}}
          />
        </button>
      </div>
    </>
  );
}
