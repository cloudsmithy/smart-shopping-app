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

  const handleClick = () => {
    if (isRecording) {
      // 如果正在录音，点击按钮停止录音
      stopRecording(true);
    } else {
      // 如果没有录音，点击按钮开始录音
      startRecording();
    }
  };

  // 按钮样式
  const buttonStyle = {
    transform: "scale(1)",
    transition: "transform 0.2s ease",
  };

  return (
    <>
      {/* 全屏遮罩和录音提示 - 使用Portal渲染到body */}
      {isRecording && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center"
          style={{
            pointerEvents: 'auto',
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
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <p className="text-white text-xl font-medium">语音对话中...</p>
              </div>
              
              {/* 取消录音按钮 */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    stopRecording(false); // 不保存录音
                  }}
                  className="w-12 h-12 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 border border-red-500/30"
                  style={{ pointerEvents: 'auto' }}
                  aria-label="取消录音"
                >
                <svg 
                  className="w-6 h-6 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                                 </svg>
               </button>
             </div>
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
          }`}
          style={{
            ...buttonStyle,
            backgroundColor: '#2563eb', // fallback color
          }}
          onClick={isProcessing ? undefined : handleClick}
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
